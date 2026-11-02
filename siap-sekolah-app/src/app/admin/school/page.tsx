"use client";
export const runtime = 'edge';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { SchoolProfile, TeacherStaff, TeacherRole } from "@/types";

export default function AdminSchoolPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "teachers">("profile");

  // School Profile State
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [profileForm, setProfileForm] = useState<Partial<SchoolProfile>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  // Teachers State
  const [teachers, setTeachers] = useState<TeacherStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal Add/Edit Teacher
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    nip_niy: "",
    gender: "L" as "L" | "P",
    phone: "",
    email: "",
    role: "homeroom" as TeacherRole,
    assigned_class: "1A",
    subject_specialty: "",
    is_evaluator: false,
    evaluator_pos: 1 as number | null,
    is_active: true,
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Load Data on Mount
  const loadSchoolData = async () => {
    try {
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        fetch("/api/school"),
        fetch("/api/teachers"),
      ]);

      if (pRes.ok) {
        const pJson = await pRes.json();
        setProfile(pJson.data);
        setProfileForm(pJson.data);
      }

      if (tRes.ok) {
        const tJson = await tRes.json();
        setTeachers(tJson.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data sekolah & guru:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolData();
  }, []);

  // Save School Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice("");
    try {
      const res = await fetch("/api/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setProfile(json.data);
        setProfileNotice("Identitas sekolah & kop surat resmi berhasil diperbarui!");
        setTimeout(() => setProfileNotice(""), 3500);
      } else {
        alert(json.error || "Gagal menyimpan identitas sekolah");
      }
    } catch {
      alert("Koneksi gagal saat menyimpan");
    } finally {
      setSavingProfile(false);
    }
  };

  // Open Teacher Modal for New
  const handleOpenAddTeacher = () => {
    setEditingTeacherId(null);
    setTeacherForm({
      name: "",
      nip_niy: "",
      gender: "L",
      phone: "",
      email: "",
      role: "homeroom",
      assigned_class: "1A",
      subject_specialty: "",
      is_evaluator: false,
      evaluator_pos: 1,
      is_active: true,
    });
    setShowTeacherModal(true);
  };

  // Open Teacher Modal for Edit
  const handleOpenEditTeacher = (t: TeacherStaff) => {
    setEditingTeacherId(t.id);
    setTeacherForm({
      name: t.name,
      nip_niy: t.nip_niy || "",
      gender: t.gender,
      phone: t.phone || "",
      email: t.email || "",
      role: t.role,
      assigned_class: t.assigned_class || "1A",
      subject_specialty: t.subject_specialty || "",
      is_evaluator: t.is_evaluator,
      evaluator_pos: t.evaluator_pos || 1,
      is_active: t.is_active,
    });
    setShowTeacherModal(true);
  };

  // Save Teacher (Add/Edit)
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name.trim()) return;

    setSavingTeacher(true);
    try {
      const isEdit = Boolean(editingTeacherId);
      const url = "/api/teachers";
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit ? { ...teacherForm, id: editingTeacherId } : teacherForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowTeacherModal(false);
        loadSchoolData();
      } else {
        const json = await res.json();
        alert(json.error || "Gagal menyimpan data guru");
      }
    } catch {
      alert("Koneksi gagal");
    } finally {
      setSavingTeacher(false);
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus ${name} dari daftar guru?`)) {
      try {
        const res = await fetch(`/api/teachers?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          loadSchoolData();
        }
      } catch {
        alert("Koneksi gagal");
      }
    }
  };

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.nip_niy?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.assigned_class?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.subject_specialty?.toLowerCase().includes(teacherSearch.toLowerCase());

    const matchRole =
      roleFilter === "all" ||
      (roleFilter === "homeroom" && t.role === "homeroom") ||
      (roleFilter === "subject" && t.role === "subject") ||
      (roleFilter === "evaluator" && t.is_evaluator) ||
      (roleFilter === "management" && t.role === "management");

    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#486B5A] hover:bg-[#F2F7F4] transition-colors shadow-2xs"
          >
            <i className="mdi mdi-arrow-left text-sm" />
            <span>Dashboard Admin SPMB</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]">
            <i className="mdi mdi-domain text-sm" />
            <span>IDENTITAS SEKOLAH &amp; GURU</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#22352B] tracking-tight">
              Identitas Sekolah &amp; Guru Pengampu
            </h1>
            <p className="text-xs sm:text-sm text-[#565C58] mt-1">
              Data terpusat untuk Kop Lembar Observasi A4, Rapor Siswa, dan Pengampu Rombel Kelas 1–6.
            </p>
          </div>

          {/* Quick Domain Badge */}
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-[#E8E2D8] text-xs shadow-2xs self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-[#4F936F] animate-pulse" />
            <span className="font-mono text-[#486B5A] font-bold">
              {profile?.website || "observasi.sdiannajah.ai.id"}
            </span>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-[#EFECE4] rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-white text-[#22352B] shadow-2xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            <i className="mdi mdi-card-account-details-outline text-base" />
            <span>1. Identitas Sekolah &amp; Kop Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teachers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === "teachers"
                ? "bg-white text-[#22352B] shadow-2xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            <i className="mdi mdi-account-group-outline text-base" />
            <span>2. Daftar Guru &amp; Penugasan ({teachers.length})</span>
          </button>
        </div>

        {/* ─── TAB 1: IDENTITAS SEKOLAH & PRATINJAU KOP ─── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#F6F3EC] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#22352B]">
                    Formulir Profil Lembaga
                  </h2>
                  <p className="text-xs text-[#565C58]">
                    Perubahan langsung terhubung ke seluruh dokumen cetak A4.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center">
                  <i className="mdi mdi-lead-pencil text-lg" />
                </div>
              </div>

              {profileNotice && (
                <div className="p-3 bg-[#E4EFE9] text-[#486B5A] text-xs font-bold rounded-2xl border border-[#CBE0D4] flex items-center gap-2 animate-in fade-in">
                  <i className="mdi mdi-check-circle text-base" />
                  <span>{profileNotice}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* 1. Nama Yayasan & Sekolah */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Nama Yayasan Penyelenggara *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.foundation_name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, foundation_name: e.target.value })}
                      placeholder="Contoh: Yayasan Pendidikan Islam An-Najah"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Nama Sekolah Resmi *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.school_name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, school_name: e.target.value })}
                      placeholder="Contoh: SDIT An-Najah"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>
                </div>

                {/* 2. NPSN & Tahun Ajaran */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      NPSN Sekolah
                    </label>
                    <input
                      type="text"
                      value={profileForm.npsn || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                      placeholder="Contoh: 20218492"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Tahun Ajaran Aktif *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.academic_year || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, academic_year: e.target.value })}
                      placeholder="2026/2027"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Semester Aktif
                    </label>
                    <select
                      value={profileForm.active_semester || "Ganjil"}
                      onChange={(e) => setProfileForm({ ...profileForm, active_semester: e.target.value as "Ganjil" | "Genap" })}
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    >
                      <option value="Ganjil">Semester 1 (Ganjil)</option>
                      <option value="Genap">Semester 2 (Genap)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Alamat Lengkap & Kota */}
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Alamat Jalan &amp; Gedung
                  </label>
                  <input
                    type="text"
                    value={profileForm.address || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Contoh: Jl. KH. Noer Ali No. 27, Jatisari"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={profileForm.subdistrict || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, subdistrict: e.target.value })}
                      placeholder="Jatiasih"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Kota / Kabupaten *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.city || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Kota Bekasi"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      value={profileForm.postal_code || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, postal_code: e.target.value })}
                      placeholder="17426"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>
                </div>

                {/* 4. Kontak & Domain */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Telepon Kantor
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="(021) 8499-XXXX"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      WhatsApp Resmi
                    </label>
                    <input
                      type="text"
                      value={profileForm.whatsapp || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      placeholder="0812-XXXX-XXXX"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Domain Aplikasi *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.website || "observasi.sdiannajah.ai.id"}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      placeholder="observasi.sdiannajah.ai.id"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-mono font-bold text-[#486B5A] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>
                </div>

                {/* 5. Kepala Sekolah & NIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      Nama Kepala Sekolah &amp; Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.principal_name || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, principal_name: e.target.value })}
                      placeholder="Ustadz H. Ahmad Syaikhu, M.Pd.I."
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#565C58] block mb-1">
                      NIP / NIY Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={profileForm.principal_nip || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, principal_nip: e.target.value })}
                      placeholder="NIY. 19780512 200501 1 001"
                      className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 px-4 rounded-2xl bg-[#486B5A] hover:bg-[#22352B] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className={`mdi ${savingProfile ? "mdi-loading mdi-spin" : "mdi-content-save-check-outline"} text-lg`} />
                    <span>{savingProfile ? "Menyimpan Data..." : "Simpan Identitas & Kop Surat Resmi"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#F6F3EC]">
                  <span className="text-xs font-black uppercase tracking-wider text-[#787F7A]">
                    Pratinjau Kop Surat Resmi A4
                  </span>
                  <span className="text-[10px] font-bold text-[#486B5A] bg-[#E4EFE9] px-2 py-0.5 rounded-md">
                    Live Preview
                  </span>
                </div>

                {/* Simulated White Paper Sheet with Header */}
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] shadow-inner space-y-3 font-sans">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-[#486B5A]">
                    <div className="w-12 h-12 rounded-2xl bg-[#D67443] text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-xs">
                      <i className="mdi mdi-leaf" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A] truncate">
                        {profileForm.foundation_name || "Yayasan Pendidikan Islam An-Najah"}
                      </p>
                      <h3 className="text-base font-black text-[#22352B] tracking-tight leading-snug truncate">
                        {profileForm.school_name || "SDIT An-Najah"}
                      </h3>
                      <p className="text-[10px] text-[#565C58] truncate">
                        {profileForm.address ? `${profileForm.address}, ${profileForm.city}` : "Alamat Sekolah"} &bull; NPSN: {profileForm.npsn || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-[#E8E2D8] text-[11px] space-y-1.5 text-[#565C58]">
                    <div className="flex justify-between">
                      <span className="font-semibold">Tahun Ajaran:</span>
                      <span className="font-bold text-[#22352B]">{profileForm.academic_year || "2026/2027"} ({profileForm.active_semester || "Ganjil"})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Domain Akses:</span>
                      <span className="font-mono text-[#486B5A] font-bold">{profileForm.website || "observasi.sdiannajah.ai.id"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Kepala Sekolah:</span>
                      <span className="font-bold text-[#22352B]">{profileForm.principal_name || "Ustadz H. Ahmad Syaikhu, M.Pd.I."}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#787F7A] leading-relaxed">
                  Kop di atas digunakan otomatis pada:
                  <br />• <strong>Lembar Observasi Lapangan Cetak A4</strong> (<Link href="/reports/rubric" className="text-[#486B5A] underline font-bold">/reports/rubric</Link>)
                  <br />• <strong>Rekapitulasi Batch SPMB A4</strong>
                  <br />• <strong>Laporan Profil &amp; Rapor Diferensiasi Siswa</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DAFTAR GURU & PENUGASAN ─── */}
        {activeTab === "teachers" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search & Role Filter */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                <div className="relative flex-1 min-w-[200px]">
                  <i className="mdi mdi-magnify absolute left-3 top-2.5 text-lg text-[#787F7A]" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Cari nama guru, NIP, rombel..."
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="py-2 px-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none"
                >
                  <option value="all">Semua Peran</option>
                  <option value="homeroom">Wali Kelas (1A–6B)</option>
                  <option value="subject">Guru Mata Pelajaran</option>
                  <option value="evaluator">Evaluator Pos SPMB</option>
                  <option value="management">Kepala Sekolah / Manajemen</option>
                </select>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleOpenAddTeacher}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#486B5A] px-4 py-2.5 rounded-2xl shadow-xs hover:bg-[#22352B] active:scale-95 transition-all cursor-pointer self-start md:self-center"
              >
                <i className="mdi mdi-account-plus-outline text-base" />
                <span>+ Tambah Guru Baru</span>
              </button>
            </div>

            {/* Teachers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTeachers.map((t) => {
                const isHomeroom = t.role === "homeroom";
                const isSubject = t.role === "subject";
                const isMgmt = t.role === "management";

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-2xs space-y-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                              t.gender === "P" ? "bg-[#B85627]" : "bg-[#486B5A]"
                            }`}
                          >
                            {t.name.split(" ")[1]?.charAt(0) || t.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[#22352B] leading-snug">
                              {t.name}
                            </h3>
                            <p className="text-[11px] font-mono text-[#787F7A]">
                              {t.nip_niy || "-"}
                            </p>
                          </div>
                        </div>

                        {/* Status Active Badge */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            t.is_active ? "bg-[#4F936F]" : "bg-[#A8A09A]"
                          }`}
                          title={t.is_active ? "Aktif" : "Non-aktif"}
                        />
                      </div>

                      {/* Role & Assignment Pill */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {isHomeroom && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]">
                            Wali Kelas {t.assigned_class || "-"}
                          </span>
                        )}
                        {isSubject && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#E4EAF2] text-[#36506C] border border-[#C6D5E5]">
                            Mapel: {t.subject_specialty || "Mata Pelajaran"}
                          </span>
                        )}
                        {isMgmt && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EFE7D6] text-[#7D5327] border border-[#E0D2BA]">
                            Kepala Sekolah / Tim Manajemen
                          </span>
                        )}
                        {t.is_evaluator && (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#F9E6DC] text-[#B85627] border border-[#F1CFC0]">
                            Evaluator Pos {t.evaluator_pos || 1}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer with Contact & Actions */}
                    <div className="pt-2.5 border-t border-[#F6F3EC] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#565C58]">
                        <i className="mdi mdi-whatsapp text-sm text-[#4F936F]" />
                        <span className="text-[11px] font-semibold">{t.phone || "-"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTeacher(t)}
                          className="w-7 h-7 rounded-lg bg-[#FAF8F5] text-[#22352B] hover:bg-[#EFECE4] flex items-center justify-center transition"
                          title="Edit Data Guru"
                        >
                          <i className="mdi mdi-pencil-outline text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacher(t.id, t.name)}
                          className="w-7 h-7 rounded-lg bg-[#FAF8F5] text-[#B85627] hover:bg-[#F9E6DC] flex items-center justify-center transition"
                          title="Hapus Guru"
                        >
                          <i className="mdi mdi-trash-can-outline text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTeachers.length === 0 && !loading && (
              <div className="bg-white rounded-3xl p-12 text-center text-[#787F7A] space-y-2">
                <i className="mdi mdi-account-search-outline text-4xl text-[#CBE0D4]" />
                <p className="text-xs">Tidak ditemukan guru dengan filter tersebut.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL ADD / EDIT TEACHER ─── */}
      {showTeacherModal && (
        <div
          className="fixed inset-0 z-50 bg-[#22352B]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowTeacherModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E2D8] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
              <h3 className="text-base font-black text-[#22352B]">
                {editingTeacherId ? "Edit Biodata & Penugasan Guru" : "Tambah Guru Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EAF2]"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="Contoh: Ustadzah Fatimah, S.Pd."
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    NIP / NIY Guru
                  </label>
                  <input
                    type="text"
                    value={teacherForm.nip_niy}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nip_niy: e.target.value })}
                    placeholder="NIY. 2021070101"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={teacherForm.gender}
                    onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value as "L" | "P" })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    <option value="L">Laki-laki (Ustadz)</option>
                    <option value="P">Perempuan (Ustadzah)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0812XXXXXXXX"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="guru@sdiannajah.sch.id"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Peran Utama *
                </label>
                <select
                  value={teacherForm.role}
                  onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value as TeacherRole })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                >
                  <option value="homeroom">Wali Kelas (Homeroom Teacher)</option>
                  <option value="subject">Guru Mata Pelajaran</option>
                  <option value="management">Kepala Sekolah / Manajemen</option>
                </select>
              </div>

              {/* Conditional: Homeroom Assignment */}
              {teacherForm.role === "homeroom" && (
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Penugasan Rombel Kelas (Otomatis Terhubung ke Workspace)
                  </label>
                  <select
                    value={teacherForm.assigned_class || "1A"}
                    onChange={(e) => setTeacherForm({ ...teacherForm, assigned_class: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#486B5A] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    {["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B"].map((cId) => (
                      <option key={cId} value={cId}>
                        Kelas {cId}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional: Subject Specialty */}
              {teacherForm.role === "subject" && (
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Spesialisasi Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={teacherForm.subject_specialty}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject_specialty: e.target.value })}
                    placeholder="Contoh: Pendidikan Agama Islam & Tahfizh"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>
              )}

              {/* Evaluator SPMB Option */}
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_evaluator_chk"
                      checked={teacherForm.is_evaluator}
                      onChange={(e) => setTeacherForm({ ...teacherForm, is_evaluator: e.target.checked })}
                      className="w-4 h-4 text-[#486B5A] rounded focus:ring-[#486B5A]"
                    />
                    <label htmlFor="is_evaluator_chk" className="text-xs font-bold text-[#22352B] cursor-pointer">
                      Ditugaskan sebagai Evaluator Observasi SPMB
                    </label>
                  </div>
                </div>

                {teacherForm.is_evaluator && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[#565C58] font-bold">Pilih Pos Observasi:</span>
                    <select
                      value={teacherForm.evaluator_pos || 1}
                      onChange={(e) => setTeacherForm({ ...teacherForm, evaluator_pos: Number(e.target.value) })}
                      className="p-1.5 rounded-xl bg-white border border-[#E8E2D8] text-xs font-bold text-[#B85627]"
                    >
                      <option value={1}>Pos 1: Kedatangan &amp; Emosi</option>
                      <option value={2}>Pos 2: Motorik Kasar &amp; Fisik</option>
                      <option value={3}>Pos 3: Kognitif &amp; Numerasi</option>
                      <option value={4}>Pos 4: Literasi &amp; Motorik Halus</option>
                      <option value={5}>Pos 5: Interaksi Sosial Kelompok</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EFECE4] text-xs font-bold text-[#565C58]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTeacher}
                  className="px-5 py-2 rounded-2xl bg-[#486B5A] text-xs font-bold text-white hover:bg-[#22352B] disabled:opacity-50"
                >
                  {savingTeacher ? "Menyimpan..." : "Simpan Data Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
