/**
 * Kalamula — Classroom System (Kelas 1A - 6B) Data Store
 * 
 * Manages:
 * - 12 Classrooms (1A to 6B) with PIN authentication (default '1234')
 * - Manual Student Roster per class (independent from SPMB)
 * - Custom Learning Objectives (Tujuan Pembelajaran / TP) tagged with 8 Dimensi Deep Learning
 * - Qualitative Observational Assessments (Scale 1-4 & Anecdotal Notes)
 */

const uuidv4 = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
import type {
  Classroom,
  ClassroomStudent,
  ClassroomObjective,
  ClassroomAssessment,
  DeepLearningDimensionId,
} from "@/types";

export interface ClassroomDataState {
  classrooms: Map<string, Classroom>;
  students: Map<string, ClassroomStudent>;
  objectives: Map<string, ClassroomObjective>;
  assessments: Map<string, ClassroomAssessment>;
}

// ─── Default Classrooms (1A to 6B) ──────────────────────────────

export const DEFAULT_CLASSROOMS: Classroom[] = [
  { id: "1A", grade: 1, section: "A", name: "Kelas 1A", teacher_name: "Ustadzah Fatimah, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 24 },
  { id: "1B", grade: 1, section: "B", name: "Kelas 1B", teacher_name: "Ustadzah Khadijah, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 24 },
  { id: "2A", grade: 2, section: "A", name: "Kelas 2A", teacher_name: "Ustadz Salman, S.Pd.I.", pin: "1234", academic_year: "2026/2027", student_count: 26 },
  { id: "2B", grade: 2, section: "B", name: "Kelas 2B", teacher_name: "Ustadzah Maryam, M.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 25 },
  { id: "3A", grade: 3, section: "A", name: "Kelas 3A", teacher_name: "Ustadzah Aisyah, S.Si.", pin: "1234", academic_year: "2026/2027", student_count: 28 },
  { id: "3B", grade: 3, section: "B", name: "Kelas 3B", teacher_name: "Ustadz Abdullah, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 27 },
  { id: "4A", grade: 4, section: "A", name: "Kelas 4A", teacher_name: "Ustadz Ibrahim, M.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 28 },
  { id: "4B", grade: 4, section: "B", name: "Kelas 4B", teacher_name: "Ustadzah Hafsah, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 28 },
  { id: "5A", grade: 5, section: "A", name: "Kelas 5A", teacher_name: "Ustadz Ali, S.T., S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 30 },
  { id: "5B", grade: 5, section: "B", name: "Kelas 5B", teacher_name: "Ustadzah Zainab, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 29 },
  { id: "6A", grade: 6, section: "A", name: "Kelas 6A", teacher_name: "Ustadz Umar, M.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 30 },
  { id: "6B", grade: 6, section: "B", name: "Kelas 6B", teacher_name: "Ustadzah Ruqayyah, S.Pd.", pin: "1234", academic_year: "2026/2027", student_count: 30 },
];

// ─── Default Sample Learning Objectives (Tujuan Pembelajaran) ────
// Grouped by Subject & Linked to 8 Dimensi Profil Deep Learning

export const DEFAULT_OBJECTIVES: ClassroomObjective[] = [
  // 1. Keimanan & Ketakwaan
  {
    id: "tp-faith-01",
    classroom_id: "all",
    subject: "Pendidikan Agama & Adab",
    tp_code: "TP-PAI-01",
    tp_title: "Membiasakan Adab Berdoa & Kejujuran",
    tp_description: "Menunjukkan sikap khusyuk saat berdoa dan konsisten jujur dalam perkataan serta perilaku di kelas.",
    dimension_id: "faith",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 2. Kewargaan (Citizenship)
  {
    id: "tp-citizen-01",
    classroom_id: "all",
    subject: "Pendidikan Pancasila & Sosial",
    tp_code: "TP-KWN-01",
    tp_title: "Kepedulian Lingkungan & Budaya Antre",
    tp_description: "Merawat kebersihan ruang kelas, membuang sampah pada tempatnya, dan tertib menunggu giliran.",
    dimension_id: "citizenship",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 3. Penalaran Kritis (Critical Thinking)
  {
    id: "tp-crit-01",
    classroom_id: "all",
    subject: "Matematika & Logika",
    tp_code: "TP-MAT-01",
    tp_title: "Pemecahan Masalah Bilangan & Pola Logis",
    tp_description: "Mengidentifikasi pola bilangan sederhana serta menjelaskan alasan pemecahan masalah dengan nalar logis.",
    dimension_id: "critical",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 4. Kreativitas (Creativity)
  {
    id: "tp-creat-01",
    classroom_id: "all",
    subject: "Seni & Prakarya (SBdP)",
    tp_code: "TP-KRE-01",
    tp_title: "Eksplorasi Ide Orisinal & Media Visual",
    tp_description: "Menghasilkan karya visual atau representasi ide secara bebas dengan memanfaatkan berbagai media ekspresi.",
    dimension_id: "creativity",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 5. Kolaborasi (Collaboration)
  {
    id: "tp-collab-01",
    classroom_id: "all",
    subject: "IPAS / Proyek Tematik",
    tp_code: "TP-KOL-01",
    tp_title: "Kerjasama Kelompok & Menghargai Peran",
    tp_description: "Berbagi tugas secara aktif dalam kelompok kecil, mendengarkan pendapat teman, dan merayakan keberhasilan bersama.",
    dimension_id: "collaboration",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 6. Kemandirian (Independence / Agency)
  {
    id: "tp-indep-01",
    classroom_id: "all",
    subject: "Karakter & Pembiasaan",
    tp_code: "TP-MAN-01",
    tp_title: "Regulasi Diri & Inisiatif Belajar",
    tp_description: "Mengatur perlengkapan belajar sendiri, fokus pada tugas mandiri, dan tidak mudah menyerah saat menghadapi kendala.",
    dimension_id: "independence",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 7. Kesehatan (Health & Well-being)
  {
    id: "tp-health-01",
    classroom_id: "all",
    subject: "PJOK & Kesehatan Diri",
    tp_code: "TP-KES-01",
    tp_title: "Kebugaran Fisik & Pola Hidup Bersih",
    tp_description: "Menjaga postur duduk ergonomis, mencuci tangan sebelum makan, dan aktif bergerak dengan koordinasi yang seimbang.",
    dimension_id: "health",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // 8. Komunikasi (Communication)
  {
    id: "tp-comm-01",
    classroom_id: "all",
    subject: "Bahasa Indonesia",
    tp_code: "TP-BIN-01",
    tp_title: "Menyampaikan Gagasan Lisan & Literasi Teks",
    tp_description: "Mengungkapkan pemikiran dengan kalimat yang runtut, santun, artikulatif, dan memahami isi bacaan cerita pendek.",
    dimension_id: "communication",
    target_term: "Semester 1",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// ─── Default Sample Students for Kelas 1A (and other classes) ────

export const SEED_STUDENTS_1A: ClassroomStudent[] = [
  { id: "std-1a-01", classroom_id: "1A", nisn: "0134567801", full_name: "Ahmad Zaki Al-Fatih", nickname: "Zaki", gender: "L", learning_group: "Kelompok Reguler", notes: "Sangat antusias pada sains dan matematika.", created_at: new Date().toISOString() },
  { id: "std-1a-02", classroom_id: "1A", nisn: "0134567802", full_name: "Aisyah Humaira Putri", nickname: "Aisyah", gender: "P", learning_group: "Kelompok Pengayaan", notes: "Kemampuan literasi dan bercerita di atas rata-rata.", created_at: new Date().toISOString() },
  { id: "std-1a-03", classroom_id: "1A", nisn: "0134567803", full_name: "Bilal Habibi Pratama", nickname: "Bilal", gender: "L", learning_group: "Kelompok Intervensi", notes: "Perlu pendampingan pada regulasi emosi saat berganti aktivitas.", created_at: new Date().toISOString() },
  { id: "std-1a-04", classroom_id: "1A", nisn: "0134567804", full_name: "Clarissa Kayla Azzahra", nickname: "Clarissa", gender: "P", learning_group: "Kelompok Reguler", notes: "Cermat dan mandiri dalam mengerjakan lembar aktivitas.", created_at: new Date().toISOString() },
  { id: "std-1a-05", classroom_id: "1A", nisn: "0134567805", full_name: "Danendra Bintang Ramadhan", nickname: "Bintang", gender: "L", learning_group: "Kelompok Reguler", notes: "Motorik kasar sangat lincah, aktif di PJOK.", created_at: new Date().toISOString() },
  { id: "std-1a-06", classroom_id: "1A", nisn: "0134567806", full_name: "Fathimah Zahra Ramadhani", nickname: "Zahra", gender: "P", learning_group: "Kelompok Pengayaan", notes: "Sangat santun dan memiliki jiwa kepemimpinan alami.", created_at: new Date().toISOString() },
  { id: "std-1a-07", classroom_id: "1A", nisn: "0134567807", full_name: "Ghaza Al-Ghifari", nickname: "Ghaza", gender: "L", learning_group: "Kelompok Intervensi", notes: "Butuh penguatan pada koordinasi motorik halus (memegang pensil).", created_at: new Date().toISOString() },
  { id: "std-1a-08", classroom_id: "1A", nisn: "0134567808", full_name: "Hafizhah Nuha Salsabila", nickname: "Nuha", gender: "P", learning_group: "Kelompok Reguler", notes: "Pendengar yang tekun dan suka membantu teman sebangku.", created_at: new Date().toISOString() },
  { id: "std-1a-09", classroom_id: "1A", nisn: "0134567809", full_name: "Ibrahim Maulana Rasyid", nickname: "Baim", gender: "L", learning_group: "Kelompok Reguler", notes: "Gemar berhitung cepat dan menyusun balok logika.", created_at: new Date().toISOString() },
  { id: "std-1a-10", classroom_id: "1A", nisn: "0134567810", full_name: "Khansa Nabila Syakira", nickname: "Khansa", gender: "P", learning_group: "Kelompok Pengayaan", notes: "Kreatif dalam mewarnai dan artikulasi komunikasi sangat lugas.", created_at: new Date().toISOString() },
  { id: "std-1a-11", classroom_id: "1A", nisn: "0134567811", full_name: "Luqman Hakim Al-Farabi", nickname: "Luqman", gender: "L", learning_group: "Kelompok Reguler", notes: "Tenang, patuh, dan mudah beradaptasi dalam tim.", created_at: new Date().toISOString() },
  { id: "std-1a-12", classroom_id: "1A", nisn: "0134567812", full_name: "Maryam Shalihah", nickname: "Maryam", gender: "P", learning_group: "Kelompok Reguler", notes: "Rapi dalam merapikan buku dan gemar membaca dongeng.", created_at: new Date().toISOString() },
];

// Sample default assessments for Kelas 1A demo
export const SEED_ASSESSMENTS_1A: ClassroomAssessment[] = [
  { id: "as-1", classroom_id: "1A", student_id: "std-1a-01", objective_id: "tp-crit-01", score_level: 4, anecdotal_note: "Mampu menjelaskan pola deret bilangan dengan mandiri dan percaya diri.", assessed_at: new Date().toISOString() },
  { id: "as-2", classroom_id: "1A", student_id: "std-1a-01", objective_id: "tp-comm-01", score_level: 3, anecdotal_note: "Menceritakan pengalaman liburan dengan runtut.", assessed_at: new Date().toISOString() },
  { id: "as-3", classroom_id: "1A", student_id: "std-1a-02", objective_id: "tp-comm-01", score_level: 4, anecdotal_note: "Kosakata luas, mampu membaca cerita secara fasih dan ekspresif.", assessed_at: new Date().toISOString() },
  { id: "as-4", classroom_id: "1A", student_id: "std-1a-02", objective_id: "tp-collab-01", score_level: 4, anecdotal_note: "Menjadi fasilitator yang baik dalam diskusi kelompok kecil.", assessed_at: new Date().toISOString() },
  { id: "as-5", classroom_id: "1A", student_id: "std-1a-03", objective_id: "tp-indep-01", score_level: 2, anecdotal_note: "Kadang masih perlu diarahkan guru saat waktu istirahat usai.", assessed_at: new Date().toISOString() },
  { id: "as-6", classroom_id: "1A", student_id: "std-1a-03", objective_id: "tp-faith-01", score_level: 3, anecdotal_note: "Hafalan doa harian lancar dan sikap doa khusyuk.", assessed_at: new Date().toISOString() },
  { id: "as-7", classroom_id: "1A", student_id: "std-1a-04", objective_id: "tp-creat-01", score_level: 3, anecdotal_note: "Memilih kombinasi warna cerah dengan ide gambar orisinal.", assessed_at: new Date().toISOString() },
  { id: "as-8", classroom_id: "1A", student_id: "std-1a-07", objective_id: "tp-indep-01", score_level: 1, anecdotal_note: "Masih canggung memegang pensil tripod, butuh pensil grip pembantu.", assessed_at: new Date().toISOString() },
  { id: "as-9", classroom_id: "1A", student_id: "std-1a-10", objective_id: "tp-creat-01", score_level: 4, anecdotal_note: "Karya kolase sangat rapi dan bercerita tentang kebun sekolah.", assessed_at: new Date().toISOString() },
];

// ─── Singleton Store Instance ───────────────────────────────────

let classroomStore: ClassroomDataState | null = null;

export function getClassroomDB(): ClassroomDataState {
  if (!classroomStore) {
    const s: ClassroomDataState = {
      classrooms: new Map(),
      students: new Map(),
      objectives: new Map(),
      assessments: new Map(),
    };

    // Seed classrooms
    DEFAULT_CLASSROOMS.forEach((c) => s.classrooms.set(c.id, { ...c }));

    // Seed objectives
    DEFAULT_OBJECTIVES.forEach((o) => s.objectives.set(o.id, { ...o }));

    // Seed students for 1A
    SEED_STUDENTS_1A.forEach((st) => s.students.set(st.id, { ...st }));

    // Seed assessments for 1A
    SEED_ASSESSMENTS_1A.forEach((as) => s.assessments.set(as.id, { ...as }));

    // Seed sample students for other classes so they aren't completely empty
    for (let g = 1; g <= 6; g++) {
      ["A", "B"].forEach((sec) => {
        const cId = `${g}${sec}`;
        if (cId === "1A") return; // already seeded

        const demoStudent: ClassroomStudent = {
          id: `std-${cId.toLowerCase()}-01`,
          classroom_id: cId,
          nisn: `013${g}000001`,
          full_name: `Siswa Contoh ${cId}`,
          nickname: `Contoh ${cId}`,
          gender: sec === "A" ? "L" : "P",
          learning_group: "Kelompok Reguler",
          notes: `Data awal percontohan ${cId}. Silakan impor data lengkap via Excel.`,
          created_at: new Date().toISOString(),
        };
        s.students.set(demoStudent.id, demoStudent);
      });
    }

    classroomStore = s;
  }
  return classroomStore;
}

// ─── Helper Functions ──────────────────────────────────────────

export function getAllClassrooms(): Classroom[] {
  const db = getClassroomDB();
  return Array.from(db.classrooms.values()).map((c) => {
    // dynamically recount students
    const count = Array.from(db.students.values()).filter((s) => s.classroom_id === c.id).length;
    return { ...c, student_count: count };
  });
}

export function getClassroomById(id: string): Classroom | undefined {
  const db = getClassroomDB();
  const c = db.classrooms.get(id.toUpperCase());
  if (!c) return undefined;
  const count = Array.from(db.students.values()).filter((s) => s.classroom_id === c.id).length;
  return { ...c, student_count: count };
}

export function verifyClassroomPin(id: string, pin: string): boolean {
  const c = getClassroomById(id);
  if (!c) return false;
  return c.pin === pin;
}

export function updateClassroomPin(id: string, newPin: string): boolean {
  const db = getClassroomDB();
  const c = db.classrooms.get(id.toUpperCase());
  if (!c) return false;
  c.pin = newPin;
  db.classrooms.set(c.id, c);
  return true;
}

export function getClassroomStudents(classroomId: string): ClassroomStudent[] {
  const db = getClassroomDB();
  return Array.from(db.students.values()).filter((s) => s.classroom_id === classroomId.toUpperCase());
}

export function addClassroomStudent(student: Omit<ClassroomStudent, "id" | "created_at">): ClassroomStudent {
  const db = getClassroomDB();
  const newStudent: ClassroomStudent = {
    ...student,
    id: uuidv4(),
    classroom_id: student.classroom_id.toUpperCase(),
    created_at: new Date().toISOString(),
  };
  db.students.set(newStudent.id, newStudent);
  return newStudent;
}

export function deleteClassroomStudent(id: string): boolean {
  const db = getClassroomDB();
  return db.students.delete(id);
}

export function getClassroomObjectives(classroomId?: string): ClassroomObjective[] {
  const db = getClassroomDB();
  const upper = classroomId ? classroomId.toUpperCase() : undefined;
  return Array.from(db.objectives.values()).filter(
    (o) => o.classroom_id === "all" || o.classroom_id === upper
  );
}

export function addClassroomObjective(
  objective: Omit<ClassroomObjective, "id" | "created_at">
): ClassroomObjective {
  const db = getClassroomDB();
  const newObj: ClassroomObjective = {
    ...objective,
    id: uuidv4(),
    classroom_id: objective.classroom_id ? objective.classroom_id.toUpperCase() : "all",
    created_at: new Date().toISOString(),
  };
  db.objectives.set(newObj.id, newObj);
  return newObj;
}

export function getClassroomAssessments(classroomId: string): ClassroomAssessment[] {
  const db = getClassroomDB();
  return Array.from(db.assessments.values()).filter(
    (a) => a.classroom_id === classroomId.toUpperCase()
  );
}

export function saveClassroomAssessment(
  assessment: Omit<ClassroomAssessment, "id" | "assessed_at">
): ClassroomAssessment {
  const db = getClassroomDB();
  const upper = assessment.classroom_id.toUpperCase();
  // Check if exists for same student and objective
  const existing = Array.from(db.assessments.values()).find(
    (a) =>
      a.classroom_id === upper &&
      a.student_id === assessment.student_id &&
      a.objective_id === assessment.objective_id
  );

  if (existing) {
    existing.score_level = assessment.score_level;
    existing.anecdotal_note = assessment.anecdotal_note;
    existing.assessed_at = new Date().toISOString();
    db.assessments.set(existing.id, existing);
    return existing;
  }

  const newAssessment: ClassroomAssessment = {
    ...assessment,
    id: uuidv4(),
    classroom_id: upper,
    assessed_at: new Date().toISOString(),
  };
  db.assessments.set(newAssessment.id, newAssessment);
  return newAssessment;
}
