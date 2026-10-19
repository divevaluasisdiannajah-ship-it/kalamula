"use client";
export const runtime = "edge";

import React, { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  DEEP_LEARNING_DIMENSIONS,
  type DeepLearningDimensionId,
  type ClassroomStudent,
  type ClassroomObjective,
  type ClassroomAssessment,
  type Classroom,
} from "@/types";

interface PageProps {
  params: Promise<{ classId: string }>;
}

type TabType = "dashboard" | "students" | "rubrics" | "observations" | "reports";

export default function ClassroomWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const classId = (resolvedParams.classId || "1A").toUpperCase();

  // Classroom & State
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [objectives, setObjectives] = useState<ClassroomObjective[]>([]);
  const [assessments, setAssessments] = useState<ClassroomAssessment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);

  // Student Search & Filter
  const [studentSearch, setStudentSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    nisn: "",
    full_name: "",
    nickname: "",
    gender: "L" as "L" | "P",
    learning_group: "Kelompok Reguler",
    notes: "",
  });

  // Excel Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelPreview, setExcelPreview] = useState<Array<{
    nisn: string;
    full_name: string;
    nickname: string;
    gender: "L" | "P";
    learning_group: string;
    notes: string;
  }>>([]);
  const [importing, setImporting] = useState(false);

  // Add TP (Objective) Modal State
  const [showAddTPModal, setShowAddTPModal] = useState(false);
  const [newTPForm, setNewTPForm] = useState({
    subject: "Bahasa Indonesia",
    tp_code: "",
    tp_title: "",
    tp_description: "",
    dimension_id: "communication" as DeepLearningDimensionId,
    target_term: "Semester 1",
  });

  // Observation Form State
  const [selectedStudentForObs, setSelectedStudentForObs] = useState<string>("");
  const [selectedTPForObs, setSelectedTPForObs] = useState<string>("");
  const [obsScoreLevel, setObsScoreLevel] = useState<1 | 2 | 3 | 4>(3);
  const [obsAnecdotal, setObsAnecdotal] = useState("");
  const [savingObs, setSavingObs] = useState(false);
  const [obsSuccessNotice, setObsSuccessNotice] = useState(false);

  // Student Report State
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>("");

  // Load All Classroom Data
  const loadClassroomData = async () => {
    setLoading(true);
    try {
      // 1. Classroom details
      const cRes = await fetch(`/api/classrooms/${classId}`);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setClassroom(cJson.data);
      }

      // 2. Students
      const sRes = await fetch(`/api/classrooms/${classId}/students`);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setStudents(sJson.data || []);
        if (sJson.data && sJson.data.length > 0 && !selectedStudentForReport) {
          setSelectedStudentForReport(sJson.data[0].id);
          setSelectedStudentForObs(sJson.data[0].id);
        }
      }

      // 3. Objectives (TP)
      const oRes = await fetch(`/api/classrooms/${classId}/rubrics`);
      if (oRes.ok) {
        const oJson = await oRes.json();
        setObjectives(oJson.data || []);
        if (oJson.data && oJson.data.length > 0 && !selectedTPForObs) {
          setSelectedTPForObs(oJson.data[0].id);
        }
      }

      // 4. Assessments
      const aRes = await fetch(`/api/classrooms/${classId}/assessments`);
      if (aRes.ok) {
        const aJson = await aRes.json();
        setAssessments(aJson.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil data kelas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassroomData();
  }, [classId]);

  // Determine Fase based on Grade
  const gradeNum = parseInt(classId.charAt(0), 10) || 1;
  const faseLabel = gradeNum <= 2 ? "Fase A (Kelas 1–2)" : gradeNum <= 4 ? "Fase B (Kelas 3–4)" : "Fase C (Kelas 5–6)";

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.nickname.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.nisn.includes(studentSearch);
      const matchGroup = groupFilter === "all" || s.learning_group === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [students, studentSearch, groupFilter]);

  // Differentiation Groups
  const groupIntervensi = useMemo(
    () => students.filter((s) => s.learning_group?.toLowerCase().includes("intervensi")),
    [students]
  );
  const groupReguler = useMemo(
    () =>
      students.filter(
        (s) =>
          !s.learning_group?.toLowerCase().includes("intervensi") &&
          !s.learning_group?.toLowerCase().includes("pengayaan")
      ),
    [students]
  );
  const groupPengayaan = useMemo(
    () => students.filter((s) => s.learning_group?.toLowerCase().includes("pengayaan")),
    [students]
  );

  // Dimension Scores aggregate across class
  const dimensionStats = useMemo(() => {
    const counts: Record<DeepLearningDimensionId, { total: number; count: number }> = {
      faith: { total: 0, count: 0 },
      citizenship: { total: 0, count: 0 },
      critical: { total: 0, count: 0 },
      creativity: { total: 0, count: 0 },
      collaboration: { total: 0, count: 0 },
      independence: { total: 0, count: 0 },
      health: { total: 0, count: 0 },
      communication: { total: 0, count: 0 },
    };

    assessments.forEach((ass) => {
      const obj = objectives.find((o) => o.id === ass.objective_id);
      if (obj && obj.dimension_id && counts[obj.dimension_id]) {
        counts[obj.dimension_id].total += ass.score_level;
        counts[obj.dimension_id].count += 1;
      }
    });

    return Object.entries(DEEP_LEARNING_DIMENSIONS).map(([key, info]) => {
      const dimKey = key as DeepLearningDimensionId;
      const data = counts[dimKey];
      const avg = data.count > 0 ? (data.total / data.count).toFixed(1) : "-";
      return {
        ...info,
        average: avg,
        observedCount: data.count,
      };
    });
  }, [assessments, objectives]);

  // Handle Add Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.full_name) return;

    try {
      const res = await fetch(`/api/classrooms/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudentForm),
      });
      if (res.ok) {
        setShowAddStudentModal(false);
        setNewStudentForm({
          nisn: "",
          full_name: "",
          nickname: "",
          gender: "L",
          learning_group: "Kelompok Reguler",
          notes: "",
        });
        loadClassroomData();
      }
    } catch (err) {
      console.error("Gagal menambah siswa:", err);
    }
  };

  // Handle Excel Upload Parsing
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const parsed = rawRows.map((row) => ({
        nisn: String(row["NISN"] || row["nisn"] || `013${Math.floor(1000000 + Math.random() * 9000000)}`),
        full_name: String(row["Nama_Lengkap"] || row["Nama Lengkap"] || row["nama"] || "Siswa Baru"),
        nickname: String(row["Nama_Panggilan"] || row["Nama Panggilan"] || row["panggilan"] || ""),
        gender: (String(row["Jenis_Kelamin"] || row["JK"] || "L").toUpperCase().startsWith("P") ? "P" : "L") as "L" | "P",
        learning_group: String(row["Kelompok_Diferensiasi"] || row["Kelompok"] || "Kelompok Reguler"),
        notes: String(row["Catatan_Khusus"] || row["Catatan"] || ""),
      }));

      setExcelPreview(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit Excel Import
  const handleCommitExcelImport = async () => {
    if (excelPreview.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/classrooms/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: excelPreview }),
      });
      if (res.ok) {
        setShowImportModal(false);
        setExcelPreview([]);
        loadClassroomData();
      }
    } catch (err) {
      console.error("Gagal mengimpor siswa:", err);
    } finally {
      setImporting(false);
    }
  };

  // Handle Save Learning Objective (TP)
  const handleSaveTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTPForm.tp_title) return;

    try {
      const res = await fetch(`/api/classrooms/${classId}/rubrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTPForm),
      });
      if (res.ok) {
        setShowAddTPModal(false);
        setNewTPForm({
          subject: "Bahasa Indonesia",
          tp_code: "",
          tp_title: "",
          tp_description: "",
          dimension_id: "communication",
          target_term: "Semester 1",
        });
        loadClassroomData();
      }
    } catch (err) {
      console.error("Gagal menambah TP:", err);
    }
  };

  // Handle Save Observation
  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForObs || !selectedTPForObs) return;

    setSavingObs(true);
    try {
      const res = await fetch(`/api/classrooms/${classId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudentForObs,
          objective_id: selectedTPForObs,
          score_level: obsScoreLevel,
          anecdotal_note: obsAnecdotal,
        }),
      });

      if (res.ok) {
        setObsSuccessNotice(true);
        setObsAnecdotal("");
        setTimeout(() => setObsSuccessNotice(false), 3000);
        loadClassroomData();
      }
    } catch (err) {
      console.error("Gagal menyimpan observasi:", err);
    } finally {
      setSavingObs(false);
    }
  };

  // Selected Student for Report Data
  const studentForReport = students.find((s) => s.id === selectedStudentForReport);
  const studentAssessments = useMemo(() => {
    return assessments.filter((a) => a.student_id === selectedStudentForReport);
  }, [assessments, selectedStudentForReport]);

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Identity */}
        <header className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/classroom/select"
              className="w-11 h-11 rounded-2xl bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EFE9] active:scale-95 transition-all flex-shrink-0"
              title="Ganti Ruang Kelas"
            >
              <i className="mdi mdi-arrow-left text-xl" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight">
                  Asesmen Diferensiasi Kelas {classId}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]">
                  {faseLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FAF8F5] text-[#7D5327] border border-[#EFE7D6]">
                  T.A. {classroom?.academic_year || "2026/2027"}
                </span>
              </div>
              <p className="text-xs text-[#565C58] mt-1 flex items-center gap-2">
                <i className="mdi mdi-account-tie-outline text-sm text-[#486B5A]" />
                <span>Pengampu: <strong>{classroom?.teacher_name || "Guru Kelas"}</strong></span>
                <span>&bull;</span>
                <span>Standar: <strong>8 Dimensi Profil Deep Learning</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="inline-flex items-center gap-2 bg-[#F2F7F4] border border-[#CBE0D4] px-3.5 py-2 rounded-2xl text-xs font-bold text-[#486B5A]">
              <i className="mdi mdi-account-group text-base" />
              <span>{students.length} Siswa Terdaftar</span>
            </div>
          </div>
        </header>

        {/* 5 Main Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "dashboard", label: "Dashboard Diferensiasi", icon: "mdi-view-dashboard-outline" },
            { id: "students", label: "Data Siswa", icon: "mdi-account-multiple-outline", count: students.length },
            { id: "rubrics", label: "Rubrik & Tujuan Pembelajaran", icon: "mdi-book-check-outline", count: objectives.length },
            { id: "observations", label: "Observasi Kualitatif", icon: "mdi-clipboard-edit-outline" },
            { id: "reports", label: "Laporan Siswa & TaRL", icon: "mdi-file-document-outline" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#486B5A] text-white shadow-md scale-102"
                    : "bg-white text-[#565C58] hover:bg-[#EFECE4] border border-[#E8E2D8]"
                }`}
              >
                <i className={`mdi ${tab.icon} text-base`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#EFECE4] text-[#22352B]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ─── TAB 1: DASHBOARD DIFERENSIASI ─── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 3 Teaching at the Right Level (TaRL) Differentiation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Intervensi Khusus */}
              <div className="bg-[#FDF7F4] rounded-3xl p-5 border border-[#F1CFC0] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center text-xl">
                    <i className="mdi mdi-hand-heart-outline" />
                  </div>
                  <span className="text-xl font-black text-[#B85627]">
                    {groupIntervensi.length} Siswa
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#22352B]">
                    Kelompok Intervensi Khusus
                  </h3>
                  <p className="text-xs text-[#565C58] mt-1 leading-relaxed">
                    Peserta didik yang membutuhkan scaffolding konkret dan bimbingan intensif pada fondasi prasyarat.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#F1CFC0]/60 space-y-1">
                  {groupIntervensi.slice(0, 3).map((st) => (
                    <div key={st.id} className="text-xs font-semibold text-[#8C3713] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B85627]" />
                      <span>{st.full_name}</span>
                    </div>
                  ))}
                  {groupIntervensi.length === 0 && (
                    <p className="text-xs text-[#787F7A] italic">Belum ada siswa di kelompok ini.</p>
                  )}
                </div>
              </div>

              {/* Card 2: Reguler (Berkembang Sesuai Harapan) */}
              <div className="bg-white rounded-3xl p-5 border border-[#CBE0D4] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center text-xl">
                    <i className="mdi mdi-checkbox-marked-circle-outline" />
                  </div>
                  <span className="text-xl font-black text-[#486B5A]">
                    {groupReguler.length} Siswa
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#22352B]">
                    Kelompok Berkembang Sesuai Harapan
                  </h3>
                  <p className="text-xs text-[#565C58] mt-1 leading-relaxed">
                    Peserta didik yang telah menguasai kompetensi dasar dan belajar aktif melalui panduan bertahap guru.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#CBE0D4]/60 space-y-1">
                  {groupReguler.slice(0, 3).map((st) => (
                    <div key={st.id} className="text-xs font-semibold text-[#22352B] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#486B5A]" />
                      <span>{st.full_name}</span>
                    </div>
                  ))}
                  {groupReguler.length === 0 && (
                    <p className="text-xs text-[#787F7A] italic">Belum ada siswa di kelompok ini.</p>
                  )}
                </div>
              </div>

              {/* Card 3: Pengayaan (Mahir) */}
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EFE7D6] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center text-xl">
                    <i className="mdi mdi-trophy-variant-outline" />
                  </div>
                  <span className="text-xl font-black text-[#7D5327]">
                    {groupPengayaan.length} Siswa
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#22352B]">
                    Kelompok Pengayaan (Mahir)
                  </h3>
                  <p className="text-xs text-[#565C58] mt-1 leading-relaxed">
                    Peserta didik dengan kemandirian tinggi, siap menerima tantangan eksplorasi dan pemecahan masalah kompleks.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EFE7D6]/60 space-y-1">
                  {groupPengayaan.slice(0, 3).map((st) => (
                    <div key={st.id} className="text-xs font-semibold text-[#7D5327] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7D5327]" />
                      <span>{st.full_name}</span>
                    </div>
                  ))}
                  {groupPengayaan.length === 0 && (
                    <p className="text-xs text-[#787F7A] italic">Belum ada siswa di kelompok ini.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 8 Dimensi Profil Lulusan Pembelajaran Mendalam (Deep Learning) Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F6F3EC]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center text-xl">
                    <i className="mdi mdi-brain" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#22352B]">
                      Pemetaan 8 Dimensi Profil Lulusan (Deep Learning)
                    </h2>
                    <p className="text-xs text-[#565C58]">
                      Rata-rata observasi kualitatif peserta didik di Kelas {classId} (Skala 1 s.d. 4)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#787F7A]">
                  <span>Skala: 1 (BM) &bull; 2 (MB) &bull; 3 (BSH) &bull; 4 (SB)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {dimensionStats.map((dim) => (
                  <div
                    key={dim.id}
                    className="p-4 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F5] space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl ${dim.badgeBg} ${dim.badgeText} flex items-center justify-center text-lg`}>
                        <i className={`mdi ${dim.mdiIcon}`} />
                      </div>
                      <span className="text-sm font-black text-[#22352B] bg-white px-2 py-0.5 rounded-lg border border-[#E8E2D8]">
                        {dim.average !== "-" ? `${dim.average} / 4.0` : "Belum dinilai"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-black text-[#22352B]">
                        {dim.number}. {dim.name}
                      </p>
                      <p className="text-[11px] text-[#565C58] leading-snug line-clamp-2 mt-0.5">
                        {dim.focus}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-[#E8E2D8]/50 flex items-center justify-between text-[10px] text-[#787F7A]">
                      <span>{dim.observedCount} Catatan Observasi</span>
                      <span className="font-semibold text-[#486B5A]">{dim.english}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DATA SISWA ─── */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                <div className="relative flex-1 min-w-[200px]">
                  <i className="mdi mdi-magnify absolute left-3 top-2.5 text-lg text-[#787F7A]" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama siswa atau NISN..."
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="py-2 px-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none"
                >
                  <option value="all">Semua Kelompok</option>
                  <option value="Kelompok Intervensi">Intervensi Khusus</option>
                  <option value="Kelompok Reguler">Reguler</option>
                  <option value="Kelompok Pengayaan">Pengayaan</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/classrooms/${classId}/students/template`}
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#486B5A] bg-[#E4EFE9] px-3.5 py-2 rounded-2xl border border-[#CBE0D4] hover:bg-[#D5E6DC] active:scale-95 transition-all cursor-pointer"
                >
                  <i className="mdi mdi-download text-base" />
                  <span>Unduh Template Excel</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#36506C] bg-[#E4EAF2] px-3.5 py-2 rounded-2xl border border-[#C6D5E5] hover:bg-[#D4E1F0] active:scale-95 transition-all cursor-pointer"
                >
                  <i className="mdi mdi-file-excel-outline text-base" />
                  <span>Impor Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#486B5A] px-4 py-2 rounded-2xl shadow-xs hover:bg-[#22352B] active:scale-95 transition-all cursor-pointer"
                >
                  <i className="mdi mdi-plus text-base" />
                  <span>Tambah Siswa</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[#565C58] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">L/P</th>
                      <th className="py-3 px-4">Kelompok Diferensiasi</th>
                      <th className="py-3 px-4">Catatan Pengamatan Guru</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F3EC]">
                    {filteredStudents.map((st, idx) => {
                      const isIntervensi = st.learning_group?.toLowerCase().includes("intervensi");
                      const isPengayaan = st.learning_group?.toLowerCase().includes("pengayaan");

                      return (
                        <tr key={st.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#787F7A]">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#565C58]">{st.nisn}</td>
                          <td className="py-3 px-4">
                            <p className="font-black text-[#22352B]">{st.full_name}</p>
                            <p className="text-[11px] text-[#787F7A]">Panggilan: {st.nickname}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                st.gender === "L"
                                  ? "bg-[#E4EAF2] text-[#36506C]"
                                  : "bg-[#F9E6DC] text-[#B85627]"
                              }`}
                            >
                              {st.gender}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                isIntervensi
                                  ? "bg-[#F9E6DC] text-[#B85627] border border-[#F1CFC0]"
                                  : isPengayaan
                                  ? "bg-[#EFE7D6] text-[#7D5327] border border-[#E0D2BA]"
                                  : "bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]"
                              }`}
                            >
                              {st.learning_group || "Kelompok Reguler"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#565C58] max-w-xs truncate">
                            {st.notes || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForReport(st.id);
                                setActiveTab("reports");
                              }}
                              className="text-xs font-bold text-[#486B5A] hover:underline cursor-pointer"
                            >
                              Lihat Rapor TaRL
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#787F7A]">
                          Tidak ada siswa yang sesuai pencarian atau filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: RUBRIK ASESMEN (TUJUAN PEMBELAJARAN) ─── */}
        {activeTab === "rubrics" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#22352B]">
                  Daftar Tujuan Pembelajaran &amp; Indikator Kelas {classId}
                </h2>
                <p className="text-xs text-[#565C58]">
                  Setiap TP ditautkan ke salah satu dari 8 Dimensi Profil Deep Learning untuk asesmen kualitatif.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTPModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#486B5A] px-4 py-2.5 rounded-2xl shadow-xs hover:bg-[#22352B] active:scale-95 transition-all cursor-pointer self-start sm:self-center"
              >
                <i className="mdi mdi-plus text-base" />
                <span>+ Tambah Tujuan Pembelajaran (TP)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectives.map((tp) => {
                const dim = DEEP_LEARNING_DIMENSIONS[tp.dimension_id] || DEEP_LEARNING_DIMENSIONS.critical;
                return (
                  <div
                    key={tp.id}
                    className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-[#EFECE4] text-[#22352B]">
                          {tp.tp_code}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${dim.badgeBg} ${dim.badgeText}`}>
                          <i className={`mdi ${dim.mdiIcon}`} />
                          <span>{dim.name}</span>
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-[#22352B] leading-snug">
                        {tp.tp_title}
                      </h3>
                      <p className="text-xs text-[#565C58] leading-relaxed">
                        {tp.tp_description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F6F3EC] flex items-center justify-between text-[11px] text-[#787F7A] font-semibold">
                      <span>Mata Pelajaran: <strong>{tp.subject}</strong></span>
                      <span>{tp.target_term || "Semester 1"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 4: OBSERVASI KUALITATIF GURU ─── */}
        {activeTab === "observations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Observation Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#F6F3EC]">
                <h2 className="text-base font-black text-[#22352B]">
                  Formulir Observasi Lapangan Guru
                </h2>
                <p className="text-xs text-[#565C58]">
                  Catat kemunculan indikator &amp; anekdot langsung dari proses belajar.
                </p>
              </div>

              {obsSuccessNotice && (
                <div className="p-3 bg-[#E4EFE9] text-[#486B5A] text-xs font-bold rounded-2xl border border-[#CBE0D4] flex items-center gap-2">
                  <i className="mdi mdi-check-circle text-base" />
                  <span>Observasi kualitatif berhasil disimpan!</span>
                </div>
              )}

              <form onSubmit={handleSaveObservation} className="space-y-4">
                {/* 1. Pilih Siswa */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-[#787F7A]">
                    1. Pilih Peserta Didik
                  </label>
                  <select
                    value={selectedStudentForObs}
                    onChange={(e) => setSelectedStudentForObs(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} ({st.nickname}) — {st.learning_group}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilih Tujuan Pembelajaran (TP) */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-[#787F7A]">
                    2. Tujuan Pembelajaran (Indikator)
                  </label>
                  <select
                    value={selectedTPForObs}
                    onChange={(e) => setSelectedTPForObs(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    {objectives.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        [{tp.tp_code}] {tp.tp_title} ({tp.subject})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Skala Capaian Kualitatif (1-4) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-[#787F7A] block">
                    3. Capaian Kualitatif (Skala 1 - 4)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { level: 1, label: "BM", desc: "Perlu Bimbingan" },
                      { level: 2, label: "MB", desc: "Cukup / Mulai" },
                      { level: 3, label: "BSH", desc: "Berkembang Baik" },
                      { level: 4, label: "SB", desc: "Sangat Mahir" },
                    ].map((item) => {
                      const isSel = obsScoreLevel === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setObsScoreLevel(item.level as 1 | 2 | 3 | 4)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#486B5A] text-white border-[#486B5A] shadow-xs"
                              : "bg-[#FAF8F5] text-[#22352B] border-[#E8E2D8] hover:bg-white"
                          }`}
                        >
                          <span className="block font-black text-sm">{item.level}</span>
                          <span className="block text-[10px] font-bold mt-0.5 truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Catatan Anekdot Lapangan */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-[#787F7A]">
                    4. Catatan Anekdot Observasi (Fakta Lapangan)
                  </label>
                  <textarea
                    rows={3}
                    value={obsAnecdotal}
                    onChange={(e) => setObsAnecdotal(e.target.value)}
                    placeholder="Contoh: Ananda mampu menjelaskan cara menyelesaikan soal tanpa ragu dan bersedia membantu temannya..."
                    className="w-full p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingObs}
                  className="w-full py-3 rounded-2xl bg-[#486B5A] hover:bg-[#22352B] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  {savingObs ? "Menyimpan..." : "Simpan Catatan Observasi"}
                </button>
              </form>
            </div>

            {/* Right: Feed of Recent Observations */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
                <h2 className="text-base font-black text-[#22352B]">
                  Jurnal Observasi Terkini ({assessments.length} Catatan)
                </h2>
                <span className="text-xs text-[#787F7A]">Terupdate otomatis</span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {assessments.slice().reverse().map((ass) => {
                  const student = students.find((s) => s.id === ass.student_id);
                  const obj = objectives.find((o) => o.id === ass.objective_id);
                  const dim = obj ? DEEP_LEARNING_DIMENSIONS[obj.dimension_id] : null;

                  return (
                    <div
                      key={ass.id}
                      className="p-4 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F5] space-y-2 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#22352B]">
                            {student?.full_name || "Siswa"}
                          </span>
                          <span className="text-[10px] text-[#787F7A]">
                            ({student?.nickname})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-[#486B5A] text-white">
                            Skor {ass.score_level} / 4
                          </span>
                          {dim && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dim.badgeBg} ${dim.badgeText}`}>
                              {dim.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-bold text-[#486B5A]">
                        {obj?.tp_code}: {obj?.tp_title}
                      </p>

                      {ass.anecdotal_note && (
                        <p className="text-xs text-[#565C58] italic bg-white p-2.5 rounded-xl border border-[#E8E2D8]/60">
                          &ldquo;{ass.anecdotal_note}&rdquo;
                        </p>
                      )}

                      <p className="text-[10px] text-[#787F7A] text-right">
                        Dicatat pada: {new Date(ass.assessed_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </p>
                    </div>
                  );
                })}

                {assessments.length === 0 && (
                  <div className="py-12 text-center text-[#787F7A] space-y-2">
                    <i className="mdi mdi-clipboard-text-outline text-4xl text-[#CBE0D4]" />
                    <p className="text-xs">Belum ada observasi yang dicatat untuk kelas ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: LAPORAN SISWA & TaRL ─── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Student Picker Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-black uppercase text-[#787F7A]">
                  Pilih Peserta Didik:
                </label>
                <select
                  value={selectedStudentForReport}
                  onChange={(e) => setSelectedStudentForReport(e.target.value)}
                  className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name} ({st.learning_group})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#B85627] px-4 py-2 rounded-2xl shadow-xs hover:bg-[#8C3713] active:scale-95 transition-all cursor-pointer self-start sm:self-center"
              >
                <i className="mdi mdi-printer-outline text-base" />
                <span>Cetak Lembar Diferensiasi A4</span>
              </button>
            </div>

            {studentForReport ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-sm space-y-6">
                {/* Student Identity Banner */}
                <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#486B5A] text-white flex items-center justify-center text-2xl font-black">
                      {studentForReport.nickname.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#22352B]">
                        {studentForReport.full_name}
                      </h2>
                      <p className="text-xs text-[#565C58]">
                        NISN: <span className="font-mono font-semibold">{studentForReport.nisn}</span> &bull; Gender: {studentForReport.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#787F7A] block">
                      Rekomendasi Penempatan TaRL:
                    </span>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]">
                      {studentForReport.learning_group || "Kelompok Reguler"}
                    </span>
                  </div>
                </div>

                {/* 8 Deep Learning Dimensions Breakdown for this Student */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-[#22352B] uppercase tracking-wider">
                    Capaian 8 Dimensi Profil Lulusan (Deep Learning)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(DEEP_LEARNING_DIMENSIONS).map(([key, dim]) => {
                      // Filter assessments for this student and dimension
                      const dimAssessments = studentAssessments.filter((ass) => {
                        const obj = objectives.find((o) => o.id === ass.objective_id);
                        return obj?.dimension_id === key;
                      });

                      const avg =
                        dimAssessments.length > 0
                          ? (
                              dimAssessments.reduce((acc, curr) => acc + curr.score_level, 0) /
                              dimAssessments.length
                            ).toFixed(1)
                          : null;

                      return (
                        <div
                          key={key}
                          className="p-3.5 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F5] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`w-7 h-7 rounded-lg ${dim.badgeBg} ${dim.badgeText} flex items-center justify-center text-sm`}>
                              <i className={`mdi ${dim.mdiIcon}`} />
                            </span>
                            <span className="text-xs font-black text-[#22352B]">
                              {avg ? `${avg} / 4.0` : "-"}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#22352B] truncate">{dim.name}</p>
                            <p className="text-[10px] text-[#787F7A]">{dimAssessments.length} Observasi</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Teaching at the Right Level (TaRL) Pedagogical Recommendations */}
                <div className="bg-[#F2F7F4] rounded-3xl p-6 border border-[#CBE0D4] space-y-3">
                  <h3 className="text-sm font-black text-[#22352B] flex items-center gap-2">
                    <i className="mdi mdi-compass-outline text-[#486B5A] text-lg" />
                    <span>Panduan Diferensiasi Pembelajaran (TaRL) untuk Guru:</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#22352B]">
                    <div className="bg-white p-3.5 rounded-2xl border border-[#CBE0D4] space-y-1">
                      <p className="font-black text-[#486B5A]">1. Diferensiasi Konten</p>
                      <p className="text-[#565C58] leading-relaxed">
                        Sediakan bahan bacaan dan lembar aktivitas berjenjang sesuai kesiapan konsep (konkret ke abstrak).
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-[#CBE0D4] space-y-1">
                      <p className="font-black text-[#486B5A]">2. Diferensiasi Proses</p>
                      <p className="text-[#565C58] leading-relaxed">
                        Fasilitasi scaffolding kelompok kecil saat penugasan mandiri dan dorong kolaborasi tutor sebaya.
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-[#CBE0D4] space-y-1">
                      <p className="font-black text-[#486B5A]">3. Diferensiasi Produk</p>
                      <p className="text-[#565C58] leading-relaxed">
                        Berikan keleluasaan peserta didik menunjukkan pemahaman melalui karya visual, lisan, atau tulisan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-[#787F7A]">
                Pilih siswa untuk melihat profil diferensiasi TaRL.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL: TAMBAH SISWA BARU ─── */}
      {showAddStudentModal && (
        <div
          className="fixed inset-0 z-50 bg-[#22352B]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddStudentModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E2D8] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
              <h3 className="text-base font-black text-[#22352B]">
                Tambah Siswa Baru ke Kelas {classId}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="w-8 h-8 rounded-full bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EAF2]"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  value={newStudentForm.nisn}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, nisn: e.target.value })}
                  placeholder="013XXXXXXXX"
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={newStudentForm.full_name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
                  placeholder="Nama lengkap sesuai akta lahir"
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.nickname}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, nickname: e.target.value })}
                    placeholder="Nama panggilan"
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={newStudentForm.gender}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value as "L" | "P" })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Kelompok Diferensiasi Awal
                </label>
                <select
                  value={newStudentForm.learning_group}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, learning_group: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                >
                  <option value="Kelompok Intervensi">Kelompok Intervensi Khusus</option>
                  <option value="Kelompok Reguler">Kelompok Reguler (Berkembang Sesuai Harapan)</option>
                  <option value="Kelompok Pengayaan">Kelompok Pengayaan (Mahir)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Catatan Pengamatan Awal
                </label>
                <textarea
                  rows={2}
                  value={newStudentForm.notes}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, notes: e.target.value })}
                  placeholder="Karakter belajar, bakat minat, atau riwayat khusus..."
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EFECE4] text-xs font-bold text-[#565C58]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#486B5A] text-xs font-bold text-white hover:bg-[#22352B]"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: IMPOR EXCEL SISWA ─── */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-[#22352B]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E2D8] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
              <div>
                <h3 className="text-base font-black text-[#22352B]">
                  Impor Data Siswa Kelas {classId} dari Excel
                </h3>
                <p className="text-xs text-[#565C58]">
                  Gunakan template resmi untuk kelancaran pemetaan otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EAF2]"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-[#CBE0D4] rounded-2xl bg-[#F2F7F4] text-center space-y-2">
              <i className="mdi mdi-file-upload-outline text-3xl text-[#486B5A]" />
              <p className="text-xs font-bold text-[#22352B]">
                Pilih Berkas Excel (.xlsx) dari Perangkat Anda
              </p>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelFileUpload}
                className="text-xs text-[#565C58] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#486B5A] file:text-white hover:file:bg-[#22352B] cursor-pointer"
              />
            </div>

            {excelPreview.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto border border-[#E8E2D8] rounded-2xl p-3 bg-[#FAF8F5]">
                <p className="text-xs font-black text-[#486B5A]">
                  Pratinjau: {excelPreview.length} Siswa Terbaca
                </p>
                <div className="divide-y divide-[#E8E2D8] text-xs">
                  {excelPreview.slice(0, 5).map((p, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between">
                      <span className="font-bold text-[#22352B]">{p.full_name} ({p.nickname})</span>
                      <span className="text-[11px] text-[#565C58]">{p.gender} &bull; {p.learning_group}</span>
                    </div>
                  ))}
                  {excelPreview.length > 5 && (
                    <p className="py-1 text-[11px] text-[#787F7A] italic text-center">
                      ...dan {excelPreview.length - 5} siswa lainnya
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <a
                href={`/api/classrooms/${classId}/students/template`}
                download
                className="text-xs font-bold text-[#486B5A] hover:underline"
              >
                Unduh Template Excel Kosong
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EFECE4] text-xs font-bold text-[#565C58]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={excelPreview.length === 0 || importing}
                  onClick={handleCommitExcelImport}
                  className="px-4 py-2 rounded-2xl bg-[#486B5A] text-xs font-bold text-white hover:bg-[#22352B] disabled:opacity-50"
                >
                  {importing ? "Mengimpor..." : `Simpan ${excelPreview.length} Siswa`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: TAMBAH TUJUAN PEMBELAJARAN (TP) ─── */}
      {showAddTPModal && (
        <div
          className="fixed inset-0 z-50 bg-[#22352B]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddTPModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E2D8] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
              <h3 className="text-base font-black text-[#22352B]">
                Tambah Tujuan Pembelajaran (TP) Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTPModal(false)}
                className="w-8 h-8 rounded-full bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EAF2]"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveTP} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Mata Pelajaran *
                  </label>
                  <select
                    value={newTPForm.subject}
                    onChange={(e) => setNewTPForm({ ...newTPForm, subject: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Matematika & Logika">Matematika & Logika</option>
                    <option value="IPAS / Sains Tematik">IPAS / Sains Tematik</option>
                    <option value="Pendidikan Agama & Adab">Pendidikan Agama & Adab</option>
                    <option value="Pendidikan Pancasila & Sosial">Pendidikan Pancasila & Sosial</option>
                    <option value="Seni & Prakarya (SBdP)">Seni & Prakarya (SBdP)</option>
                    <option value="PJOK & Kesehatan">PJOK & Kesehatan</option>
                    <option value="Karakter & Pembiasaan">Karakter & Pembiasaan</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#565C58] block mb-1">
                    Dimensi Deep Learning *
                  </label>
                  <select
                    value={newTPForm.dimension_id}
                    onChange={(e) => setNewTPForm({ ...newTPForm, dimension_id: e.target.value as DeepLearningDimensionId })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                  >
                    {Object.entries(DEEP_LEARNING_DIMENSIONS).map(([key, dim]) => (
                      <option key={key} value={key}>
                        {dim.number}. {dim.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Kode TP (Opsional)
                </label>
                <input
                  type="text"
                  value={newTPForm.tp_code}
                  onChange={(e) => setNewTPForm({ ...newTPForm, tp_code: e.target.value })}
                  placeholder="Contoh: TP-MAT-02"
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Judul Tujuan Pembelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={newTPForm.tp_title}
                  onChange={(e) => setNewTPForm({ ...newTPForm, tp_title: e.target.value })}
                  placeholder="Contoh: Mengidentifikasi pola bilangan sederhana..."
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#565C58] block mb-1">
                  Deskripsi &amp; Indikator Ketercapaian
                </label>
                <textarea
                  rows={3}
                  value={newTPForm.tp_description}
                  onChange={(e) => setNewTPForm({ ...newTPForm, tp_description: e.target.value })}
                  placeholder="Penjelasan bukti perilaku dan unjuk kerja peserta didik..."
                  className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTPModal(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EFECE4] text-xs font-bold text-[#565C58]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-[#486B5A] text-xs font-bold text-white hover:bg-[#22352B]"
                >
                  Simpan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
