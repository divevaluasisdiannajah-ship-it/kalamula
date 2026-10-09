/**
 * SIAP SEKOLAH — In-Memory Database Store
 * 
 * Development-only mock database. Will be replaced with
 * Supabase (PostgreSQL) or Cloudflare D1 (SQLite) in production.
 * 
 * Provides a unified CRUD interface matching the SQL schema.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Batch,
  Student,
  AssessmentConfig,
  Evaluation,
  ClassPlacement,
  ParentResponse,
} from "@/types";

// ─── Store Type ────────────────────────────────────────────────

type CollectionName =
  | "users"
  | "batches"
  | "students"
  | "assessment_configs"
  | "evaluations"
  | "class_placements"
  | "parent_responses";

interface Store {
  users: Map<string, User>;
  batches: Map<string, Batch>;
  students: Map<string, Student>;
  assessment_configs: Map<string, AssessmentConfig>;
  evaluations: Map<string, Evaluation>;
  class_placements: Map<string, ClassPlacement>;
  parent_responses: Map<string, ParentResponse>;
}

// ─── Singleton Store ───────────────────────────────────────────

let store: Store | null = null;

function initStore(): Store {
  const s: Store = {
    users: new Map(),
    batches: new Map(),
    students: new Map(),
    assessment_configs: new Map(),
    evaluations: new Map(),
    class_placements: new Map(),
    parent_responses: new Map(),
  };

  // Seed default admin user
  const adminId = uuidv4();
  s.users.set(adminId, {
    id: adminId,
    name: "Admin PPDB",
    role: "admin",
    pin_hash: "$2b$10$defaulthashforadminpin1234", // PIN: 1234
    pos_number: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed 5 evaluator users
  for (let pos = 1; pos <= 5; pos++) {
    const evalId = uuidv4();
    s.users.set(evalId, {
      id: evalId,
      name: `Evaluator Pos ${pos}`,
      role: "evaluator",
      pin_hash: `$2b$10$defaulthashforevalpin${pos}000`, // PIN: {pos}000
      pos_number: pos,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Seed teacher user
  const teacherId = uuidv4();
  s.users.set(teacherId, {
    id: teacherId,
    name: "Guru Kelas 1",
    role: "teacher",
    pin_hash: "$2b$10$defaulthashforteacherpin5678", // PIN: 5678
    pos_number: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed assessment configs (5 Pos)
  seedAssessmentConfigs(s);

  // Seed demo batch, students, and evaluations for immediate usability
  seedDemoBatchAndStudents(s);

  return s;
}

function seedAssessmentConfigs(s: Store) {
  const configs: Omit<AssessmentConfig, "created_by">[] = [
    {
      id: "config-pos-1-v1",
      version: "1.0.0",
      pos_number: 1,
      pos_name: "Kedatangan, Kemandirian & Kematangan Emosi",
      pos_description: "Observasi saat anak tiba, berpisah dari orang tua, dan berinteraksi awal",
      indicators_json: JSON.stringify([
        { id: "1.1", label: "Berpisah dari orang tua", description: "Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem", score_descriptors: { "1": "Menangis histeris tidak mau ditinggal", "2": "Menangis tapi mau ditinggal setelah dibujuk lama", "3": "Sedikit cemas tapi mandiri masuk kelas", "4": "Berpisah dengan tenang dan antusias" } },
        { id: "1.2", label: "Kemandirian Menaruh Barang", description: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantungkan tas", score_descriptors: { "1": "Tidak bisa, sepenuhnya butuh bantuan", "2": "Bisa dengan banyak bantuan verbal", "3": "Bisa dengan sedikit pengingat", "4": "Mandiri sempurna dan rapi" } },
        { id: "1.3", label: "Kesantunan dan Antrean", description: "Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya mengantre", score_descriptors: { "1": "Tidak menggunakan kata santun dan tidak mau mengantre", "2": "Kadang menggunakan kata santun dengan pengingat", "3": "Sering menggunakan kata santun secara spontan", "4": "Konsisten santun dan sabar mengantre tanpa pengingat" } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-1-1", label: "Tantrum histeris melantai (>10 menit)", severity: "critical" },
        { id: "rf-1-2", label: "Panik berlebihan atau serangan panik", severity: "critical" },
        { id: "rf-1-3", label: "Perilaku agresif membahayakan (memukul/menggigit)", severity: "critical" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-pos-2-v1",
      version: "1.0.0",
      pos_number: 2,
      pos_name: "Motorik Kasar & Koordinasi Fisik",
      pos_description: "Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan",
      indicators_json: JSON.stringify([
        { id: "2.1", label: "Keseimbangan & Koordinasi Tubuh", description: "Berjalan lurus, meniti papan titian, melompat 2 kaki", score_descriptors: { "1": "Tidak bisa melakukan salah satu aktivitas", "2": "Bisa dengan pegangan/bantuan fisik", "3": "Bisa mandiri meski sedikit tidak stabil", "4": "Lincah dan koordinasi sangat baik" } },
        { id: "2.2", label: "Respons Instruksi & Koordinasi Mata-Tangan", description: "Merespons instruksi gerak verbal dan koordinasi mata-tangan (tangkap bola)", score_descriptors: { "1": "Tidak merespons instruksi, gagal tangkap bola", "2": "Merespons lambat, sering gagal tangkap", "3": "Merespons baik, kadang berhasil tangkap", "4": "Merespons cepat dan tepat, tangkap bola konsisten" } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-2-1", label: "Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)", severity: "critical" },
        { id: "rf-2-2", label: "Sering jatuh tanpa sebab yang jelas", severity: "moderate" },
        { id: "rf-2-3", label: "Tidak bisa melompat dengan 2 kaki", severity: "moderate" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-pos-3-v1",
      version: "1.0.0",
      pos_number: 3,
      pos_name: "Kematangan Kognitif & Numerasi Dasar",
      pos_description: "Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah",
      indicators_json: JSON.stringify([
        { id: "3.1", label: "Klasifikasi & Pola", description: "Memilah benda berdasarkan atribut dan melengkapi pola berulang", score_descriptors: { "1": "Tidak bisa memilah atau mengenali pola", "2": "Bisa memilah 1 atribut dengan bantuan", "3": "Bisa memilah dan lanjutkan pola sederhana", "4": "Mandiri klasifikasi multi-atribut dan pola kompleks" } },
        { id: "3.2", label: "Konsep Kuantitas & Problem Solving", description: "Memahami banyak/sedikit dan pemecahan masalah (puzzle/balok)", score_descriptors: { "1": "Belum paham konsep kuantitas", "2": "Paham dengan bimbingan konkret", "3": "Paham mandiri dan bisa puzzle sederhana", "4": "Pemahaman kuat dan selesaikan tantangan kompleks" } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-3-1", label: "Disorientasi spasial berat", severity: "moderate" },
        { id: "rf-3-2", label: "Tidak memahami hubungan sebab-akibat sederhana", severity: "moderate" },
        { id: "rf-3-3", label: "Frustrasi ekstrem saat tantangan gagal (meltdown)", severity: "critical" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-pos-4-v1",
      version: "1.0.0",
      pos_number: 4,
      pos_name: "Bahasa Lisan, Pra-Literasi & Motorik Halus",
      pos_description: "Observasi kemampuan berbahasa, pra-membaca, dan kontrol motorik halus tangan",
      indicators_json: JSON.stringify([
        { id: "4.1", label: "Menyimak Cerita Lisan", description: "Menyimak dan memahami pesan cerita lisan yang dibacakan (read-aloud)", score_descriptors: { "1": "Tidak memperhatikan dan tidak bisa jawab pertanyaan", "2": "Memperhatikan tapi jawaban tidak relevan", "3": "Menyimak baik dan menjawab sebagian besar", "4": "Menyimak aktif dan jawab dengan detail" } },
        { id: "4.2", label: "Komunikasi Gagasan Lisan", description: "Mengomunikasikan gagasan lisan tentang hasil gambarnya", score_descriptors: { "1": "Tidak bisa menjelaskan gambarnya", "2": "Menjelaskan dengan 1-2 kata", "3": "Menjelaskan dengan kalimat sederhana", "4": "Menjelaskan dengan kalimat lengkap dan rinci" } },
        { id: "4.3", label: "Kontrol Motorik Halus", description: "Kontrol motorik halus dan genggaman alat tulis fungsional (pincer/tripod grasp)", score_descriptors: { "1": "Genggaman palmar, tidak bisa kontrol", "2": "Peralihan ke pincer, kontrol lemah", "3": "Pincer/tripod grasp, bisa menulis/mewarnai", "4": "Tripod sempurna, presisi dan kontrol tinggi" } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-4-1", label: "Bicara tidak dapat dipahami (speech delay berat)", severity: "critical" },
        { id: "rf-4-2", label: "Ekolalia — menirukan kata tanpa makna kontekstual", severity: "critical" },
        { id: "rf-4-3", label: "No joint attention — kontak mata absen total", severity: "critical" },
        { id: "rf-4-4", label: "Otot tangan sangat lemas, tidak bisa pegang alat tulis", severity: "moderate" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "config-pos-5-v1",
      version: "1.0.0",
      pos_number: 5,
      pos_name: "Bermain Bebas, Interaksi Sosial & Koordinator Tim",
      pos_description: "Observasi kemampuan bermain bersama, berbagi, dan regulasi emosi dalam kelompok",
      indicators_json: JSON.stringify([
        { id: "5.1", label: "Bermain Kooperatif", description: "Bermain kooperatif, berbagi mainan, dan berinteraksi sehat dalam kelompok", score_descriptors: { "1": "Menolak bermain bersama, menyendiri total", "2": "Bermain paralel (di dekat teman tapi tidak interaksi)", "3": "Bermain kooperatif dengan sedikit konflik", "4": "Pemimpin alami, mendorong kerjasama tim" } },
        { id: "5.2", label: "Regulasi Emosi & Konflik", description: "Regulasi emosi saat terjadi perbedaan pendapat/konflik kecil", score_descriptors: { "1": "Breakdown total saat ada konflik kecil", "2": "Perlu banyak bantuan dewasa untuk regulasi", "3": "Bisa regulasi dengan sedikit bantuan", "4": "Resolusi konflik mandiri dan dewasa" } },
      ]),
      red_flags_json: JSON.stringify([
        { id: "rf-5-1", label: "Extreme social withdrawal — menolak disapa sama sekali", severity: "critical" },
        { id: "rf-5-2", label: "Impulsif ekstrem — tidak bisa menunggu giliran", severity: "moderate" },
        { id: "rf-5-3", label: "Hiperaktif — tidak bisa diam lebih dari 30 detik", severity: "moderate" },
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const config of configs) {
    s.assessment_configs.set(config.id, config as AssessmentConfig);
  }
}

function seedDemoBatchAndStudents(s: Store) {
  const batchId = "batch-demo-1";
  const now = new Date().toISOString();

  // 1. Batch
  s.batches.set(batchId, {
    id: batchId,
    batch_name: "Gelombang 1 — PPDB 2026/2027",
    batch_date: "2026-10-06",
    status: "active",
    notes: "Observasi Gelombang Pembuka Fase A Kelas 1 SDIT An-Najah",
    created_by: "system",
    created_at: now,
    updated_at: now,
  });

  // 2. Demo Students
  const demoStudents = [
    { id: "std-1", reg: "REG-2026-001", name: "Muhammad Al-Fatih Pratama", nick: "Fatih", gender: "L" as const, birth: "2020-03-15", parent: "dr. Hendra Pratama", phone: "081234567890", level: "L4" as const, redFlag: false, p1: 4.0, p2: 3.5, p3: 4.0, p4: 4.0, p5: 3.8, class: "1A" as const, note: "Sangat percaya diri, membaca lancar dan senang memimpin baris antrean." },
    { id: "std-2", reg: "REG-2026-002", name: "Aisyah Putri Rahmadani", nick: "Aisyah", gender: "P" as const, birth: "2020-05-20", parent: "Rahmat Hidayat", phone: "081298765432", level: "L3" as const, redFlag: false, p1: 3.8, p2: 3.6, p3: 3.5, p4: 3.5, p5: 4.0, class: "1A" as const, note: "Mampu membaca suku kata dengan mandiri, sangat ramah pada teman sebaya." },
    { id: "std-3", reg: "REG-2026-003", name: "Rayhan Alvaro Zikri", nick: "Rayhan", gender: "L" as const, birth: "2020-02-10", parent: "Budi Santoso", phone: "081311223344", level: "L2" as const, redFlag: false, p1: 3.2, p2: 3.8, p3: 3.0, p4: 2.8, p5: 3.5, class: "1B" as const, note: "Mengenal bunyi fonem dasar, fisik sangat lincah dan antusias melompat." },
    { id: "std-4", reg: "REG-2026-004", name: "Khadijah Azzahra Humaira", nick: "Azza", gender: "P" as const, birth: "2020-07-08", parent: "Ahmad Fauzi", phone: "081355667788", level: "L1" as const, redFlag: false, p1: 3.0, p2: 3.0, p3: 2.8, p4: 2.5, p5: 3.2, class: "1B" as const, note: "Mengenal simbol gambar visual, perlu stimulasi fonik dan motorik pensil di kelas." },
    { id: "std-5", reg: "REG-2026-005", name: "Kenzo Arshaka Wijaya", nick: "Kenzo", gender: "L" as const, birth: "2020-08-12", parent: "Doni Wijaya", phone: "081277889900", level: "L1" as const, redFlag: true, p1: 1.8, p2: 2.5, p3: 2.2, p4: 2.0, p5: 2.0, class: "1A" as const, note: "Sensitif terhadap suara keras dan sempat tantrum saat berpisah. Butuh calm-down corner ramah anak." },
    { id: "std-6", reg: "REG-2026-006", name: "Maryam Salsabila Zahra", nick: "Maryam", gender: "P" as const, birth: "2020-04-02", parent: "Irfan Hakim", phone: "081233445566", level: "L3" as const, redFlag: false, p1: 3.5, p2: 3.2, p3: 3.5, p4: 3.6, p5: 3.7, class: "1B" as const, note: "Mandiri merapikan sepatu dan tas, membaca kata bermakna dengan artikulasi jelas." },
    { id: "std-7", reg: "REG-2026-007", name: "Bilal Ramadhan Al-Ghifari", nick: "Bilal", gender: "L" as const, birth: "2020-09-18", parent: "Yusuf Mansur", phone: "081399887766", level: "L2" as const, redFlag: false, p1: 3.0, p2: 3.7, p3: 3.1, p4: 2.7, p5: 3.4, class: "1A" as const, note: "Fokus mendengarkan cerita, menyusun balok bersama teman dengan tertib." },
    { id: "std-8", reg: "REG-2026-008", name: "Zhafira Nurul Izzah", nick: "Zhafira", gender: "P" as const, birth: "2020-01-25", parent: "dr. Fitriani", phone: "081222334455", level: "L4" as const, redFlag: false, p1: 4.0, p2: 3.8, p3: 3.9, p4: 4.0, p5: 4.0, class: "1B" as const, note: "Kemandirian dan kematangan emosi sangat matang, membaca lancar penuh ekspresi." },
  ];

  for (const item of demoStudents) {
    s.students.set(item.id, {
      id: item.id,
      registration_no: item.reg,
      full_name: item.name,
      nickname: item.nick,
      birth_date: item.birth,
      gender: item.gender,
      parent_name: item.parent,
      phone: item.phone,
      batch_id: batchId,
      avatar_seed: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // Class Placement
    s.class_placements.set(`cp-${item.id}`, {
      id: `cp-${item.id}`,
      student_id: item.id,
      batch_id: batchId,
      assigned_class: item.class,
      algorithm_version: "v1.0",
      balance_score: 0.95,
      manual_override: false,
      override_by: null,
      override_reason: null,
      override_at: null,
      assigned_at: now,
      updated_at: now,
    });

    // Evaluations for 5 Pos
    const posScores = [item.p1, item.p2, item.p3, item.p4, item.p5];
    for (let pos = 1; pos <= 5; pos++) {
      const evalId = `eval-${item.id}-pos-${pos}`;
      const scoreVal = posScores[pos - 1];
      const isPos4 = pos === 4;
      const isRedFlagPos = item.redFlag && pos === 1;

      s.evaluations.set(evalId, {
        id: evalId,
        student_id: item.id,
        batch_id: batchId,
        pos_number: pos,
        evaluator_id: `evaluator-${pos}`,
        config_id: `config-pos-${pos}-v1`,
        scores_json: JSON.stringify({ [`${pos}.1`]: Math.round(scoreVal), [`${pos}.2`]: Math.round(scoreVal) }),
        reading_level: isPos4 ? item.level : null,
        red_flags_json: isRedFlagPos ? JSON.stringify({ "rf-1-1": true }) : "{}",
        has_red_flag: isRedFlagPos,
        anecdotal_note: pos === 1 ? item.note : `Aktivitas di Pos ${pos} berjalan tertib dan mandiri.`,
        total_score: scoreVal,
        is_complete: true,
        client_id: `client-${item.id}-${pos}`,
        synced_at: now,
        created_at: now,
        updated_at: now,
      });
    }
  }
}

// ─── Get Store Instance ────────────────────────────────────────

export function getDB(): Store {
  if (!store) {
    store = initStore();
  }
  return store;
}

// ─── Generic CRUD Functions ────────────────────────────────────

export function generateId(): string {
  return uuidv4();
}

export function findAll<T>(collection: CollectionName): T[] {
  const db = getDB();
  return Array.from((db[collection] as unknown as Map<string, T>).values());
}

export function findById<T>(collection: CollectionName, id: string): T | undefined {
  const db = getDB();
  return (db[collection] as unknown as Map<string, T>).get(id);
}

export function findWhere<T>(collection: CollectionName, predicate: (item: T) => boolean): T[] {
  return findAll<T>(collection).filter(predicate);
}

export function findOne<T>(collection: CollectionName, predicate: (item: T) => boolean): T | undefined {
  return findAll<T>(collection).find(predicate);
}

export function create<T extends { id: string }>(collection: CollectionName, data: T): T {
  const db = getDB();
  (db[collection] as unknown as Map<string, T>).set(data.id, data);
  return data;
}

export function update<T extends { id: string }>(
  collection: CollectionName,
  id: string,
  updates: Partial<T>
): T | undefined {
  const db = getDB();
  const map = db[collection] as unknown as Map<string, T>;
  const existing = map.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() } as T;
  map.set(id, updated);
  return updated;
}

export function remove(collection: CollectionName, id: string): boolean {
  const db = getDB();
  return (db[collection] as Map<string, unknown>).delete(id);
}

export function count(collection: CollectionName): number {
  const db = getDB();
  return (db[collection] as Map<string, unknown>).size;
}
