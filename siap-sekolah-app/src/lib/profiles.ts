/**
 * SIAP SEKOLAH — Profile Aggregator & Teacher Recommendation Engine
 */

import { findById, findWhere, findAll } from "@/lib/db";
import type {
  Student,
  Batch,
  Evaluation,
  EvaluationParsed,
  ParentResponse,
  ClassPlacement,
  StudentProfile,
  ReadingLevel,
} from "@/types";

/**
 * Builds a comprehensive profile for a single student
 */
export function buildStudentProfile(
  student: Student,
  batchId?: string
): StudentProfile {
  const currentBatchId = batchId || student.batch_id || "";
  const batch = currentBatchId ? findById<Batch>("batches", currentBatchId) || null : null;

  // Find all evaluations
  const evaluationsRaw = findWhere<Evaluation>("evaluations", (e) =>
    e.student_id === student.id && (!currentBatchId || e.batch_id === currentBatchId)
  );

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

  // Parent response
  const parent_response =
    findWhere<ParentResponse>("parent_responses", (p) =>
      p.student_id === student.id && (!currentBatchId || p.batch_id === currentBatchId)
    )[0] || null;

  // Class placement
  const placement =
    findWhere<ClassPlacement>("class_placements", (cp) =>
      cp.student_id === student.id && (!currentBatchId || cp.batch_id === currentBatchId)
    )[0] || null;

  // Pos Scores (1 to 5)
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
    if (ev.has_red_flag) {
      has_any_red_flag = true;
    }
    if (ev.pos_number === 4 && ev.reading_level) {
      reading_level = ev.reading_level;
    }
  });

  const overall_score =
    scoredPosCount > 0 ? Number((totalScoreSum / scoredPosCount).toFixed(2)) : null;

  const completedPosCount = evaluations.filter((e) => e.is_complete).length;
  const completion_rate = Math.round((completedPosCount / 5) * 100);

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
  };
}

/**
 * Gets student profiles for an entire batch
 */
export function getBatchStudentProfiles(batchId: string): StudentProfile[] {
  const students = findWhere<Student>("students", (s) => s.batch_id === batchId);
  return students.map((s) => buildStudentProfile(s, batchId));
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
      narratives[1] = "Menunjukkan kematangan emosi yang sangat baik. Cepat beradaptasi di lingkungan baru, mandiri mengelola barang pribadi, dan konsisten mempraktikkan budaya santun serta antre.";
    } else if (p1 >= 2.5) {
      narratives[1] = "Mampu berpisah dari orang tua dengan pendampingan wajar. Mulai mandiri dalam merapikan barang dan memahami aturan antre sederhana di kelas.";
      stimulations.push("Latih kemandirian meletakkan sepatu dan tas sendiri di rumah tanpa bantuan orang tua.");
    } else {
      narratives[1] = "Masih membutuhkan transisi emosi yang lebih tenang saat berpisah dari orang tua. Memerlukan penguatan afeksi dan pembiasaan rutinitas kemandirian.";
      stimulations.push("Buat rutinitas perpisahan pagi yang konsisten dan berikan apresiasi setiap kali anak berhasil mandiri.");
    }
  }

  // Pos 2: Motorik Kasar
  const p2 = profile.pos_scores[2];
  if (p2 !== null) {
    if (p2 >= 3.5) {
      narratives[2] = "Koordinasi fisik dan keseimbangan tubuh sangat prima. Cekatan merespons instruksi gerak berurutan dan tangkas menangkap bola.";
    } else if (p2 >= 2.5) {
      narratives[2] = "Koordinasi fisik dasar telah berkembang sesuai usia. Mampu meniti dan melompat dengan kendali tubuh yang cukup stabil.";
      stimulations.push("Ajak aktivitas luar ruangan seperti meniti garis lurus, lempar-tangkap bola, atau bersepeda.");
    } else {
      narratives[2] = "Perlu stimulasi penguatan otot tungkai dan koordinasi visual-motorik (mata-tangan).";
      stimulations.push("Perbanyak latihan gerak aktif: lompat tali sederhana, merangkak di rintangan bantal, dan bermain bola.");
    }
  }

  // Pos 3: Kognitif & Numerasi
  const p3 = profile.pos_scores[3];
  if (p3 !== null) {
    if (p3 >= 3.5) {
      narratives[3] = "Penalaran logis sangat kuat. Sangat cepat menemukan pola berulang, membandingkan kuantitas objek konkret, serta tekun memecahkan masalah teka-teki balok.";
    } else if (p3 >= 2.5) {
      narratives[3] = "Memahami konsep banyak-sedikit dan klasifikasi benda berdasarkan warna/bentuk secara konkret.";
      stimulations.push("Libatkan dalam permainan menyortir benda di rumah (sendok-garpu, kaos kaki berpasangan) dan puzzle.");
    } else {
      narratives[3] = "Konsep kuantitas dan persepsi spasial masih dalam tahap pengenalan awal dengan objek konkret.";
      stimulations.push("Gunakan benda nyata sehari-hari untuk menghitung benda 1-10 sambil disentuh (one-to-one correspondence).");
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
    const readingStatus = profile.reading_level ? readingMap[profile.reading_level] : "Belum dievaluasi";

    narratives[4] = `Kesiapan membaca berada pada ${readingStatus}. `;
    if (p4 >= 3.0) {
      narratives[4] += "Daya simak cerita lisan sangat fokus, artikulasi gagasan jelas, dan kontrol jari saat memegang pensil sudah stabil.";
    } else {
      narratives[4] += "Perlu pengayaan perbendaharaan kata melalui dialog interaktif dan stimulasi motorik halus jemari tangan.";
      stimulations.push("Rutin bacakan buku cerita bergambar 10-15 menit setiap hari dan ajak bermain plastisin atau meronce.");
    }
  }

  // Pos 5: Sosial & Interaksi
  const p5 = profile.pos_scores[5];
  if (p5 !== null) {
    if (p5 >= 3.5) {
      narratives[5] = "Kemampuan sosialisasi sangat hangat. Suka berbagi mainan, mampu berkolaborasi dalam kelompok kecil, dan memiliki regulasi emosi yang baik saat bermain.";
    } else if (p5 >= 2.5) {
      narratives[5] = "Mampu bermain berdampingan dan mulai menunjukkan inisiatif berbagi dengan dorongan pembimbing.";
      stimulations.push("Berikan kesempatan bermain bergantian dengan saudara atau teman sebaya.");
    } else {
      narratives[5] = "Perlu pendampingan untuk mengatasi kecemasan sosial dan bimbingan saat berbagi ruang interaksi.";
      stimulations.push("Bimbing anak mengungkapkan perasaan dengan kata-kata ('aku mau pinjam', 'sebentar ya') daripada tindakan fisik.");
    }
  }

  return { narratives, stimulations };
}
