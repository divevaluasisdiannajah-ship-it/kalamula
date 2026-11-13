/**
 * SIAP SEKOLAH — Profile Aggregator & Teacher Recommendation Engine
 *
 * All functions now accept a Drizzle DB instance (D1-compatible)
 * instead of importing directly from the in-memory store.
 */

import { eq, and, sql } from "drizzle-orm";
import type { DB } from "@/db";
import {
  students as studentsTable,
  batches as batchesTable,
  evaluations as evaluationsTable,
  parentResponses as parentResponsesTable,
  classPlacements as classPlacementsTable,
  studentAiSummaries as studentAiSummariesTable,
} from "@/db/schema";
import {
  sanitizeObserverNote,
  generateContextualStimulations,
  cleanObserverNotesByDomain,
} from "@/lib/gemini";
import type {
  Student,
  Batch,
  Evaluation,
  EvaluationParsed,
  ParentResponse,
  ClassPlacement,
  StudentProfile,
  ReadingLevel,
  FoundationNumber,
} from "@/types";

export const INDICATOR_FOUNDATION_MAP: Record<string, FoundationNumber> = {
  // ─── 4 Domain Fungsional Baru ───
  // Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi (Super Observer)
  "SO-01": 3, // Berpisah dari orang tua (Kematangan Emosi)
  "SO-02": 5, // Kemandirian menaruh barang (Self-Care & Motorik)
  "SO-03": 2, // Kepatuhan instruksi saat transisi (Sosial & Bahasa)
  "SO-04": 1, // Kesantunan & budaya antre (Nilai Agama & Budi Pekerti)
  "SO-05": 3, // Regulasi diri & adaptasi kesulitan (Kematangan Emosi)
  "SO-06": 2, // Bermain kooperatif & berbagi (Keterampilan Sosial)
  "SO-07": 6, // Antusiasme & refleksi belajar (Pemaknaan Belajar Positif)

  // Pos Motorik Kasar & Koordinasi Fisik
  "MK-01": 5, // Keseimbangan & kontrol tubuh
  "MK-02": 5, // Koordinasi mata-tangan & respons gerak

  // Pos Kematangan Kognitif & Berhitung
  "KG-01": 4, // Klasifikasi objek & pola berulang
  "KG-02": 4, // Konsep kuantitas & problem solving

  // Pos Bahasa Lisan, Pra-Literasi & Motorik Halus
  "BL-01": 2, // Menyimak cerita lisan read-aloud
  "BL-02": 2, // Komunikasi gagasan lisan
  "BL-03": 5, // Kontrol motorik halus & tripod grasp

  // ─── Legacy Backward Compatibility (1.1 - 5.3) ───
  "1.1": 3,
  "1.2": 5,
  "1.3": 1,
  "2.1": 5,
  "2.2": 5,
  "3.1": 4,
  "3.2": 4,
  "4.1": 2,
  "4.2": 2,
  "4.3": 5,
  "5.1": 2,
  "5.2": 3,
  "5.3": 6,
};

/**
 * Builds a comprehensive profile for a single student
 */
