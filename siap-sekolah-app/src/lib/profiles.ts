/**
 * SIAP SEKOLAH — Profile Aggregator & Teacher Recommendation Engine
 *
 * All functions now accept a Drizzle DB instance (D1-compatible)
 * instead of importing directly from the in-memory store.
 */

import { eq, and } from "drizzle-orm";
import type { DB } from "@/db";
import {
  students as studentsTable,
  batches as batchesTable,
  evaluations as evaluationsTable,
  parentResponses as parentResponsesTable,
  classPlacements as classPlacementsTable,
} from "@/db/schema";
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
      pos_scores[ev.pos_number] = Number(ev.total_score.toFixed(2));
      totalScoreSum += ev.total_score;
      scoredPosCount++;
    }
    if (ev.has_red_flag) has_any_red_flag = true;
    if (ev.pos_number === 4 && ev.reading_level) reading_level = ev.reading_level;
  });

  const overall_score =
    scoredPosCount > 0 ? Number((totalScoreSum / scoredPosCount).toFixed(2)) : null;

  const completedPosCount = evaluations.filter((e) => e.is_complete).length;
  const completion_rate = Math.round((completedPosCount / 5) * 100);

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
        const numVal = Number(val);
        if (!isNaN(numVal) && numVal >= 1 && numVal <= 4) {
          const foundation = INDICATOR_FOUNDATION_MAP[indId];
          if (foundation) {
            foundationSums[foundation].sum += numVal;
            foundationSums[foundation].count += 1;
          }
        }
      });
    }
  });

  const foundation_scores: Record<FoundationNumber, number | null> = {
    1: foundationSums[1].count > 0 ? Number((foundationSums[1].sum / foundationSums[1].count).toFixed(2)) : (pos_scores[1] ?? null),
    2: foundationSums[2].count > 0 ? Number((foundationSums[2].sum / foundationSums[2].count).toFixed(2)) : (pos_scores[4] ?? null),
    3: foundationSums[3].count > 0 ? Number((foundationSums[3].sum / foundationSums[3].count).toFixed(2)) : (pos_scores[1] ?? null),
    4: foundationSums[4].count > 0 ? Number((foundationSums[4].sum / foundationSums[4].count).toFixed(2)) : (pos_scores[3] ?? null),
    5: foundationSums[5].count > 0 ? Number((foundationSums[5].sum / foundationSums[5].count).toFixed(2)) : (pos_scores[2] ?? null),
    6: foundationSums[6].count > 0 ? Number((foundationSums[6].sum / foundationSums[6].count).toFixed(2)) : (pos_scores[5] ?? null),
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
 * Generates qualitative narrative and stimulation advice for individual report PDF
 */
export function generateQualitativeNarrative(profile: StudentProfile) {
  const narratives: Record<number, string> = {};
  const stimulations: string[] = [];

  // Pos 1: Emosi & Kemandirian
  const p1 = profile.pos_scores[1];
  if (p1 !== null) {
    if (p1 >= 3.5) {
      narratives[1] =
        "Menunjukkan kematangan emosi yang sangat baik. Cepat beradaptasi di lingkungan baru, mandiri mengelola barang pribadi, dan konsisten mempraktikkan budaya santun serta antre.";
    } else if (p1 >= 2.5) {
      narratives[1] =
        "Mampu berpisah dari orang tua dengan pendampingan wajar. Mulai mandiri dalam merapikan barang dan memahami aturan antre sederhana di kelas.";
      stimulations.push(
        "Latih kemandirian meletakkan sepatu dan tas sendiri di rumah tanpa bantuan orang tua."
      );
    } else {
      narratives[1] =
        "Masih membutuhkan transisi emosi yang lebih tenang saat berpisah dari orang tua. Memerlukan penguatan afeksi dan pembiasaan rutinitas kemandirian.";
      stimulations.push(
        "Buat rutinitas perpisahan pagi yang konsisten dan berikan apresiasi setiap kali anak berhasil mandiri."
      );
    }
  }

  // Pos 2: Motorik Kasar
  const p2 = profile.pos_scores[2];
  if (p2 !== null) {
    if (p2 >= 3.5) {
      narratives[2] =
        "Koordinasi fisik dan keseimbangan tubuh sangat prima. Cekatan merespons instruksi gerak berurutan dan tangkas menangkap bola.";
    } else if (p2 >= 2.5) {
      narratives[2] =
        "Koordinasi fisik dasar telah berkembang sesuai usia. Mampu meniti dan melompat dengan kendali tubuh yang cukup stabil.";
      stimulations.push(
        "Ajak aktivitas luar ruangan seperti meniti garis lurus, lempar-tangkap bola, atau bersepeda."
      );
    } else {
      narratives[2] =
        "Perlu stimulasi penguatan otot tungkai dan koordinasi visual-motorik (mata-tangan).";
      stimulations.push(
        "Perbanyak latihan gerak aktif: lompat tali sederhana, merangkak di rintangan bantal, dan bermain bola."
      );
    }
  }

  // Pos 3: Kognitif & Numerasi
  const p3 = profile.pos_scores[3];
  if (p3 !== null) {
    if (p3 >= 3.5) {
      narratives[3] =
        "Penalaran logis sangat kuat. Sangat cepat menemukan pola berulang, membandingkan kuantitas objek konkret, serta tekun memecahkan masalah teka-teki balok.";
    } else if (p3 >= 2.5) {
      narratives[3] =
        "Memahami konsep banyak-sedikit dan klasifikasi benda berdasarkan warna/bentuk secara konkret.";
      stimulations.push(
        "Libatkan dalam permainan menyortir benda di rumah (sendok-garpu, kaos kaki berpasangan) dan puzzle."
      );
    } else {
      narratives[3] =
        "Konsep kuantitas dan persepsi spasial masih dalam tahap pengenalan awal dengan objek konkret.";
      stimulations.push(
        "Gunakan benda nyata sehari-hari untuk menghitung benda 1-10 sambil disentuh (one-to-one correspondence)."
      );
    }
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
    narratives[4] = `Kesiapan membaca berada pada ${readingStatus}. `;
    if (p4 >= 3.0) {
      narratives[4] +=
        "Daya simak cerita lisan sangat fokus, artikulasi gagasan jelas, dan kontrol jari saat memegang pensil sudah stabil.";
    } else {
      narratives[4] +=
        "Perlu pengayaan perbendaharaan kata melalui dialog interaktif dan stimulasi motorik halus jemari tangan.";
      stimulations.push(
        "Rutin bacakan buku cerita bergambar 10-15 menit setiap hari dan ajak bermain plastisin atau meronce."
      );
    }
  }

  // Pos 5: Sosial & Interaksi
  const p5 = profile.pos_scores[5];
  if (p5 !== null) {
    if (p5 >= 3.5) {
      narratives[5] =
        "Kemampuan sosialisasi sangat hangat. Suka berbagi mainan, mampu berkolaborasi dalam kelompok kecil, dan memiliki regulasi emosi yang baik saat bermain.";
    } else if (p5 >= 2.5) {
      narratives[5] =
        "Mampu bermain berdampingan dan mulai menunjukkan inisiatif berbagi dengan dorongan pembimbing.";
      stimulations.push("Berikan kesempatan bermain bergantian dengan saudara atau teman sebaya.");
    } else {
      narratives[5] =
        "Perlu pendampingan untuk mengatasi kecemasan sosial dan bimbingan saat berbagi ruang interaksi.";
      stimulations.push(
        "Bimbing anak mengungkapkan perasaan dengan kata-kata ('aku mau pinjam', 'sebentar ya') daripada tindakan fisik."
      );
    }
  }

  return { narratives, stimulations };
}
