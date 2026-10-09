/**
 * SIAP SEKOLAH — IndexedDB Helper (Offline-First PWA)
 * Uses the `idb` library for a Promise-based IndexedDB API.
 *
 * Stores:
 *  - pending_syncs   : Evaluations & parent responses queued for sync
 *  - cached_students : Student list cache for offline display
 *  - cached_configs  : Assessment config rubrik for offline form rendering
 *  - cached_batches  : Active batch cache
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type {
  PendingSync,
  Student,
  AssessmentConfigParsed,
  Batch,
  EvaluationParsed,
} from "@/types";

// ─── DB Schema Definition ──────────────────────────────────────

interface SiapSekolahDB extends DBSchema {
  pending_syncs: {
    key: string; // client_id
    value: PendingSync;
    indexes: {
      by_type: string;
      by_created_at: string;
    };
  };
  cached_students: {
    key: string; // student id
    value: Student & { cached_at: string };
    indexes: {
      by_batch: string;
    };
  };
  cached_configs: {
    key: number; // pos_number
    value: AssessmentConfigParsed & { cached_at: string };
  };
  cached_batches: {
    key: string; // batch id
    value: Batch & { cached_at: string };
  };
  draft_evaluations: {
    key: string; // `${student_id}:${pos_number}`
    value: Partial<EvaluationParsed> & {
      draft_key: string;
      saved_at: string;
    };
  };
}

// ─── DB Instance (Singleton) ───────────────────────────────────

const DB_NAME = "siap-sekolah-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SiapSekolahDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SiapSekolahDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SiapSekolahDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // pending_syncs store
        if (!db.objectStoreNames.contains("pending_syncs")) {
          const syncStore = db.createObjectStore("pending_syncs", {
            keyPath: "client_id",
          });
          syncStore.createIndex("by_type", "type");
          syncStore.createIndex("by_created_at", "created_at");
        }

        // cached_students store
        if (!db.objectStoreNames.contains("cached_students")) {
          const studentStore = db.createObjectStore("cached_students", {
            keyPath: "id",
          });
          studentStore.createIndex("by_batch", "batch_id");
        }

        // cached_configs store
        if (!db.objectStoreNames.contains("cached_configs")) {
          db.createObjectStore("cached_configs", { keyPath: "pos_number" });
        }

        // cached_batches store
        if (!db.objectStoreNames.contains("cached_batches")) {
          db.createObjectStore("cached_batches", { keyPath: "id" });
        }

        // draft_evaluations store
        if (!db.objectStoreNames.contains("draft_evaluations")) {
          db.createObjectStore("draft_evaluations", { keyPath: "draft_key" });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Pending Sync Operations ───────────────────────────────────

/** Add an evaluation or parent response to the sync queue */
export async function enqueuePendingSync(sync: PendingSync): Promise<void> {
  const db = await getDB();
  await db.put("pending_syncs", sync);
}

/** Get all pending syncs, ordered by created_at */
export async function getAllPendingSyncs(): Promise<PendingSync[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("pending_syncs", "by_created_at");
  return all;
}

/** Remove a successfully synced item from the queue */
export async function removePendingSync(client_id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pending_syncs", client_id);
}

/** Update retry count and error for a failed sync */
export async function updateSyncRetry(
  client_id: string,
  error: string
): Promise<void> {
  const db = await getDB();
  const existing = await db.get("pending_syncs", client_id);
  if (existing) {
    await db.put("pending_syncs", {
      ...existing,
      retry_count: existing.retry_count + 1,
      last_error: error,
    });
  }
}

/** Count pending items — used for sync indicator badge */
export async function countPendingSyncs(): Promise<number> {
  const db = await getDB();
  return db.count("pending_syncs");
}

// ─── Student Cache Operations ──────────────────────────────────

/** Cache student list from server */
export async function cacheStudents(students: Student[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("cached_students", "readwrite");
  const now = new Date().toISOString();
  await Promise.all([
    ...students.map((s) =>
      tx.store.put({ ...s, cached_at: now })
    ),
    tx.done,
  ]);
}

/** Get cached students by batch */
export async function getCachedStudentsByBatch(
  batch_id: string
): Promise<Student[]> {
  const db = await getDB();
  return db.getAllFromIndex("cached_students", "by_batch", batch_id);
}

/** Get all cached students */
export async function getAllCachedStudents(): Promise<Student[]> {
  const db = await getDB();
  return db.getAll("cached_students");
}

// ─── Assessment Config Cache ───────────────────────────────────

/** Cache rubrik configs for all 5 pos */
export async function cacheAssessmentConfigs(
  configs: AssessmentConfigParsed[]
): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const tx = db.transaction("cached_configs", "readwrite");
  await Promise.all([
    ...configs.map((c) => tx.store.put({ ...c, cached_at: now })),
    tx.done,
  ]);
}

/** Get cached config for a specific pos */
export async function getCachedConfig(
  pos_number: number
): Promise<AssessmentConfigParsed | undefined> {
  const db = await getDB();
  const result = await db.get("cached_configs", pos_number);
  if (!result) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cached_at, ...config } = result;
  return config as AssessmentConfigParsed;
}

// ─── Batch Cache ───────────────────────────────────────────────

/** Cache the active batch */
export async function cacheActiveBatch(batch: Batch): Promise<void> {
  const db = await getDB();
  await db.put("cached_batches", {
    ...batch,
    cached_at: new Date().toISOString(),
  });
}

/** Get cached batch by ID */
export async function getCachedBatch(batch_id: string): Promise<Batch | undefined> {
  const db = await getDB();
  const result = await db.get("cached_batches", batch_id);
  if (!result) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cached_at, ...batch } = result;
  return batch as Batch;
}

// ─── Draft Evaluation Operations ───────────────────────────────

type DraftKey = `${string}:${number}`; // `${student_id}:${pos_number}`

/** Save draft evaluation (auto-save on every change) */
export async function saveDraftEvaluation(
  student_id: string,
  pos_number: number,
  draft: Partial<EvaluationParsed>
): Promise<void> {
  const db = await getDB();
  const draft_key: DraftKey = `${student_id}:${pos_number}`;
  await db.put("draft_evaluations", {
    ...draft,
    draft_key,
    saved_at: new Date().toISOString(),
  });
}

/** Load draft evaluation for a student's pos form */
export async function loadDraftEvaluation(
  student_id: string,
  pos_number: number
): Promise<Partial<EvaluationParsed> | undefined> {
  const db = await getDB();
  const draft_key: DraftKey = `${student_id}:${pos_number}`;
  const result = await db.get("draft_evaluations", draft_key);
  if (!result) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { draft_key: _key, saved_at: _saved, ...draft } = result;
  return draft as Partial<EvaluationParsed>;
}

/** Delete draft after successful submission */
export async function clearDraftEvaluation(
  student_id: string,
  pos_number: number
): Promise<void> {
  const db = await getDB();
  const draft_key: DraftKey = `${student_id}:${pos_number}`;
  await db.delete("draft_evaluations", draft_key);
}

// ─── Client ID Generator ───────────────────────────────────────

/** Generate a client-side UUID for offline tracking */
export function generateClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Clear All Cache (on logout) ───────────────────────────────

export async function clearAllCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ["cached_students", "cached_configs", "cached_batches", "draft_evaluations"],
    "readwrite"
  );
  await Promise.all([
    tx.objectStore("cached_students").clear(),
    tx.objectStore("cached_configs").clear(),
    tx.objectStore("cached_batches").clear(),
    tx.objectStore("draft_evaluations").clear(),
    tx.done,
  ]);
}
