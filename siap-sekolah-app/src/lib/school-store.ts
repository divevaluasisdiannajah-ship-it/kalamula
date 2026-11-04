/**
 * Kalamula — School Profile & Teacher Staff Data Store
 * 
 * Manages:
 * - Centralized School Identity (Name, Foundation, NPSN, Address, Principal, Academic Year)
 * - Teacher Staff Roster & Roles (Homeroom 1A-6B, Subject Teachers, SPMB Evaluators)
 * - Dynamic synchronization with Letterhead Kop, A4 Reports, and Classroom Workspaces
 */

import type { SchoolProfile, TeacherStaff } from "@/types";
import { getClassroomDB } from "./classroom-store";

const uuidv4 = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  id: "school-sdi-annajah",
  foundation_name: "Yayasan Nurun Najah",
  school_name: "SD Islam An Najah",
  npsn: "20109914",
  address: "Jl. SMA 64 RT 008 RW 02",
  subdistrict: "Cipayung",
  city: "Jakarta Timur",
  province: "DKI Jakarta",
  postal_code: "13840",
  phone: "085864464420",
  whatsapp: "085864464420",
  email: "sdislamannajah.cpy@gmail.com",
  website: "observasi.sdiannajah.ai.id",
  principal_name: "Wida Mawaddah, S. Pd., Gr.",
  principal_nip: "-",
  academic_year: "2026/2027",
  active_semester: "Ganjil",
  logo_url: "/icons/icon-192x192.png",
  updated_at: new Date().toISOString(),
};

export const DEFAULT_TEACHERS: TeacherStaff[] = [
  // 5 Petugas Evaluator Pos SPMB Resmi
  { id: "tch-eval-so1", name: "Ahmad Furqoni, S. Pd", nip_niy: "-", gender: "L", phone: "-", email: "", role: "evaluator", is_evaluator: true, evaluator_pos: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-eval-so2", name: "Novia Permatasari, S. Pd", nip_niy: "-", gender: "P", phone: "-", email: "", role: "evaluator", is_evaluator: true, evaluator_pos: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-eval-pos2", name: "Rifky Delsandi Rifai, S. Pd", nip_niy: "-", gender: "L", phone: "-", email: "", role: "evaluator", is_evaluator: true, evaluator_pos: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-eval-pos3", name: "Shalma Ruhail Maldova, S. Pd", nip_niy: "-", gender: "P", phone: "-", email: "", role: "evaluator", is_evaluator: true, evaluator_pos: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-eval-pos4", name: "Susmurtiningsih, S. Pd", nip_niy: "-", gender: "P", phone: "-", email: "", role: "evaluator", is_evaluator: true, evaluator_pos: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // 12 Rombel Wali Kelas (1A s.d. 6B) - Menunggu pengisian lengkap
  { id: "tch-1a", name: "Wali Kelas 1A", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "1A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-1b", name: "Wali Kelas 1B", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "1B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-2a", name: "Wali Kelas 2A", nip_niy: "-", gender: "L", phone: "-", email: "", role: "homeroom", assigned_class: "2A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-2b", name: "Wali Kelas 2B", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "2B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-3a", name: "Wali Kelas 3A", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "3A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-3b", name: "Wali Kelas 3B", nip_niy: "-", gender: "L", phone: "-", email: "", role: "homeroom", assigned_class: "3B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-4a", name: "Wali Kelas 4A", nip_niy: "-", gender: "L", phone: "-", email: "", role: "homeroom", assigned_class: "4A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-4b", name: "Wali Kelas 4B", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "4B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-5a", name: "Wali Kelas 5A", nip_niy: "-", gender: "L", phone: "-", email: "", role: "homeroom", assigned_class: "5A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-5b", name: "Wali Kelas 5B", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "5B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-6a", name: "Wali Kelas 6A", nip_niy: "-", gender: "L", phone: "-", email: "", role: "homeroom", assigned_class: "6A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-6b", name: "Wali Kelas 6B", nip_niy: "-", gender: "P", phone: "-", email: "", role: "homeroom", assigned_class: "6B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Guru Mata Pelajaran Khusus (Opsional)
  { id: "tch-sub-1", name: "Guru PAI / Tahfizh", nip_niy: "-", gender: "L", phone: "-", email: "", role: "subject", subject_specialty: "Pendidikan Agama Islam & Tahfizh", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-sub-2", name: "Guru PJOK", nip_niy: "-", gender: "L", phone: "-", email: "", role: "subject", subject_specialty: "PJOK & Kesehatan", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-sub-3", name: "Guru Bahasa Inggris", nip_niy: "-", gender: "P", phone: "-", email: "", role: "subject", subject_specialty: "Bahasa Inggris", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Kepala Sekolah & Tim Manajemen
  { id: "tch-mgt-1", name: "Wida Mawaddah, S. Pd., Gr.", nip_niy: "-", gender: "P", phone: "085864464420", email: "sdislamannajah.cpy@gmail.com", role: "management", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export interface SchoolDataState {
  profile: SchoolProfile;
  teachers: Map<string, TeacherStaff>;
}

let schoolStore: SchoolDataState | null = null;

export function getSchoolDB(): SchoolDataState {
  if (!schoolStore) {
    const s: SchoolDataState = {
      profile: { ...DEFAULT_SCHOOL_PROFILE },
      teachers: new Map(),
    };
    DEFAULT_TEACHERS.forEach((t) => s.teachers.set(t.id, { ...t }));
    schoolStore = s;
  }
  return schoolStore;
}

export function getSchoolProfile(): SchoolProfile {
  const db = getSchoolDB();
  return { ...db.profile };
}

export function updateSchoolProfile(updates: Partial<SchoolProfile>): SchoolProfile {
  const db = getSchoolDB();
  db.profile = {
    ...db.profile,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Synchronize academic year with classrooms
  if (updates.academic_year) {
    const classroomDB = getClassroomDB();
    classroomDB.classrooms.forEach((c) => {
      c.academic_year = updates.academic_year;
    });
  }

  return { ...db.profile };
}

export function getAllTeachers(): TeacherStaff[] {
  const db = getSchoolDB();
  return Array.from(db.teachers.values());
}

export function getTeacherById(id: string): TeacherStaff | undefined {
  const db = getSchoolDB();
  return db.teachers.get(id);
}

export function saveTeacher(teacher: Omit<TeacherStaff, "id" | "created_at" | "updated_at"> & { id?: string }): TeacherStaff {
  const db = getSchoolDB();
  const id = teacher.id || `tch-${uuidv4().substring(0, 8)}`;
  const existing = db.teachers.get(id);

  const updated: TeacherStaff = {
    ...teacher,
    id,
    created_at: existing ? existing.created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.teachers.set(id, updated);

  // If this teacher is assigned as a homeroom teacher (Wali Kelas), sync classroom store!
  if (updated.role === "homeroom" && updated.assigned_class) {
    const classroomDB = getClassroomDB();
    const targetClass = classroomDB.classrooms.get(updated.assigned_class.toUpperCase());
    if (targetClass) {
      targetClass.teacher_name = updated.name;
    }
  }

  return updated;
}

export function deleteTeacher(id: string): boolean {
  const db = getSchoolDB();
  return db.teachers.delete(id);
}
