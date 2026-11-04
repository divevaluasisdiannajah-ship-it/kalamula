// ============================================================
// SIAP SEKOLAH — TypeScript Type Definitions
// Matches database schema in migrations/0001_initial_schema.sql
// ============================================================

// ─── Enums & Literals ─────────────────────────────────────────

export type UserRole = "admin" | "evaluator" | "teacher";

export type BatchStatus = "draft" | "active" | "locked";

export type Gender = "L" | "P";

export type ReadingLevel = "L1" | "L2" | "L3" | "L4";

export type AssignedClass = "1A" | "1B";

export type ScoreValue = 1 | 2 | 3 | 4;

export type ScoreLabel = "PB" | "B" | "M" | "BT" | "MB" | "BSH" | "BSB";

export type RedFlagSeverity = "critical" | "moderate";

export type SyncStatus = "synced" | "local" | "pending" | "error";

// ─── Score Helpers ─────────────────────────────────────────────

export const SCORE_LABELS: Record<ScoreValue, ScoreLabel> = {
  1: "PB",
  2: "B",
  3: "M",
  4: "M",
};

export const SCORE_FULL_LABELS: Record<ScoreValue, string> = {
  1: "Perlu Bimbingan",
  2: "Berkembang",
  3: "Mandiri",
  4: "Mandiri",
};

export const READING_LEVEL_LABELS: Record<ReadingLevel, string> = {
  L1: "Logografis: Belum Membaca",
  L2: "Pengenalan Huruf/Fonem",
  L3: "Suku Kata / Kata Sederhana",
  L4: "Membaca Lancar & Paham Makna",
};

// ─── Database Entity Types ─────────────────────────────────────

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin_hash: string | null;
  pos_number: number | null; // 1-5, only for evaluators
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_name: string;
  batch_date: string; // ISO date YYYY-MM-DD
  status: BatchStatus;
  notes: string | null;
  student_count?: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  registration_no: string;
  full_name: string;
  nickname: string;
  birth_date: string; // ISO date YYYY-MM-DD
  gender: Gender;
  parent_name: string | null;
  phone: string | null;
  batch_id: string | null;
  observation_group: string | null; // e.g. "Kelompok 1", "Kelompok 2", "Kelompok 3"
  avatar_seed: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── 6 Fondasi Transisi PAUD-SD Kemendikbudristek ─────────────

export type FoundationNumber = 1 | 2 | 3 | 4 | 5 | 6;

export const FOUNDATION_LABELS: Record<
  FoundationNumber,
  { name: string; short: string; focus: string; color: string; badgeBg: string; badgeText: string }
> = {
  1: {
    name: "Mengenal Nilai Agama dan Budi Pekerti",
    short: "Agama & Budi Pekerti",
    focus: "Adab, kesopanan, kata santun, dan pengenalan adab dasar",
    color: "#7D5327",
    badgeBg: "bg-[#EFE7D6]",
    badgeText: "text-[#7D5327]",
  },
  2: {
    name: "Keterampilan Sosial dan Bahasa untuk Berinteraksi",
    short: "Sosial & Bahasa",
    focus: "Komunikasi dua arah, menyimak instruksi, kerja sama, dan berbagi",
    color: "#36506C",
    badgeBg: "bg-[#E4EAF2]",
    badgeText: "text-[#36506C]",
  },
  3: {
    name: "Kematangan Emosi di Lingkungan Belajar",
    short: "Kematangan Emosi",
    focus: "Regulasi diri, kemandirian berpisah dari orang tua, dan toleransi aturan/kesulitan",
    color: "#8C3713",
    badgeBg: "bg-[#F9E6DC]",
    badgeText: "text-[#8C3713]",
  },
  4: {
    name: "Kematangan Kognitif untuk Melakukan Kegiatan Belajar",
    short: "Kognitif & Literasi",
    focus: "Dasar literasi, pra-numerasi, pemecahan masalah spasial, dan logika dasar",
    color: "#486B5A",
    badgeBg: "bg-[#E4EFE9]",
    badgeText: "text-[#486B5A]",
  },
  5: {
    name: "Pengembangan Keterampilan Motorik dan Perawatan Diri",
    short: "Motorik & Self-Care",
    focus: "Motorik kasar, motorik halus/genggaman pensil, dan kemandirian toilet/urus barang",
    color: "#22352B",
    badgeBg: "bg-[#F3EFE6]",
    badgeText: "text-[#22352B]",
  },
  6: {
    name: "Pemaknaan Belajar yang Positif dan Menyenangkan",
    short: "Pemaknaan Belajar",
    focus: "Antusiasme, keceriaan saat bersekolah, rasa ingin tahu, dan daya juang",
    color: "#B85627",
    badgeBg: "bg-[#F9E6DC]",
    badgeText: "text-[#B85627]",
  },
};

