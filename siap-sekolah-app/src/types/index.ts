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

export type ScoreLabel = "BT" | "MB" | "BSH" | "BSB";

export type RedFlagSeverity = "critical" | "moderate";

export type SyncStatus = "synced" | "local" | "pending" | "error";

// ─── Score Helpers ─────────────────────────────────────────────

export const SCORE_LABELS: Record<ScoreValue, ScoreLabel> = {
  1: "BT",
  2: "MB",
  3: "BSH",
  4: "BSB",
};

export const SCORE_FULL_LABELS: Record<ScoreValue, string> = {
  1: "Belum Tercapai",
  2: "Mulai Berkembang",
  3: "Berkembang Sesuai Harapan",
  4: "Berkembang Sangat Baik",
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
  avatar_seed: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Assessment Config Types ───────────────────────────────────

export interface ScoreDescriptors {
  1: string;
  2: string;
  3: string;
  4: string;
}

export interface Indicator {
  id: string;          // e.g. "1.1", "2.3"
  label: string;
  description: string;
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
