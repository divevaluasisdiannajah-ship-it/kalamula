"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Batch, Student, Evaluation, ParentResponse } from "@/types";

interface DashboardStats {
  totalStudents: number;
  activeBatches: number;
  evaluatedCount: number;
  redFlagCount: number;
  genderBreakdown: { L: number; P: number };
}

const POS_MONITOR_CONFIG = [
  {
    posNumber: 1,
    title: "Pos 1: Karakter & Sosial",
    subtitle: "Observasi Transisi & Dinamika Kelompok",
    evaluatorNames: "Ahmad Furqoni, S. Pd (SO 1) & Novia Permatasari, S. Pd (SO 2)",
    shortEvaluator: "Pak Furqoni & Bu Novia",
    icon: "mdi-account-group-outline",
    color: "#B85627",
    bgClass: "bg-[#F9E6DC]",
    textClass: "text-[#8C3713]",
  },
  {
    posNumber: 2,
    title: "Pos 2: Motorik Kasar",
    subtitle: "Keseimbangan & Koordinasi Fisik",
    evaluatorNames: "Rifky Delsandi Rifai, S. Pd (Pos A Motorik)",
    shortEvaluator: "Pak Rifky Delsandi",
    icon: "mdi-run-fast",
    color: "#2E6B4D",
    bgClass: "bg-[#E4EFE9]",
    textClass: "text-[#2E6B4D]",
  },
  {
    posNumber: 3,
    title: "Pos 3: Kematangan Kognitif",
    subtitle: "Pola, Berhitung & Pemecahan Masalah",
    evaluatorNames: "Shalma Ruhail Maldova, S. Pd (Pos B Kognitif)",
    shortEvaluator: "Bu Shalma Ruhail",
    icon: "mdi-brain",
    color: "#2D4558",
    bgClass: "bg-[#E4EAF2]",
    textClass: "text-[#2D4558]",
  },
  {
    posNumber: 4,
    title: "Pos 4: Bahasa & Pra-Literasi",
    subtitle: "Artikulasi, Pemahaman Cerita & Motorik Halus",
    evaluatorNames: "Susmurtiningsih, S. Pd (Pos C Bahasa)",
    shortEvaluator: "Bu Susmurtiningsih",
    icon: "mdi-book-open-page-variant-outline",
    color: "#7D5327",
    bgClass: "bg-[#EFE7D6]",
    textClass: "text-[#7D5327]",
  },
  {
    posNumber: 0, // Pos 0 mewakili Kuesioner Orang Tua
    title: "Kuesioner Rumah",
    subtitle: "Kemandirian & Kebiasaan Anak di Rumah",
    evaluatorNames: "Wali Murid Calon Siswa (Mandiri via QR)",
    shortEvaluator: "Wali Murid (QR)",
    icon: "mdi-home-heart",
    color: "#486B5A",
    bgClass: "bg-[#E4EFE9]",
    textClass: "text-[#486B5A]",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeBatches: 0,
    evaluatedCount: 0,
    redFlagCount: 0,
    genderBreakdown: { L: 0, P: 0 },
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [parentResponses, setParentResponses] = useState<ParentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Filter State Matriks
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState<string>("");

  const loadDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [batchRes, studentRes, evalRes, parentRes] = await Promise.all([
        fetch("/api/batches"),
        fetch("/api/students"),
        fetch("/api/evaluations"),
        fetch("/api/parent-responses"),
      ]);

      let allBatches: Batch[] = [];
      let allStudents: Student[] = [];
      let allEvals: Evaluation[] = [];
      let allParentResp: ParentResponse[] = [];

      if (batchRes.ok) {
        const batchData = await batchRes.json();
        allBatches = batchData.data || [];
        setBatches(allBatches);
      }

      if (studentRes.ok) {
        const studentData = await studentRes.json();
        allStudents = studentData.data || [];
        setStudents(allStudents);
      }

      if (evalRes.ok) {
        const evalData = await evalRes.json();
        allEvals = evalData.data || [];
        setEvaluations(allEvals);
      }

      if (parentRes.ok) {
        const parentData = await parentRes.json();
        allParentResp = parentData.data || [];
        setParentResponses(allParentResp);
      }

      // Compute general stats
      const activeBatchesCount = allBatches.filter((b) => b.status === "active").length;
      const completedStudentIds = new Set(
        allEvals.filter((e) => e.is_complete).map((e) => e.student_id)
      );
      const redFlagStudentIds = new Set(
        allEvals.filter((e) => e.has_red_flag).map((e) => e.student_id)
      );

      setStats({
        totalStudents: allStudents.length,
        activeBatches: activeBatchesCount,
        evaluatedCount: completedStudentIds.size,
        redFlagCount: redFlagStudentIds.size,
        genderBreakdown: {
          L: allStudents.filter((s) => s.gender === "L").length,
          P: allStudents.filter((s) => s.gender === "P").length,
        },
      });

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB"
      );
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Map evaluasi per siswa: student_id -> { [pos_number]: Evaluation }
  const studentEvalMap = useMemo(() => {
    const map: Record<string, Record<number, Evaluation>> = {};
    evaluations.forEach((ev) => {
      if (!map[ev.student_id]) {
        map[ev.student_id] = {};
      }
      map[ev.student_id][ev.pos_number] = ev;
    });
    return map;
  }, [evaluations]);

  // Map respon orang tua: student_id -> ParentResponse
  const studentParentMap = useMemo(() => {
    const map: Record<string, ParentResponse> = {};
    parentResponses.forEach((pr) => {
      map[pr.student_id] = pr;
    });
    return map;
  }, [parentResponses]);

  // Hitung ringkasan progres per pos evaluator
  const posProgressSummary = useMemo(() => {
    const totalStudents = students.length;

    return POS_MONITOR_CONFIG.map((cfg) => {
      let completedCount = 0;
      let lastActivityTime: string | null = null;

      if (cfg.posNumber === 0) {
        // Kuesioner Orang Tua
        completedCount = parentResponses.length;
        parentResponses.forEach((pr) => {
          if (!lastActivityTime || new Date(pr.submitted_at) > new Date(lastActivityTime)) {
            lastActivityTime = pr.submitted_at;
          }
        });
      } else {
        // Pos Evaluasi 1 - 4
        const completedStudentSet = new Set<string>();
        evaluations.forEach((ev) => {
          if (ev.pos_number === cfg.posNumber && ev.is_complete) {
            completedStudentSet.add(ev.student_id);
            if (!lastActivityTime || new Date(ev.updated_at) > new Date(lastActivityTime)) {
              lastActivityTime = ev.updated_at;
            }
          }
        });
        completedCount = completedStudentSet.size;
      }

      const percent = totalStudents > 0 ? Math.min(100, Math.round((completedCount / totalStudents) * 100)) : 0;
      const isComplete = totalStudents > 0 && completedCount >= totalStudents;
      const isInProgress = completedCount > 0 && !isComplete;

      return {
        ...cfg,
        completedCount,
        totalStudents,
        percent,
        isComplete,
        isInProgress,
        lastActivityTime,
      };
    });
  }, [students.length, evaluations, parentResponses]);

  // Filter daftar siswa untuk matriks progres
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Filter Kelompok
      if (groupFilter === "Kelompok 1" && s.observation_group !== "Kelompok 1") return false;
      if (groupFilter === "Kelompok 2" && s.observation_group !== "Kelompok 2") return false;
      if (groupFilter === "Kelompok 3" && s.observation_group !== "Kelompok 3") return false;
      if (groupFilter === "incomplete") {
        const evals = studentEvalMap[s.id] || {};
        const pos1Done = Boolean(evals[1]?.is_complete);
        const pos2Done = Boolean(evals[2]?.is_complete);
        const pos3Done = Boolean(evals[3]?.is_complete);
        const pos4Done = Boolean(evals[4]?.is_complete);
        const parentDone = Boolean(studentParentMap[s.id]);
        const isAllDone = pos1Done && pos2Done && pos3Done && pos4Done && parentDone;
        if (isAllDone) return false;
      }

      // 2. Filter Pencarian Nama / Reg No
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        const matchName = s.full_name.toLowerCase().includes(q);
        const matchNick = (s.nickname || "").toLowerCase().includes(q);
        const matchReg = (s.registration_no || "").toLowerCase().includes(q);
        if (!matchName && !matchNick && !matchReg) return false;
      }

      return true;
    });
  }, [students, groupFilter, searchStudent, studentEvalMap, studentParentMap]);

  // Format waktu aktivitas terakhir (misal: "12:06 WIB" atau "10 mnt lalu")
  const formatTimeDisplay = (isoStr: string | null) => {
    if (!isoStr) return "-";
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    } catch {
      return "-";
    }
  };

  const overallEvaluationProgress = useMemo(() => {
    const totalSlots = students.length * 5; // 4 Pos + 1 Kuesioner
    if (totalSlots === 0) return 0;
    const completedEvalSlots = evaluations.filter((e) => e.is_complete).length;
    const completedParentSlots = parentResponses.length;
    const totalDone = completedEvalSlots + completedParentSlots;
    return Math.min(100, Math.round((totalDone / totalSlots) * 100));
  }, [students.length, evaluations, parentResponses]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-28 font-sans">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D67443] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="mdi mdi-leaf text-2xl" />
            </div>
            <span className="font-brand lowercase text-xl font-extrabold text-[#22352B] tracking-tight">
              kalamula
            </span>
            <span className="bg-[#E4EAF2] text-[#36506C] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ml-1">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing || loading}
              className="bg-white border border-[#E8E2D8] text-[#22352B] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Perbarui data terbaru secara real-time"
            >
              <i className={`mdi mdi-refresh text-sm ${refreshing ? "animate-spin text-[#B85627]" : "text-[#787F7A]"}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              href="/"
              className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-2xs"
            >
              <i className="mdi mdi-chevron-left text-base" />
              <span>Beranda</span>
            </Link>
          </div>
        </div>

        {/* Hero Banner: Dashboard Koordinator SPMB */}
        <div className="relative overflow-hidden bg-[#2D4558] rounded-3xl p-5 sm:p-6 shadow-sm text-white">
          <div className="bg-megamendung-overlay" aria-hidden="true" />

          <div className="relative z-10 space-y-4">
            {/* Top row: badge + status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D4558] text-xs font-black shadow-xs tracking-wider uppercase">
                <i className="mdi mdi-shield-crown-outline text-sm" />
                PORTAL KOORDINATOR SPMB
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4EFE9] text-[#2E6B4D] text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#2E6B4D] animate-pulse" />
                  <span>{lastUpdated ? `Live: ${lastUpdated}` : "Memuat data..."}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D4558] text-xs font-bold shadow-xs">
                  <i className="mdi mdi-calendar-check-outline text-sm" />
                  <span>{loading ? "..." : `${stats.activeBatches} Gelombang Aktif`}</span>
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Dashboard Koordinator SPMB
              </h1>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                Monitoring pelaksanaan asesmen diagnostik, progres evaluator, dan keterisian kuesioner orang tua
              </p>
            </div>

            {/* 3 Metric Cards Putih Solid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              <div className="bg-white rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  TOTAL SISWA
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#2D4558] tracking-tight block">
                  {loading ? "..." : stats.totalStudents}
                </span>
                <span className="text-[10px] text-[#787F7A] font-semibold block truncate">
                  {stats.genderBreakdown.L}L / {stats.genderBreakdown.P}P
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  PROGRESS GLOBAL
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#2E6B4D] tracking-tight block">
                  {loading ? "..." : `${overallEvaluationProgress}%`}
                </span>
                <span className="text-[10px] text-[#2E6B4D] font-bold block">
                  {stats.evaluatedCount} Siswa Terobservasi
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  PENDAMPINGAN
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#8C3713] tracking-tight block">
                  {loading ? "..." : stats.redFlagCount}
                </span>
                <span className="text-[10px] text-[#8C3713] font-semibold block">
                  Sinyal Afektif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── FITUR BARU: MONITORING REAL-TIME EVALUATOR & POS ASESMEN ─────── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-sm space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FAF8F5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center flex-shrink-0 text-xl shadow-2xs">
                <i className="mdi mdi-clipboard-pulse-outline" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-[#22352B] tracking-tight">
                    Monitoring Progres Evaluator &amp; Pos
                  </h2>
                  <span className="bg-[#E4EFE9] text-[#2E6B4D] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B4D] animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-[#787F7A]">
                  Pantau guru yang sedang menilai, pos yang sudah tuntas, dan aktivitas terakhir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#E8E2D8] text-[#22352B] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <i className={`mdi mdi-sync ${refreshing ? "animate-spin text-[#B85627]" : "text-[#787F7A]"}`} />
                <span>Cek Update Sekarang</span>
              </button>
            </div>
          </div>

          {/* Grid 5 Kartu Evaluator per Pos (Termasuk Kuesioner Ortu) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {posProgressSummary.map((p) => {
              const statusBadge = p.isComplete ? (
                <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  <i className="mdi mdi-check-circle text-xs" />
                  Selesai 100%
                </span>
              ) : p.isInProgress ? (
                <span className="inline-flex items-center gap-1 bg-[#FAF5F0] text-[#B85627] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  <i className="mdi mdi-timer-sand text-xs animate-spin" />
                  Berjalan {p.percent}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-[#F5F2EB] text-[#787F7A] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  <i className="mdi mdi-clock-outline text-xs" />
                  Belum Mulai
                </span>
              );

              return (
                <div
                  key={p.posNumber}
                  className={`rounded-2xl p-4 border transition hover:shadow-md flex flex-col justify-between gap-3 ${
                    p.isComplete
                      ? "bg-[#FCFAF8] border-[#D6E6DC]"
                      : p.isInProgress
                      ? "bg-white border-[#E8E2D8]"
                      : "bg-[#FAF8F5]/80 border-[#E8E2D8]/70"
                  }`}
                >
                  {/* Atas: Pos Title + Status */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${p.bgClass} ${p.textClass} flex-shrink-0 shadow-2xs`}>
                          <i className={`mdi ${p.icon}`} />
                        </span>
                        <div>
                          <h3 className="font-extrabold text-xs sm:text-[13px] text-[#22352B] leading-tight">
                            {p.title}
                          </h3>
                          <p className="text-[11px] text-[#787F7A] leading-tight mt-0.5 line-clamp-1">
                            {p.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nama Guru / Evaluator */}
                    <div className="bg-white/80 rounded-xl p-2 border border-[#E8E2D8]/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#787F7A] font-medium flex items-center gap-1">
                          <i className="mdi mdi-account-tie text-xs text-[#9B3F18]" />
                          <span>Evaluator:</span>
                        </span>
                        {statusBadge}
                      </div>
                      <p className="font-bold text-xs text-[#22352B] leading-snug">
                        {p.evaluatorNames}
                      </p>
                    </div>
                  </div>

                  {/* Bawah: Progress Bar & Activity Timestamp */}
                  <div className="space-y-2 pt-1 border-t border-[#E8E2D8]/50">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#565C58]">
                        Keterisian: <strong className="text-[#22352B] font-mono">{p.completedCount}</strong> dari {p.totalStudents} Siswa
                      </span>
                      <span className="font-mono font-black text-xs text-[#22352B] tabular-nums">
                        {p.percent}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.isComplete ? "bg-[#2E6B4D]" : p.isInProgress ? "bg-[#B85627]" : "bg-[#DDD7CE]"
                        }`}
                        style={{ width: `${Math.max(4, p.percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#787F7A] pt-0.5">
                      <span className="flex items-center gap-1">
                        <i className="mdi mdi-history text-xs text-[#B85627]" />
                        <span>Aktivitas Terakhir:</span>
                      </span>
                      <span className="font-mono font-bold text-[#22352B]">
                        {formatTimeDisplay(p.lastActivityTime)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── TABEL MATRIKS PROGRES PENILAIAN SISWA PER POS ───────────── */}
          <div className="space-y-3 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#22352B] flex items-center gap-2">
                  <i className="mdi mdi-grid text-base text-[#2E6B4D]" />
                  <span>Matriks Capaian Observasi per Calon Siswa</span>
                </h3>
                <p className="text-xs text-[#787F7A]">
                  Periksa kelengkapan 4 pos pengamatan guru dan kuesioner orang tua untuk masing-masing anak
                </p>
              </div>

              {/* Input Pencarian Siswa */}
              <div className="relative w-full sm:w-60">
                <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#787F7A]" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Cari nama / nomor reg..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#22352B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6B4D]"
                />
              </div>
            </div>

            {/* Filter Pills Kelompok */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: "all", label: `Semua (${students.length})` },
                { id: "Kelompok 1", label: `Kelompok 1 (${students.filter((s) => s.observation_group === "Kelompok 1").length})` },
                { id: "Kelompok 2", label: `Kelompok 2 (${students.filter((s) => s.observation_group === "Kelompok 2").length})` },
                { id: "Kelompok 3", label: `Kelompok 3 (${students.filter((s) => s.observation_group === "Kelompok 3").length})` },
                { id: "incomplete", label: "Hanya yang Belum Lengkap" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGroupFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${
                    groupFilter === tab.id
                      ? "bg-[#284034] text-white shadow-2xs font-extrabold"
                      : "bg-[#FAF8F5] border border-[#E8E2D8] text-[#565C58] hover:bg-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Responsive Table Wrapper (Memenuhi Guidance responsive-table) */}
            <div
              tabIndex={0}
              role="region"
              aria-label="Matriks Progres Penilaian per Siswa dan Pos"
              className="table-wrapper overflow-x-auto rounded-2xl border border-[#E8E2D8] bg-white shadow-2xs focus-visible:ring-2 focus-visible:ring-[#2E6B4D] focus-visible:outline-none"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F5] text-[#565C58] font-extrabold text-[11px] border-b border-[#E8E2D8] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">No</th>
                    <th className="py-3 px-3.5 min-w-[160px]">Calon Siswa</th>
                    <th className="py-3 px-3 text-center min-w-[70px]">Kelompok</th>
                    <th className="py-3 px-3 text-center min-w-[85px]">
                      Pos 1
                      <span className="block text-[9px] font-normal text-[#787F7A]">Karakter</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[85px]">
                      Pos 2
                      <span className="block text-[9px] font-normal text-[#787F7A]">Motorik</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[85px]">
                      Pos 3
                      <span className="block text-[9px] font-normal text-[#787F7A]">Kognitif</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[85px]">
                      Pos 4
                      <span className="block text-[9px] font-normal text-[#787F7A]">Bahasa</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[85px]">
                      Ortu
                      <span className="block text-[9px] font-normal text-[#787F7A]">Kuesioner</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Status</th>
                    <th className="py-3 px-3.5 text-right min-w-[80px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]/80 text-[11.5px]">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[#787F7A]">
                        <i className="mdi mdi-loading mdi-spin text-xl text-[#B85627] mr-1.5" />
                        <span>Memuat data penilaian dan kuesioner...</span>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[#787F7A] italic">
                        Tidak ada data calon siswa yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const evals = studentEvalMap[s.id] || {};
                      const ev1 = evals[1];
                      const ev2 = evals[2];
                      const ev3 = evals[3];
                      const ev4 = evals[4];
                      const parentResp = studentParentMap[s.id];

                      const isPos1Done = Boolean(ev1?.is_complete);
                      const isPos2Done = Boolean(ev2?.is_complete);
                      const isPos3Done = Boolean(ev3?.is_complete);
                      const isPos4Done = Boolean(ev4?.is_complete);
                      const isParentDone = Boolean(parentResp);

                      const doneCount =
                        (isPos1Done ? 1 : 0) +
                        (isPos2Done ? 1 : 0) +
                        (isPos3Done ? 1 : 0) +
                        (isPos4Done ? 1 : 0) +
                        (isParentDone ? 1 : 0);

                      const isFullyComplete = doneCount === 5;

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F5]/80 transition">
                          <td className="py-2.5 px-3.5 text-center font-bold text-[#787F7A]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <p className="font-bold text-[#22352B] leading-snug">
                              {s.full_name}
                            </p>
                            <p className="text-[10px] text-[#787F7A] font-mono mt-0.5">
                              {s.registration_no} &bull; &ldquo;{s.nickname}&rdquo;
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block bg-[#FAF8F5] border border-[#E8E2D8] text-[#565C58] text-[10.5px] font-bold px-2 py-0.5 rounded-md">
                              {s.observation_group || "-"}
                            </span>
                          </td>

                          {/* Pos 1 */}
                          <td className="py-2.5 px-3 text-center">
                            {isPos1Done ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-check-bold text-xs" />
                                <span>{ev1?.total_score ? `${ev1.total_score.toFixed(1)}` : "Selesai"}</span>
                              </span>
                            ) : (
                              <span className="text-[#C5BCB2] font-mono text-sm">&minus;</span>
                            )}
                          </td>

                          {/* Pos 2 */}
                          <td className="py-2.5 px-3 text-center">
                            {isPos2Done ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-check-bold text-xs" />
                                <span>{ev2?.total_score ? `${ev2.total_score.toFixed(1)}` : "Selesai"}</span>
                              </span>
                            ) : (
                              <span className="text-[#C5BCB2] font-mono text-sm">&minus;</span>
                            )}
                          </td>

                          {/* Pos 3 */}
                          <td className="py-2.5 px-3 text-center">
                            {isPos3Done ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-check-bold text-xs" />
                                <span>{ev3?.total_score ? `${ev3.total_score.toFixed(1)}` : "Selesai"}</span>
                              </span>
                            ) : (
                              <span className="text-[#C5BCB2] font-mono text-sm">&minus;</span>
                            )}
                          </td>

                          {/* Pos 4 */}
                          <td className="py-2.5 px-3 text-center">
                            {isPos4Done ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-check-bold text-xs" />
                                <span>{ev4?.total_score ? `${ev4.total_score.toFixed(1)}` : "Selesai"}</span>
                              </span>
                            ) : (
                              <span className="text-[#C5BCB2] font-mono text-sm">&minus;</span>
                            )}
                          </td>

                          {/* Kuesioner Ortu */}
                          <td className="py-2.5 px-3 text-center">
                            {isParentDone ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-check-bold text-xs" />
                                <span>Masuk</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[#FAF5F0] text-[#9B3F18] px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <i className="mdi mdi-clock-outline text-xs" />
                                <span>Belum</span>
                              </span>
                            )}
                          </td>

                          {/* Status Keseluruhan */}
                          <td className="py-2.5 px-3 text-center">
                            {isFullyComplete ? (
                              <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs">
                                <i className="mdi mdi-check-all text-xs" />
                                <span>Lengkap (5/5)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E2D8] text-[#7D5327] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                                <span>{doneCount}/5 Pos</span>
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="py-2.5 px-3.5 text-right">
                            <Link
                              href={`/reports/student/${s.id}`}
                              className="text-[#B85627] hover:underline font-bold text-xs inline-flex items-center gap-0.5"
                            >
                              <span>Hasil</span>
                              <i className="mdi mdi-chevron-right text-sm" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Card Aksi Cepat Koordinator */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D67443]" />
            <h2 className="text-xs font-extrabold text-[#787F7A] uppercase tracking-wider">
              AKSI CEPAT KOORDINATOR
            </h2>
          </div>

          {/* Tombol Penuh: + Buat Gelombang Baru (#B85627) */}
          <Link
            href="/admin/batches"
            className="w-full bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            <i className="mdi mdi-plus text-xl" />
            <span className="text-sm font-bold">Buat Gelombang Baru</span>
          </Link>

          {/* 4 Tombol Aksi Kotak Sejajar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Import Data Siswa */}
            <Link
              href="/admin/students"
              className="bg-[#E4EFE9] text-[#486B5A] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-tray-arrow-up text-2xl mb-1" />
              <span className="text-xs leading-snug">Import Siswa</span>
            </Link>

            {/* Rubrik & Indikator */}
            <Link
              href="/admin/configs"
              className="bg-[#E4EAF2] text-[#36506C] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-tune-vertical text-2xl mb-1" />
              <span className="text-xs leading-snug">Rubrik SPMB</span>
            </Link>

            {/* Pembagian Kelas & PIN */}
            <Link
              href="/admin/classes"
              className="bg-[#EFE7D6] text-[#7D5327] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-scale-balance text-2xl mb-1" />
              <span className="text-xs leading-snug">Kelas &amp; PIN Guru</span>
            </Link>

            {/* Identitas Sekolah & Guru */}
            <Link
              href="/admin/school"
              className="bg-[#F2F7F4] text-[#486B5A] border border-[#CBE0D4] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-domain text-2xl mb-1" />
              <span className="text-xs leading-snug">Identitas &amp; Guru</span>
            </Link>
          </div>

          {/* Tombol Bawah Putus-Putus (Seed Uji Coba) */}
          <button
            type="button"
            onClick={async () => {
              if (
                confirm(
                  "Isi data uji coba 56 calon siswa lengkap dengan hasil observasi 5 Pos?"
                )
              ) {
                try {
                  const res = await fetch("/api/seed", { method: "POST" });
                  const json = await res.json();
                  if (json.success) {
                    alert("Sukses: 56 siswa (28 L / 28 P) berhasil dimuat.");
                    window.location.reload();
                  } else {
                    alert("Gagal melakukan seed dataset.");
                  }
                } catch {
                  alert("Koneksi gagal.");
                }
              }
            }}
            className="w-full border border-dashed border-[#DDD7CE] bg-[#FAF8F5] rounded-2xl p-3 flex items-center justify-between text-xs text-[#565C58] hover:bg-[#F3EFE6] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <i className="mdi mdi-flask-outline text-lg text-[#787F7A]" />
              <span className="font-semibold text-[#22352B]">
                Isi data uji coba (56 calon siswa)
              </span>
            </div>
            <span className="bg-white border border-[#DDD7CE] text-[#787F7A] text-[10px] font-extrabold px-2 py-0.5 rounded shadow-2xs">
              DEV
            </span>
          </button>
        </div>

        {/* Gelombang Observasi Terbaru */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#22352B]">
              Gelombang Observasi Terbaru
            </h3>
            <Link
              href="/admin/batches"
              className="text-xs font-bold text-[#B85627] hover:underline flex items-center gap-0.5"
            >
              <span>Kelola Semua</span>
              <i className="mdi mdi-chevron-right text-sm" />
            </Link>
          </div>

          {batches.length === 0 && !loading ? (
            <p className="text-xs text-[#787F7A] py-4 text-center italic">
              Belum ada gelombang observasi.
            </p>
          ) : (
            <div className="space-y-2">
              {batches.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8E2D8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0">
                      <i className="mdi mdi-calendar-blank-outline text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#22352B]">
                        {b.batch_name}
                      </p>
                      <p className="text-[11px] text-[#787F7A] mt-0.5">
                        Tanggal: {b.batch_date}
                      </p>
                    </div>
                  </div>
                  {b.status === "active" && (
                    <span className="bg-[#E4EFE9] text-[#22352B] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#4F936F]" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calon Siswa Baru Terdaftar */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#22352B]">
              Calon Siswa Baru Terdaftar
            </h3>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-[#B85627] hover:underline flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <i className="mdi mdi-chevron-right text-sm" />
            </Link>
          </div>

          {students.length === 0 && !loading ? (
            <p className="text-xs text-[#787F7A] py-4 text-center italic">
              Belum ada data calon siswa.
            </p>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8E2D8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-2xs ${
                        idx % 2 === 0 ? "bg-[#D67443]" : "bg-[#486B5A]"
                      }`}
                    >
                      {s.nickname ? s.nickname.charAt(0).toUpperCase() : s.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#22352B] truncate">
                        {s.full_name}
                      </p>
                      <p className="text-[11px] text-[#787F7A] truncate mt-0.5">
                        {s.registration_no} &bull; {s.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/reports/student/${s.id}`}
                    className="bg-[#E4EFE9] hover:bg-[#D5E6DC] text-[#486B5A] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition flex-shrink-0 ml-2"
                  >
                    <i className="mdi mdi-file-document-outline text-sm" />
                    <span>Laporan</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