// ─── Assessment Config Types ───────────────────────────────────

export interface ScoreDescriptors {
  1: string;
  2: string;
  3: string;
  4?: string;
}

export interface Indicator {
  id: string;          // e.g. "1.1", "2.3"
  label: string;
  description: string;
  foundation?: FoundationNumber; // 1 s.d. 6 Fondasi Kemendikbud
  score_descriptors: ScoreDescriptors;
}

export interface RedFlag {
  id: string;          // e.g. "rf-1-1"
  label: string;
  severity: RedFlagSeverity;
}

export interface AssessmentConfig {
  id: string;
  version: string;
  pos_number: number;   // 1-5
  pos_name: string;
  pos_description: string | null;
  indicators_json: string;   // JSON string of Indicator[]
  red_flags_json: string;    // JSON string of RedFlag[]
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Parsed version of AssessmentConfig (with JSON fields deserialized)
export interface AssessmentConfigParsed extends Omit<AssessmentConfig, "indicators_json" | "red_flags_json"> {
  indicators: Indicator[];
  red_flags: RedFlag[];
}

// ─── Evaluation Types ──────────────────────────────────────────

export type ScoresJson = Record<string, ScoreValue>; // { "indicator_id": score }
export type RedFlagsJson = Record<string, boolean>;  // { "red_flag_id": true/false }

export interface Evaluation {
  id: string;
  student_id: string;
  batch_id: string;
  pos_number: number;   // 1-5
  evaluator_id: string;
  config_id: string | null;
  scores_json: string;       // JSON string of ScoresJson
  reading_level: ReadingLevel | null; // Pos 4 only
  red_flags_json: string;    // JSON string of RedFlagsJson
  has_red_flag: boolean;
  anecdotal_note: string | null;
  total_score: number | null;
  is_complete: boolean;
  client_id: string | null;  // Offline-first client ID
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Parsed version of Evaluation (with JSON fields deserialized)
export interface EvaluationParsed extends Omit<Evaluation, "scores_json" | "red_flags_json"> {
  scores: ScoresJson;
  red_flags: RedFlagsJson;
}

// ─── Parent Response Types ─────────────────────────────────────

export type ParentResponsesJson = Record<string, string>; // { "q1": "answer" }

export interface ParentResponse {
  id: string;
  student_id: string;
  batch_id: string;
  responses_json: string; // JSON string of ParentResponsesJson
  submitted_at: string;
}

// ─── Class Placement Types ─────────────────────────────────────

export interface ClassPlacement {
  id: string;
  student_id: string;
  batch_id: string;
  assigned_class: AssignedClass;
  algorithm_version: string;
  balance_score: number | null;
  manual_override: boolean;
  override_by: string | null;
  override_reason: string | null;
  override_at: string | null;
  assigned_at: string;
  updated_at: string;
}

// ─── Aggregated / View Types ───────────────────────────────────

/** Complete student profile with all evaluations across all pos */
export interface StudentProfile {
  student: Student;
  batch: Batch | null;
  evaluations: EvaluationParsed[];
  parent_response: ParentResponse | null;
  placement: ClassPlacement | null;
  // Computed fields
  overall_score: number | null;
  completion_rate: number;         // 0-100 percent
  has_any_red_flag: boolean;
  reading_level: ReadingLevel | null;
  pos_scores: Record<number, number | null>; // { 1: avg, 2: avg, ... }
  foundation_scores?: Record<FoundationNumber, number | null>; // 6 Fondasi scores (1.0 - 4.0)
}

/** Summary stats for dashboard */
export interface BatchSummary {
  batch: Batch;
  total_students: number;
  evaluated_students: number;
  completion_rate: number;
  red_flag_count: number;
  class_1a_count: number;
  class_1b_count: number;
  reading_level_distribution: Record<ReadingLevel, number>;
  score_distribution: Record<ScoreLabel, number>;
  gender_breakdown: { L: number; P: number };
}

/** Class balance metrics for Smart Class Balancer */
export interface ClassBalance {
  class: AssignedClass;
  students: StudentProfile[];
  total: number;
  male_count: number;
  female_count: number;
  red_flag_count: number;
  avg_score: number;
  reading_level_distribution: Record<ReadingLevel, number>;
  balance_score: number; // 0-100, higher is more balanced
}

// ─── Offline / PWA Types ───────────────────────────────────────

/** Pending evaluation in IndexedDB queue */
export interface PendingSync {
  client_id: string;
  type: "evaluation" | "parent_response";
  payload: EvaluationParsed | ParentResponse;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}

/** Sync state for UI indicator */
export interface SyncState {
  status: SyncStatus;
  pending_count: number;
  last_synced_at: string | null;
  error_message: string | null;
}

// ─── API Response Types ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── Excel Import Types ────────────────────────────────────────

/** Raw row from uploaded Excel file */
export interface ExcelStudentRow {
  No_Pendaftaran: string;
  Nama_Lengkap: string;
  Nama_Panggilan: string;
  Tanggal_Lahir: string; // flexible format, will be normalized
  Jenis_Kelamin: string; // "L" | "P" | "Laki-laki" | "Perempuan"
  Nama_Orang_Tua?: string;
  No_WhatsApp?: string;
  Kelompok?: string; // e.g. "Kelompok 1", "Kelompok 2", "Kelompok 3"
}

/** Validation result for each Excel row */
export interface ExcelValidationResult {
  row_index: number;
  data: ExcelStudentRow;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  is_duplicate: boolean;
}

// ─── Auth / Session Types ──────────────────────────────────────

export interface Session {
  user_id: string;
  user_name: string;
  role: UserRole;
  pos_number: number | null;
  expires_at: string;
}

export interface LoginPayload {
  pin: string;
  pos_number?: number; // for evaluator login
}

// ─── 8 Dimensi Profil Lulusan Pembelajaran Mendalam (Deep Learning) ───

export type DeepLearningDimensionId =
  | "faith"          // 1. Keimanan dan Ketakwaan kepada Tuhan YME
  | "citizenship"    // 2. Kewargaan (Citizenship)
  | "critical"       // 3. Penalaran Kritis (Critical Thinking)
  | "creativity"     // 4. Kreativitas (Creativity)
  | "collaboration"  // 5. Kolaborasi (Collaboration)
  | "independence"   // 6. Kemandirian (Self-Reliance / Agency)
  | "health"         // 7. Kesehatan (Health & Well-being)
  | "communication"; // 8. Komunikasi (Communication)

export interface DeepLearningDimensionInfo {
  id: DeepLearningDimensionId;
  number: number;
  name: string;
  english: string;
  focus: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  mdiIcon: string;
}

export const DEEP_LEARNING_DIMENSIONS: Record<DeepLearningDimensionId, DeepLearningDimensionInfo> = {
  faith: {
    id: "faith",
    number: 1,
    name: "Keimanan & Ketakwaan",
    english: "Faith & Spiritual Values",
    focus: "Spiritualitas, integritas moral, kejujuran, dan adab mulia dalam keseharian",
    color: "#7D5327",
    badgeBg: "bg-[#EFE7D6]",
    badgeText: "text-[#7D5327]",
    mdiIcon: "mdi-hands-pray",
  },
  citizenship: {
    id: "citizenship",
    number: 2,
    name: "Kewargaan",
    english: "Citizenship & Responsibility",
    focus: "Kepedulian sosial, cinta lingkungan, gotong royong, dan tanggung jawab nyata",
    color: "#36506C",
    badgeBg: "bg-[#E4EAF2]",
    badgeText: "text-[#36506C]",
    mdiIcon: "mdi-earth",
  },
  critical: {
    id: "critical",
    number: 3,
    name: "Penalaran Kritis",
    english: "Critical Thinking",
    focus: "Berpikir logis, analitis, evaluasi fakta objektif, dan pemikiran reflektif",
    color: "#486B5A",
    badgeBg: "bg-[#E4EFE9]",
    badgeText: "text-[#486B5A]",
    mdiIcon: "mdi-brain",
  },
  creativity: {
    id: "creativity",
    number: 4,
    name: "Kreativitas",
    english: "Creativity & Innovation",
    focus: "Eksplorasi ide orisinal, fleksibilitas berpikir, dan solusi inovatif bermanfaat",
    color: "#B85627",
    badgeBg: "bg-[#F9E6DC]",
    badgeText: "text-[#B85627]",
    mdiIcon: "mdi-lightbulb-on-outline",
  },
  collaboration: {
    id: "collaboration",
    number: 5,
    name: "Kolaborasi",
    english: "Collaboration & Teamwork",
    focus: "Kerjasama sinergis, saling menghargai peran, dan mencapai tujuan bersama",
    color: "#22352B",
    badgeBg: "bg-[#EFECE4]",
    badgeText: "text-[#22352B]",
    mdiIcon: "mdi-account-group-outline",
  },
  independence: {
    id: "independence",
    number: 6,
    name: "Kemandirian",
    english: "Independence & Agency",
    focus: "Regulasi diri, inisiatif belajar, ketangguhan (resilience), dan daya juang",
    color: "#7D5327",
    badgeBg: "bg-[#FAF8F5]",
    badgeText: "text-[#7D5327]",
    mdiIcon: "mdi-compass-outline",
  },
  health: {
    id: "health",
    number: 7,
    name: "Kesehatan",
    english: "Health & Well-being",
    focus: "Kebugaran fisik, motorik seimbang, kesehatan mental, dan pola hidup sehat",
    color: "#486B5A",
    badgeBg: "bg-[#F2F7F4]",
    badgeText: "text-[#486B5A]",
    mdiIcon: "mdi-heart-pulse",
  },
  communication: {
    id: "communication",
    number: 8,
    name: "Komunikasi",
    english: "Communication",
    focus: "Gagasan jelas, santun, efektif lisan-tulisan, dan aktif menjadi pendengar",
    color: "#36506C",
    badgeBg: "bg-[#E8EFF7]",
    badgeText: "text-[#36506C]",
    mdiIcon: "mdi-message-text-outline",
  },
};

// ─── Classroom System (Kelas 1A - 6B) Types ─────────────────────

export interface Classroom {
  id: string; // e.g. "1A", "1B", ... "6B"
  grade: number; // 1..6
  section: "A" | "B";
  name: string; // "Kelas 1A"
  teacher_name?: string | null;
  pin: string; // default "1234"
  academic_year?: string;
  student_count?: number;
}

export interface ClassroomStudent {
  id: string;
  classroom_id: string; // "1A", etc.
  nisn: string;
  full_name: string;
  nickname: string;
  gender: "L" | "P";
  learning_group?: string; // "Kelompok Intervensi", "Kelompok Reguler", "Kelompok Pengayaan"
  literacy_level?: "L1" | "L2" | "L3" | "L4";
  numeracy_level?: "L1" | "L2" | "L3" | "L4";
  notes?: string | null;
  created_at: string;
}

export interface ClassroomObjective {
  id: string;
  classroom_id: string; // "1A" etc or "all"
  subject: string; // "Bahasa Indonesia", "Matematika", "IPAS", "Pendidikan Agama", "Karakter", dll.
  tp_code: string; // e.g. "TP-1.1", "TP-MAT-01"
  tp_title: string;
  tp_description: string;
  dimension_id: DeepLearningDimensionId;
  target_term?: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassroomAssessment {
  id: string;
  classroom_id: string;
  student_id: string;
  objective_id: string;
  score_level: 1 | 2 | 3 | 4; // 1: Perlu Bimbingan, 2: Cukup, 3: Berkembang Baik, 4: Mahir
  anecdotal_note?: string | null;
  assessed_at: string;
}

// ─── School Profile & Teacher Staff Types ────────────────────────

export interface SchoolProfile {
  id: string;
  foundation_name: string; // e.g. "Yayasan Pendidikan Islam An-Najah"
  school_name: string;     // e.g. "SDIT An-Najah"
  npsn: string;            // e.g. "20212345"
  address: string;         // e.g. "Jl. Pendidikan Karakter No. 10"
  subdistrict: string;     // e.g. "Kec. Cikarang Barat"
  city: string;            // e.g. "Kabupaten Bekasi"
  province: string;        // e.g. "Jawa Barat"
  postal_code: string;     // e.g. "17530"
  phone: string;           // e.g. "021-89012345"
  whatsapp: string;        // e.g. "081234567890"
  email: string;           // e.g. "sdit.annajah@sch.id"
  website: string;         // e.g. "observasi.sdiannajah.ai.id"
  principal_name: string;  // e.g. "Ustadz H. Ahmad Syaikhu, M.Pd.I."
  principal_nip: string;   // e.g. "19780512 200501 1 003"
  academic_year: string;   // e.g. "2026/2027"
  active_semester: "Ganjil" | "Genap";
  logo_url: string;        // e.g. "/icons/icon-192x192.png"
  updated_at: string;
}

export type TeacherRole = "homeroom" | "subject" | "evaluator" | "management";

export interface TeacherStaff {
  id: string;
  name: string;           // e.g. "Ustadzah Fatimah, S.Pd."
  nip_niy: string;        // e.g. "NIY. 2018070101"
  gender: "L" | "P";
  phone: string;          // e.g. "081234567891"
  email?: string;
  role: TeacherRole;
  assigned_class?: string | null; // e.g. "1A", "2B", etc.
  subject_specialty?: string | null; // e.g. "Pendidikan Agama Islam", "PJOK"
  is_evaluator: boolean;
  evaluator_pos?: number | null; // 1..5
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Literasi & Numerasi Readiness Matrices (Fase A, B, C) ───────

export type ReadinessTier = "L1" | "L2" | "L3" | "L4";

export interface ReadinessDescriptor {
  level: ReadinessTier;
  title: string;
  shortDesc: string;
  fullDesc: string;
  actionGuidance: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface FaseMatrix {
  fase: "A" | "B" | "C";
  grades: string;
  literacy_focus: string;
  numeracy_focus: string;
  literacy: Record<ReadinessTier, ReadinessDescriptor>;
  numeracy: Record<ReadinessTier, ReadinessDescriptor>;
}

export const FASE_READINESS_MATRICES: Record<"A" | "B" | "C", FaseMatrix> = {
  A: {
    fase: "A",
    grades: "Kelas 1 & 2 SD",
    literacy_focus: "Fonik, Suku Kata & Kalimat Pendek",
    numeracy_focus: "Number Sense 1–100 & Pola Konkret",
    literacy: {
      L1: {
        level: "L1",
        title: "Pra-Sastra / Pengenalan Huruf",
        shortDesc: "Belum konsisten membedakan bunyi & bentuk huruf.",
        fullDesc: "Sering tertukar bentuk huruf b/d, p/q. Belum bisa merangkai dua huruf menjadi suku kata terbuka secara konsisten.",
        actionGuidance: "Meja intervensi intensif: gunakan kartu huruf raba, kotak pasir, menyusun huruf plastisin & lagu fonik riang.",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Membaca Suku Kata Terbuka (K-V)",
        shortDesc: "Mampu membaca suku kata berpola bu-ku, ba-tu.",
        fullDesc: "Mengeja perlahan per suku kata. Masih terbata pada suku kata tertutup (K-V-K seperti mak-an) atau konsonan ganda (ng, ny).",
        actionGuidance: "Latihan flashcard suku kata & sight words (ini, itu, ada), permainan menyusun potongan suku kata bermakna.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Membaca Kalimat Sederhana (Target Fase A)",
        shortDesc: "Membaca lancar kalimat 4-6 kata dengan intonasi wajar.",
        fullDesc: "Mampu menjawab pertanyaan informasi literal langsung dari teks bacaan pendek bergambar.",
        actionGuidance: "Buku cerita berjenjang (1-2 kalimat/halaman), lembar aktivitas mengurutkan kata acak menjadi kalimat utuh.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Membaca Fasih & Menceritakan Ulang (Pengayaan)",
        shortDesc: "Membaca mandiri teks cerita pendek & kaya kosakata.",
        fullDesc: "Mampu menceritakan kembali alur cerita dengan kalimatnya sendiri dan mengungkapkan opini sederhana tentang tokoh.",
        actionGuidance: "Buku cerita berjenjang tingkat lanjut, jurnal cerita bergambar mandiri, dan peran tutor sebaya.",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
    numeracy: {
      L1: {
        level: "L1",
        title: "Membilang Konkret Terbatas",
        shortDesc: "Hafal membilang 1-10 namun belum korespondensi 1-ke-1.",
        fullDesc: "Menunjuk benda saat membilang sering meleset dari jumlah asli. Belum memahami konsep perbandingan lebih banyak/sedikit.",
        actionGuidance: "Media manipulatif konkret: kancing warna, tutup botol, garis bilangan lantai loncat, dan papan sepuluh (ten frames).",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Bilangan 1-20 & Hitung Maju",
        shortDesc: "Kuantitas hingga 20 benar, penjumlahan dengan hitung jari.",
        fullDesc: "Mampu menjumlahkan dengan counting on. Masih bingung pada operasi pengurangan dan pemisahan nilai tempat puluhan-satuan.",
        actionGuidance: "Kenalkan ikatan 10 stik es krim = 1 puluhan, garis bilangan visual meja, cerita kontekstual konkret.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Operasi 1-100 & Nilai Tempat (Target Fase A)",
        shortDesc: "Penjumlahan/pengurangan dua angka & nilai tempat puluhan.",
        fullDesc: "Memahami 25 = 2 puluhan + 5 satuan. Mampu mengenali pola bilangan berulang dan memecahkan soal cerita 1-langkah.",
        actionGuidance: "Pembelajaran reguler modul ajar, simulasi kantin kejujuran kelas menggunakan uang mainan rupiah sederhana.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Hitung Mental Cepat & Penalaran Logis (Pengayaan)",
        shortDesc: "Hitung mental cepat & konsep awal perkalian berulang.",
        fullDesc: "Paham 3 x 2 = 2 + 2 + 2. Mampu menjelaskan alasan/logika penyelesaian soal kepada guru dan teman.",
        actionGuidance: "Teka-teki matematika, piramida angka, eksplorasi bangun datar tangram spasial, dan membuat soal cerita mandiri.",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
  },
  B: {
    fase: "B",
    grades: "Kelas 3 & 4 SD",
    literacy_focus: "Pemahaman Paragraf & Inferensi Teks",
    numeracy_focus: "Multiplikasi & Pecahan Konkret",
    literacy: {
      L1: {
        level: "L1",
        title: "Literal Murni / Butuh Bantuan Paragraf",
        shortDesc: "Membaca lancar lisan, namun hanya paham teks tersurat persis.",
        fullDesc: "Hanya bisa menjawab pertanyaan jika jawabannya tertulis persis kata-per-kata. Bingung menentukan ide pokok paragraf.",
        actionGuidance: "Teks bacaan pendek (1 paragraf) disertai ilustrasi visual penjelas dan pertanyaan panduan bertahap.",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Ide Pokok & Kronologi Peristiwa",
        shortDesc: "Menemukan ide pokok & menyusun urutan peristiwa cerita.",
        fullDesc: "Mampu merangkum alur cerita 2-3 paragraf. Masih kesulitan menebak pesan tersirat atau maksud tersembunyi penulis.",
        actionGuidance: "Latihan mind-mapping alur cerita dan diagram sebab-akibat sederhana.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Inferensi & Fakta vs Opini (Target Fase B)",
        shortDesc: "Menebak makna tersirat, watak tokoh, & fakta vs opini.",
        fullDesc: "Mampu menjelaskan mengapa tokoh bertindak tertentu dan menyimpulkan sebab-akibat yang tidak tertulis langsung.",
        actionGuidance: "Teks cerita & informasi standar buku ajar, diskusi kelompok kecil untuk membedakan fakta dan pendapat.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Analisis Kritis & Refleksi Teks (Pengayaan)",
        shortDesc: "Mengaitkan bacaan dengan fakta nyata & refleksi argumentatif.",
        fullDesc: "Mampu menilai kebenaran tindakan tokoh, membandingkan isi dua teks bertema sama, dan menulis ulasan bacaan.",
        actionGuidance: "Teks sains populer anak, peran ketua diskusi literasi kelompok, dan proyek resensi buku perpustakaan.",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
    numeracy: {
      L1: {
        level: "L1",
        title: "Penjumlahan Besar Masih Konkret",
        shortDesc: "Masih bergantung hitung jari/benda, perkalian belum kokoh.",
        fullDesc: "Belum memahami perkalian sebagai penjumlahan berulang. Kesulitan jika dihadapkan operasi angka ratusan.",
        actionGuidance: "Alat peraga balok Dienes, kartu tabel perkalian bergambar, dan penguatan konsep dasar perkalian konkret.",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Operasi Prosedural Lancar, Soal Cerita Terbata",
        shortDesc: "Bisa hitung angka murni, bingung saat dijadikan soal cerita.",
        fullDesc: "Hafal tabel perkalian dan pembagian dasar, tapi kesulitan menerjemahkan masalah kontekstual ke kalimat matematika.",
        actionGuidance: "Latihan membongkar soal cerita: 'Apa yang diketahui?', 'Apa yang ditanyakan?', dan 'Bagaimana kalimat matematikanya?'.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Pecahan Dasar & Masalah Multi-Langkah (Target Fase B)",
        shortDesc: "Pecahan 1/2, 1/4, 3/4 & soal cerita kontekstual 2 langkah.",
        fullDesc: "Memahami pecahan senilai konkret, konversi satuan baku (panjang, berat, waktu), dan luas/keliling bangun datar sederhana.",
        actionGuidance: "Pembelajaran reguler modul ajar, proyek pengukuran perabot kelas dan perhitungan belanja kelompok.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Pola Bilangan Kompleks & Pemecahan Masalah (Pengayaan)",
        shortDesc: "Menaksir hasil pengukuran & menyelesaikan soal non-rutin.",
        fullDesc: "Mampu menemukan rumus pola deret bilangan dan merumuskan strategi hitung alternatif yang lebih efisien.",
        actionGuidance: "Tantangan olimpiade mini matematika SD, mendesain denah ruang berskala, dan optimasi jadwal kegiatan.",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
  },
  C: {
    fase: "C",
    grades: "Kelas 5 & 6 SD",
    literacy_focus: "Analisis Multiteks & AKM-Ready",
    numeracy_focus: "Rasio, Desimal & Geometri Ruang",
    literacy: {
      L1: {
        level: "L1",
        title: "Kesulitan Teks Panjang / Kosakata Ilmiah",
        shortDesc: "Cepat lelah membaca teks >3 paragraf atau sarat istilah ilmiah.",
        fullDesc: "Sering kehilangan fokus pada teks panjang dan melewatkan poin penting karena kosakata akademik terbatas.",
        actionGuidance: "Disediakan teks intisari berinfografis dengan glosarium istilah sukar di samping teks bacaan.",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Pemahaman Teks Tunggal Baik, Sintesis Belum Mampu",
        shortDesc: "Menyimpulkan teks tunggal lancar, sulit membandingkan 2 sudut pandang.",
        fullDesc: "Paham pesan moral dan ide cerita satu buku, namun bingung jika diminta membandingkan dua artikel yang berbeda sudut pandang.",
        actionGuidance: "Tabel perbandingan berdampingan (side-by-side) untuk menuliskan poin persamaan dan perbedaan isi teks.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Memadukan Teks & Data Infografis (Target Fase C - AKM Ready)",
        shortDesc: "Menganalisis teks naratif & faktual yang disertai tabel/diagram.",
        fullDesc: "Mampu menguji apakah argumen penulis didukung oleh data fakta pada diagram dan menilai relevansi informasi.",
        actionGuidance: "Pembelajaran reguler berbasis riset pustaka & penulisan laporan mini penyelidikan IPAS.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Literasi Kritis & Sintesis Opini Orisinal (Pengayaan)",
        shortDesc: "Mengevaluasi kredibilitas sumber informasi & mendeteksi bias.",
        fullDesc: "Mampu membedakan berita valid vs hoaks, serta menyusun esai opini orisinal dengan argumentasi data yang logis.",
        actionGuidance: "Proyek karya tulis ilmiah sederhana anak, buletin artikel mading sekolah, dan fasilitator riset kelompok.",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
    numeracy: {
      L1: {
        level: "L1",
        title: "Konsep Desimal & Pecahan Campuran Rancu",
        shortDesc: "Nilai tempat desimal keliru (mengira 0.15 > 0.5) & pecahan beda penyebut macet.",
        fullDesc: "Hanya hafal rumus perkalian pecahan tanpa makna konseptual. Gagal memahami konsep perbandingan.",
        actionGuidance: "Bimbingan meja depan menggunakan alat peraga balok pecahan dan diagram area desimal berwarna.",
        color: "#B85627",
        badgeBg: "bg-[#F9E6DC]",
        badgeText: "text-[#B85627]",
      },
      L2: {
        level: "L2",
        title: "Prosedur Pecahan/Persen Bisa, Esensi Rasio Belum Paham",
        shortDesc: "Menghitung pecahan baku bisa, bingung saat diterapkan ke rasio nyata.",
        fullDesc: "Dapat menyelesaikan soal matematika hitungan formal, tetapi bingung saat menghitung diskon belanja atau skala peta.",
        actionGuidance: "Studi kasus riil: menghitung perbandingan bahan resep masakan, diskon toko buku, dan skala denah rumah.",
        color: "#7D5327",
        badgeBg: "bg-[#EFE7D6]",
        badgeText: "text-[#7D5327]",
      },
      L3: {
        level: "L3",
        title: "Rasio, Diagram Data, & Geometri Ruang (Target Fase C)",
        shortDesc: "Menafsirkan diagram batang/lingkaran, volume ruang, & skala.",
        fullDesc: "Mampu menyelesaikan masalah keuangan sederhana, rasio perbandingan, dan volume bangun ruang gabungan.",
        actionGuidance: "Pembelajaran mandiri modul ajar matematika, proyek analisis data statistik mini di kelas.",
        color: "#486B5A",
        badgeBg: "bg-[#E4EFE9]",
        badgeText: "text-[#486B5A]",
      },
      L4: {
        level: "L4",
        title: "Analisis Data Lanjutan & Optimasi Strategi (Pengayaan)",
        shortDesc: "Menganalisis tren grafik data riil & memprediksi peluang.",
        fullDesc: "Mampu merumuskan pemodelan matematika dari masalah nyata sekolah dan memilih alternatif solusi paling efektif.",
        actionGuidance: "Proyek survei dan pengolahan data riil (misal: estimasi limbah sampah kantin & rancangan efisiensi daur ulang).",
        color: "#22352B",
        badgeBg: "bg-[#EFECE4]",
        badgeText: "text-[#22352B]",
      },
    },
  },
};


