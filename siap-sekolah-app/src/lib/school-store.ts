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
  id: "school-sdit-annajah",
  foundation_name: "Yayasan Pendidikan Islam An-Najah",
  school_name: "SDIT An-Najah",
  npsn: "20218492",
  address: "Jl. KH. Noer Ali No. 27, Jatisari",
  subdistrict: "Jatiasih",
  city: "Kota Bekasi",
  province: "Jawa Barat",
  postal_code: "17426",
  phone: "(021) 8499-1234",
  whatsapp: "0812-8899-7766",
  email: "sdit.annajah@sch.id",
  website: "observasi.sdiannajah.ai.id",
  principal_name: "Ustadz H. Ahmad Syaikhu, M.Pd.I.",
  principal_nip: "NIY. 19780512 200501 1 001",
  academic_year: "2026/2027",
  active_semester: "Ganjil",
  logo_url: "/icons/icon-192x192.png",
  updated_at: new Date().toISOString(),
};

export const DEFAULT_TEACHERS: TeacherStaff[] = [
  // 12 Wali Kelas (Homeroom Teachers)
  { id: "tch-1a", name: "Ustadzah Fatimah, S.Pd.", nip_niy: "NIY. 2018070101", gender: "P", phone: "081234567801", email: "fatimah@sdiannajah.sch.id", role: "homeroom", assigned_class: "1A", is_evaluator: true, evaluator_pos: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-1b", name: "Ustadzah Khadijah, S.Pd.", nip_niy: "NIY. 2018070102", gender: "P", phone: "081234567802", email: "khadijah@sdiannajah.sch.id", role: "homeroom", assigned_class: "1B", is_evaluator: true, evaluator_pos: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-2a", name: "Ustadz Salman, S.Pd.I.", nip_niy: "NIY. 2019070103", gender: "L", phone: "081234567803", email: "salman@sdiannajah.sch.id", role: "homeroom", assigned_class: "2A", is_evaluator: true, evaluator_pos: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-2b", name: "Ustadzah Maryam, M.Pd.", nip_niy: "NIY. 2019070104", gender: "P", phone: "081234567804", email: "maryam@sdiannajah.sch.id", role: "homeroom", assigned_class: "2B", is_evaluator: true, evaluator_pos: 4, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-3a", name: "Ustadzah Aisyah, S.Si.", nip_niy: "NIY. 2020070105", gender: "P", phone: "081234567805", email: "aisyah@sdiannajah.sch.id", role: "homeroom", assigned_class: "3A", is_evaluator: true, evaluator_pos: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-3b", name: "Ustadz Abdullah, S.Pd.", nip_niy: "NIY. 2020070106", gender: "L", phone: "081234567806", email: "abdullah@sdiannajah.sch.id", role: "homeroom", assigned_class: "3B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-4a", name: "Ustadz Ibrahim, M.Pd.", nip_niy: "NIY. 2021070107", gender: "L", phone: "081234567807", email: "ibrahim@sdiannajah.sch.id", role: "homeroom", assigned_class: "4A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-4b", name: "Ustadzah Hafsah, S.Pd.", nip_niy: "NIY. 2021070108", gender: "P", phone: "081234567808", email: "hafsah@sdiannajah.sch.id", role: "homeroom", assigned_class: "4B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-5a", name: "Ustadz Ali, S.T., S.Pd.", nip_niy: "NIY. 2022070109", gender: "L", phone: "081234567809", email: "ali@sdiannajah.sch.id", role: "homeroom", assigned_class: "5A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-5b", name: "Ustadzah Zainab, S.Pd.", nip_niy: "NIY. 2022070110", gender: "P", phone: "081234567810", email: "zainab@sdiannajah.sch.id", role: "homeroom", assigned_class: "5B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-6a", name: "Ustadz Umar, M.Pd.", nip_niy: "NIY. 2017070111", gender: "L", phone: "081234567811", email: "umar@sdiannajah.sch.id", role: "homeroom", assigned_class: "6A", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-6b", name: "Ustadzah Ruqayyah, S.Pd.", nip_niy: "NIY. 2017070112", gender: "P", phone: "081234567812", email: "ruqayyah@sdiannajah.sch.id", role: "homeroom", assigned_class: "6B", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Guru Mata Pelajaran
  { id: "tch-sub-1", name: "Ustadz Bilal Al-Habasyi, Lc.", nip_niy: "NIY. 2019080201", gender: "L", phone: "081234567821", email: "bilal@sdiannajah.sch.id", role: "subject", subject_specialty: "Pendidikan Agama Islam & Tahfizh", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-sub-2", name: "Ustadz Hamzah Prakoso, S.Pd.", nip_niy: "NIY. 2020080202", gender: "L", phone: "081234567822", email: "hamzah@sdiannajah.sch.id", role: "subject", subject_specialty: "PJOK & Kesehatan", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "tch-sub-3", name: "Ustadzah Sarah Amalia, B.Ed.", nip_niy: "NIY. 2021080203", gender: "P", phone: "081234567823", email: "sarah@sdiannajah.sch.id", role: "subject", subject_specialty: "Bahasa Inggris & Literasi Global", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Tim Manajemen
  { id: "tch-mgt-1", name: "Ustadz H. Ahmad Syaikhu, M.Pd.I.", nip_niy: "NIY. 19780512 200501 1 001", gender: "L", phone: "081234567899", email: "kepsek@sdiannajah.sch.id", role: "management", is_evaluator: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