export async function buildStudentProfile(
  db: DB,
  student: Student,
  batchId?: string
): Promise<StudentProfile> {
  const currentBatchId = batchId || student.batch_id || "";

  // Fetch batch
  const batch: Batch | null = currentBatchId
    ? ((await db
        .select()
        .from(batchesTable)
        .where(eq(batchesTable.id, currentBatchId))
        .get()) as Batch | null)
    : null;

  // Fetch evaluations
  const evaluationsRaw = (await db
    .select()
    .from(evaluationsTable)
    .where(
      currentBatchId
        ? and(
            eq(evaluationsTable.student_id, student.id),
            eq(evaluationsTable.batch_id, currentBatchId)
          )
        : eq(evaluationsTable.student_id, student.id)
    )
    .all()) as Evaluation[];

  const evaluations: EvaluationParsed[] = evaluationsRaw.map((e) => ({
    id: e.id,
    student_id: e.student_id,
    batch_id: e.batch_id,
    pos_number: e.pos_number,
    evaluator_id: e.evaluator_id,
    config_id: e.config_id,
    scores: JSON.parse(e.scores_json || "{}"),
    reading_level: e.reading_level,
    red_flags: JSON.parse(e.red_flags_json || "{}"),
    has_red_flag: e.has_red_flag,
    anecdotal_note: e.anecdotal_note,
    total_score: e.total_score,
    is_complete: e.is_complete,
    client_id: e.client_id,
    synced_at: e.synced_at,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }));

  // Fetch parent response
  const parentResponseRow = (await db
    .select()
    .from(parentResponsesTable)
    .where(
      currentBatchId
        ? and(
            eq(parentResponsesTable.student_id, student.id),
            eq(parentResponsesTable.batch_id, currentBatchId)
          )
        : eq(parentResponsesTable.student_id, student.id)
    )
    .get()) as ParentResponse | null;
  const parent_response = parentResponseRow ?? null;

  // Fetch class placement
  const placementRow = (await db
    .select()
    .from(classPlacementsTable)
    .where(
      currentBatchId
        ? and(
            eq(classPlacementsTable.student_id, student.id),
            eq(classPlacementsTable.batch_id, currentBatchId)
          )
        : eq(classPlacementsTable.student_id, student.id)
    )
    .get()) as ClassPlacement | null;
  const placement = placementRow ?? null;

  // Compute pos scores
  const pos_scores: Record<number, number | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  };

  let totalScoreSum = 0;
  let scoredPosCount = 0;
  let has_any_red_flag = false;
  let reading_level: ReadingLevel | null = null;

  evaluations.forEach((ev) => {
    if (ev.total_score !== null && !isNaN(ev.total_score)) {
      // Normalize legacy 4-point scale score if > 3.0
      const normalizedScore = ev.total_score > 3.0
        ? Math.min(3.0, Number(((ev.total_score / 4.0) * 3.0).toFixed(2)))
        : Math.min(3.0, ev.total_score);
      pos_scores[ev.pos_number] = Number(normalizedScore.toFixed(2));
      totalScoreSum += normalizedScore;
      scoredPosCount++;
    }
    if (ev.has_red_flag) has_any_red_flag = true;
    if (ev.pos_number === 4 && ev.reading_level) reading_level = ev.reading_level;
  });

  const overall_score =
    scoredPosCount > 0 ? Number(Math.min(3.0, totalScoreSum / scoredPosCount).toFixed(2)) : null;

  const completedPosCount = evaluations.filter((e) => e.is_complete).length;
  // Denominator is 4 active functional domain positions
  const totalExpectedPos = 4;
  const completion_rate = Math.min(100, Math.round((completedPosCount / totalExpectedPos) * 100));

  // Compute scores for the 6 Fondasi Transisi PAUD-SD Kemendikbudristek
  const foundationSums: Record<FoundationNumber, { sum: number; count: number }> = {
    1: { sum: 0, count: 0 },
    2: { sum: 0, count: 0 },
    3: { sum: 0, count: 0 },
    4: { sum: 0, count: 0 },
    5: { sum: 0, count: 0 },
    6: { sum: 0, count: 0 },
  };

  evaluations.forEach((ev) => {
    if (ev.scores && typeof ev.scores === "object") {
      Object.entries(ev.scores).forEach(([indId, val]) => {
        let numVal = Number(val);
        if (!isNaN(numVal) && numVal >= 1) {
          // Normalize legacy 4-point indicator scores (> 3) to 3-point scale
          if (numVal > 3) {
            numVal = Math.min(3, Math.round((numVal / 4) * 3));
          }
          const foundation = INDICATOR_FOUNDATION_MAP[indId];
          if (foundation) {
            foundationSums[foundation].sum += numVal;
            foundationSums[foundation].count += 1;
          }
        }
      });
    }
  });

  const clampFoundation = (val: number | null): number | null => {
    if (val === null || val === undefined || isNaN(val)) return null;
    return Number(Math.min(3.0, Math.max(1.0, val)).toFixed(2));
  };

  const foundation_scores: Record<FoundationNumber, number | null> = {
    1: foundationSums[1].count > 0 ? clampFoundation(foundationSums[1].sum / foundationSums[1].count) : clampFoundation(pos_scores[1] ?? null),
    2: foundationSums[2].count > 0 ? clampFoundation(foundationSums[2].sum / foundationSums[2].count) : clampFoundation(pos_scores[4] ?? null),
    3: foundationSums[3].count > 0 ? clampFoundation(foundationSums[3].sum / foundationSums[3].count) : clampFoundation(pos_scores[1] ?? null),
    4: foundationSums[4].count > 0 ? clampFoundation(foundationSums[4].sum / foundationSums[4].count) : clampFoundation(pos_scores[3] ?? null),
    5: foundationSums[5].count > 0 ? clampFoundation(foundationSums[5].sum / foundationSums[5].count) : clampFoundation(pos_scores[2] ?? null),
    6: foundationSums[6].count > 0 ? clampFoundation(foundationSums[6].sum / foundationSums[6].count) : clampFoundation(pos_scores[5] ?? null),
  };

  return {
    student,
    batch,
    evaluations,
    parent_response,
    placement,
    overall_score,
    completion_rate,
    has_any_red_flag,
    reading_level,
    pos_scores,
    foundation_scores,
  };
}

/**
 * Gets student profiles for an entire batch
 */
export async function getBatchStudentProfiles(
  db: DB,
  batchId: string
): Promise<StudentProfile[]> {
  const rows = (await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.batch_id, batchId))
    .all()) as Student[];

  return Promise.all(rows.map((s) => buildStudentProfile(db, s, batchId)));
}

/**
 * Database helpers for cached AI-generated student narratives
 */
export async function getStudentAiSummary(db: DB, studentId: string) {
  try {
    const row = await db
      .select()
      .from(studentAiSummariesTable)
      .where(eq(studentAiSummariesTable.student_id, studentId))
      .get();
    if (!row) return null;
    return {
      narratives: JSON.parse(row.narratives_json) as Record<number, string>,
      stimulations: JSON.parse(row.stimulations_json) as string[],
      updated_at: row.updated_at,
    };
  } catch {
    return null;
  }
}

export async function saveStudentAiSummary(
  db: DB,
  studentId: string,
  batchId: string | null,
  narratives: Record<number, string>,
  stimulations: string[]
) {
  try {
    // Ensure table exists on first write
    await db.run(sql`CREATE TABLE IF NOT EXISTS student_ai_summaries (
      student_id TEXT PRIMARY KEY,
      batch_id TEXT,
      narratives_json TEXT NOT NULL,
      stimulations_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);

    const now = new Date().toISOString();
    await db
      .insert(studentAiSummariesTable)
      .values({
        student_id: studentId,
        batch_id: batchId,
        narratives_json: JSON.stringify(narratives),
        stimulations_json: JSON.stringify(stimulations),
        created_at: now,
        updated_at: now,
      })
      .onConflictDoUpdate({
        target: studentAiSummariesTable.student_id,
        set: {
          narratives_json: JSON.stringify(narratives),
          stimulations_json: JSON.stringify(stimulations),
          updated_at: now,
        },
      });
    return true;
  } catch (err) {
    console.error("Failed to save student AI summary:", err);
    return false;
  }
}

/**
 * Generates qualitative narrative and stimulation advice for individual report PDF.
 * Extracts authentic observer notes per pos and merges them with standard milestone rubrics.
 */
export function generateQualitativeNarrative(profile: StudentProfile) {
  const templates: Record<number, string> = {};
  const narratives: Record<number, string> = {};
  const stimulations: string[] = [];

  // Extract observer notes by pos
  const rawNotes: Record<number, string | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
  };
  profile.evaluations.forEach((ev) => {
    if (ev.pos_number >= 1 && ev.pos_number <= 4 && ev.anecdotal_note) {
      rawNotes[ev.pos_number] = ev.anecdotal_note.trim();
    }
  });

  // Isolate and clean notes so each pos only contains its genuine observations
  const notes = cleanObserverNotesByDomain(rawNotes);

  // Pos 1: Emosi & Kemandirian
  const p1 = profile.pos_scores[1];
  if (p1 !== null) {
    if (p1 >= 2.6) {
      templates[1] =
        "Menunjukkan kematangan emosi yang sangat baik. Cepat beradaptasi di lingkungan baru, mandiri mengelola barang pribadi, dan konsisten mempraktikkan budaya santun serta antre.";
    } else if (p1 >= 1.8) {
      templates[1] =
        "Mampu berpisah dari orang tua dengan pendampingan wajar. Mulai mandiri dalam merapikan barang dan memahami aturan antre sederhana di kelas.";
      stimulations.push(
        "Latih kemandirian meletakkan sepatu dan tas sendiri di rumah tanpa bantuan orang tua."
      );
    } else {
      templates[1] =
        "Masih membutuhkan transisi emosi yang lebih tenang saat berpisah dari orang tua. Memerlukan penguatan afeksi dan pembiasaan rutinitas kemandirian.";
      stimulations.push(
        "Buat rutinitas perpisahan pagi yang konsisten dan berikan apresiasi setiap kali anak berhasil mandiri."
      );
    }
  } else {
    templates[1] = "Mampu berpisah dari orang tua dan mulai menunjukkan kemandirian dasar.";
  }

  // Pos 2: Motorik Kasar & Koordinasi
  const p2 = profile.pos_scores[2];
  if (p2 !== null) {
    if (p2 >= 2.6) {
      templates[2] =
        "Koordinasi fisik dan keseimbangan tubuh sangat prima. Cekatan merespons instruksi gerak berurutan dan tangkas menangkap bola.";
    } else if (p2 >= 1.8) {
      templates[2] =
        "Koordinasi fisik dasar telah berkembang sesuai usia. Mampu meniti dan melompat dengan kendali tubuh yang cukup stabil.";
      stimulations.push(
        "Ajak aktivitas luar ruangan seperti meniti garis lurus, lempar-tangkap bola, atau bersepeda."
      );
    } else {
      templates[2] =
        "Perlu stimulasi penguatan otot tungkai dan koordinasi visual-motorik (mata-tangan).";
      stimulations.push(
        "Perbanyak latihan gerak aktif: lompat tali sederhana, merangkak di rintangan bantal, dan bermain bola."
      );
    }
  } else {
    templates[2] = "Koordinasi fisik dan kemampuan gerak dasar berkembang sesuai tahapan usia.";
  }

  // Pos 3: Kognitif & Numerasi
  const p3 = profile.pos_scores[3];
  if (p3 !== null) {
    if (p3 >= 2.6) {
      templates[3] =
        "Penalaran logis sangat kuat. Sangat cepat menemukan pola berulang, membandingkan kuantitas objek konkret, serta tekun memecahkan masalah teka-teki balok.";
    } else if (p3 >= 1.8) {
      templates[3] =
        "Memahami konsep banyak-sedikit dan klasifikasi benda berdasarkan warna/bentuk secara konkret.";
      stimulations.push(
        "Libatkan dalam permainan menyortir benda di rumah (sendok-garpu, kaos kaki berpasangan) dan puzzle."
      );
    } else {
      templates[3] =
        "Konsep kuantitas dan persepsi spasial masih dalam tahap pengenalan awal dengan objek konkret.";
      stimulations.push(
        "Gunakan benda nyata sehari-hari untuk menghitung benda 1-10 sambil disentuh (one-to-one correspondence)."
      );
    }
  } else {
    templates[3] = "Penalaran kuantitas dan logika objek konkret dalam tahap pengenalan awal.";
  }

  // Pos 4: Bahasa & Literasi
  const p4 = profile.pos_scores[4];
  if (p4 !== null) {
    const readingMap = {
      L1: "Tingkat 1 (Mengenal Gambar & Simbol)",
      L2: "Tingkat 2 (Mengenal Huruf & Bunyi)",
      L3: "Tingkat 3 (Membaca Suku Kata)",
      L4: "Tingkat 4 (Membaca Kalimat Lancar)",
    };
    const readingStatus = profile.reading_level
      ? readingMap[profile.reading_level]
      : "Belum dievaluasi";
    templates[4] = `Kesiapan membaca berada pada ${readingStatus}. `;
    if (p4 >= 2.5) {
      templates[4] +=
        "Daya simak cerita lisan sangat fokus, artikulasi gagasan jelas, dan kontrol jari saat memegang pensil sudah stabil.";
    } else {
      templates[4] +=
        "Perlu pengayaan perbendaharaan kata melalui dialog interaktif dan stimulasi motorik halus jemari tangan.";
      stimulations.push(
        "Rutin bacakan buku cerita bergambar 10-15 menit setiap hari dan ajak bermain plastisin atau meronce."
      );
    }
  } else {
    templates[4] = "Kemampuan komunikasi gagasan dan pra-literasi berkembang sesuai tahapan.";
  }

  // Merge template with observer note for each pos (Deterministic combination fallback)
  [1, 2, 3, 4].forEach((pos) => {
    const note = notes[pos];
    const baseTemplate = templates[pos] || "";
    if (note && note.trim().length > 0) {
      const sanitized = sanitizeObserverNote(note);
      // If note already starts with uppercase or full sentence, join nicely
      narratives[pos] = `${baseTemplate} Catatan pengamatan guru: "${sanitized}"`;
    } else {
      narratives[pos] = baseTemplate;
    }
  });

  // Generate contextual stimulations connected to observer notes and scores
  const contextualStimulations = generateContextualStimulations(notes, profile.pos_scores);
  const finalStimulations = contextualStimulations.length > 0 ? contextualStimulations : stimulations;

  return { narratives, stimulations: finalStimulations, templates, notes };
}
