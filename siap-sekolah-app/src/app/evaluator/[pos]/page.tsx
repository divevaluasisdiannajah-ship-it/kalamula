"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Student, Evaluation, AssessmentConfig, Batch } from "@/types";

export default function EvaluatorStudentListPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const posNumber = Number(params.pos);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mandiri" | "bimbingan">("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [currentSubrole, setCurrentSubrole] = useState<"so1" | "so2">("so1");

  useEffect(() => {
    const urlSubrole = searchParams.get("subrole") as "so1" | "so2" | null;
    const savedSubrole =
      typeof window !== "undefined"
        ? (localStorage.getItem("kalamula_evaluator_subrole") as "so1" | "so2" | null)
        : null;
    if (urlSubrole === "so1" || urlSubrole === "so2") {
      setCurrentSubrole(urlSubrole);
    } else if (savedSubrole === "so1" || savedSubrole === "so2") {
      setCurrentSubrole(savedSubrole);
    }
  }, [searchParams]);

  const loadBatchStudents = useCallback(
    async (targetBatchId: string) => {
      try {
        // Load students for this batch
        const sRes = await fetch(`/api/students?batch_id=${targetBatchId}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setStudents(sData.data || []);
        } else {
          throw new Error("Gagal mengambil daftar siswa");
        }

        // Load evaluations for this batch & pos
        const eRes = await fetch(
          `/api/evaluations?batch_id=${targetBatchId}&pos_number=${posNumber}`
        );
        if (eRes.ok) {
          const eData = await eRes.json();
          setEvaluations(eData.data || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat data siswa.";
        setError(msg);
      }
    },
    [posNumber]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get all batches
      const batchRes = await fetch("/api/batches");
      if (!batchRes.ok) throw new Error("Gagal mengambil data gelombang");

      const batchData = await batchRes.json();
      const allBatches: Batch[] = batchData.data || [];
      setBatches(allBatches);

      if (allBatches.length > 0) {
        const urlBatchId = searchParams.get("batch_id") || searchParams.get("batch");
        const savedBatchId =
          typeof window !== "undefined"
            ? localStorage.getItem("kalamula_evaluator_batch_id")
            : null;
        const requestedId = urlBatchId || savedBatchId;

        let selected = allBatches.find((b) => b.id === requestedId);
        if (!selected) {
          // Smart priority: active batch with students > any batch with students > active batch > first batch
          selected =
            allBatches.find((b) => b.status === "active" && (b.student_count || 0) > 0) ||
            allBatches.find((b) => (b.student_count || 0) > 0) ||
            allBatches.find((b) => b.status === "active") ||
            allBatches[0];
        }

        setBatch(selected);
        setActiveBatchId(selected.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("kalamula_evaluator_batch_id", selected.id);
        }

        await loadBatchStudents(selected.id);
      }

      // 2. Load config for this pos
      const cRes = await fetch("/api/configs");
      if (cRes.ok) {
        const cData = await cRes.json();
        const posConfig = (cData.data || []).find(
          (c: AssessmentConfig) => c.pos_number === posNumber && c.is_active
        );
        setConfig(posConfig || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Periksa koneksi jaringan Anda.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [posNumber, searchParams, loadBatchStudents]);

  const handleBatchChange = async (newBatchId: string) => {
    const selected = batches.find((b) => b.id === newBatchId);
    if (!selected) return;
    setBatch(selected);
    setActiveBatchId(newBatchId);
    if (typeof window !== "undefined") {
      localStorage.setItem("kalamula_evaluator_batch_id", newBatchId);
    }
    router.replace(`/evaluator/${posNumber}?batch_id=${newBatchId}`);
    setLoading(true);
    await loadBatchStudents(newBatchId);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStudentEvaluation = useCallback(
    (studentId: string) => {
      return evaluations.find((e) => e.student_id === studentId);
    },
    [evaluations]
  );

  const completionStats = useMemo(() => {
    if (students.length === 0) return { percent: 0, completed: 0, total: 0, pending: 0 };
    const completed = students.filter((s) => {
      const ev = getStudentEvaluation(s.id);
      return ev?.is_complete;
    }).length;
    return {
      percent: Math.round((completed / students.length) * 100),
      completed,
      total: students.length,
      pending: Math.max(0, students.length - completed),
    };
  }, [students, getStudentEvaluation]);

  const POS_METADATA: Record<number, { name: string; focus: string; role: string }> = {
    1: {
      name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
      focus: "Kemandirian berpisah, adab antrean, ketertiban transisi, & bermain bebas (Longitudinal)",
      role: "Super Observer (SO 1 & SO 2)",
    },
    2: {
      name: "Pos Motorik Kasar & Koordinasi Fisik",
      focus: "Keseimbangan meniti titian, tangkap bola & rotasi pendamping",
      role: "Station Evaluator + Escort",
    },
    3: {
      name: "Pos Kematangan Kognitif & Berhitung",
      focus: "Pola bentuk, warna, klasifikasi & logika kuantitas (12 mnt)",
      role: "Station Evaluator",
    },
    4: {
      name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
      focus: "Pemahaman cerita, ekspresi verbal & kontrol pensil tripod grasp",
      role: "Station Evaluator",
    },
  };

  /** Calculate accurate age string */
  const calculateAge = (birthDateStr: string): string => {
    if (!birthDateStr) return "-";
    const birth = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} thn ${months} bln`;
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const ev = getStudentEvaluation(student.id);
      const isComplete = Boolean(ev?.is_complete);
      const score = ev?.total_score || 0;
      const hasRedFlag = Boolean(ev?.has_red_flag);
      const isMandiri = isComplete && score >= 2.5 && !hasRedFlag;
      const isBimbingan = isComplete && (score < 2.5 || hasRedFlag);

      if (filterTab === "mandiri" && !isMandiri) return false;
      if (filterTab === "bimbingan" && !isBimbingan) return false;

      if (selectedGroup !== "all" && student.observation_group !== selectedGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          student.full_name.toLowerCase().includes(q) ||
          student.nickname.toLowerCase().includes(q) ||
          student.registration_no.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [students, filterTab, selectedGroup, searchQuery, getStudentEvaluation]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-24 font-sans">
      <div className="p-4 sm:p-6 max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-4">
        {/* Top Bar Navigation & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <Link
            href="/evaluator"
            className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96]"
          >
            <i className="mdi mdi-chevron-left text-base" />
            <span>Ganti Pos</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/reports/rubric/${posNumber}${activeBatchId ? `?batch_id=${activeBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E8E2D8] text-[#B85627] hover:bg-[#FAF8F5] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96]"
              title="Cetak Lembar Observasi Fisik Pos"
            >
              <i className="mdi mdi-printer-outline text-base" />
              <span className="hidden sm:inline">Cetak Lembar</span>
              <span className="sm:hidden">Cetak</span>
            </Link>

            {posNumber === 1 && (
              <Link
                href={`/reports/rubric/so${activeBatchId ? `?batch_id=${activeBatchId}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#E4EFE9] border border-[#CBE0D4] text-[#486B5A] hover:bg-[#D6E6DC] px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96]"
                title="Cetak Lembar Super Observer Terpadu"
              >
                <i className="mdi mdi-eye-check-outline text-base" />
                <span className="hidden sm:inline">Lembar SO</span>
                <span className="sm:hidden">SO</span>
              </Link>
            )}

            <div className="bg-[#E4EFE9] text-[#22352B] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#486B5A] animate-pulse" />
              <span>{posNumber === 1 ? "Super Observer Aktif" : "Evaluator Stasioner Aktif"}</span>
            </div>
          </div>
        </div>

        {/* Integrated Pos & Batch Elevated Header Strip */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Pos Info + Batch Selector */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#F9E6DC] text-[#B85627] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  RUANG ASESMEN
                </span>
                {POS_METADATA[posNumber]?.role && (
                  <span className="bg-[#FAF8F5] text-[#565C58] border border-[#E8E2D8] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                    {POS_METADATA[posNumber].role}
                  </span>
                )}
                {/* Inline Gelombang Selector */}
                {batches.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 ml-auto md:ml-0">
                    <label htmlFor="batch-select-pos" className="sr-only">
                      Pilih Gelombang
                    </label>
                    <select
                      id="batch-select-pos"
                      value={activeBatchId || ""}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      className="bg-[#FAF8F5] border border-[#DDD0B8] text-[#22352B] font-bold text-xs rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#486B5A] cursor-pointer"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_name} ({b.student_count ?? 0} Siswa){b.status === "active" ? " • Aktif" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#22352B] tracking-tight leading-tight">
                {config?.pos_name || POS_METADATA[posNumber]?.name || "Pos Observasi"}
              </h1>

              <p className="text-xs text-[#565C58] font-normal leading-relaxed">
                <span className="font-semibold text-[#22352B]">{batch?.batch_name || "Gelombang Aktif"}</span> &bull; {POS_METADATA[posNumber]?.focus}
              </p>

              {posNumber === 5 && (
                <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-2.5 mt-2 text-xs text-[#565C58] leading-relaxed">
                  <i className="mdi mdi-cookie-clock-outline text-[#B85627] mr-1.5 text-sm" />
                  <strong className="text-[#22352B]">Sesi Istirahat &amp; Bermain Bebas:</strong> Anak diperkenankan minum &amp; snack sambil bermain. Observasi interaksi dan regulasi diri tetap dicatat secara rileks.
                </div>
              )}
            </div>

            {/* Right: Progress Strip & Stats */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-3.5 sm:p-4 md:w-72 flex-shrink-0 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#565C58]">Progres Observasi</span>
                <span className="font-bold text-[#22352B] tabular-nums font-mono text-sm">
                  {completionStats.percent}%
                </span>
              </div>

              <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionStats.percent} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="h-full bg-[#486B5A] rounded-full transition-all duration-300"
                  style={{ width: `${completionStats.percent}%` }}
                />
              </div>

              {/* 3 Angka Ringkas */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E8E2D8]/60 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#787F7A] block">TOTAL</span>
                  <span className="text-base font-bold text-[#22352B] tabular-nums font-mono block">
                    {completionStats.total}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#486B5A] block">SELESAI</span>
                  <span className="text-base font-bold text-[#486B5A] tabular-nums font-mono block">
                    {completionStats.completed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#B85627] block">MENUNGGU</span>
                  <span className="text-base font-bold text-[#B85627] tabular-nums font-mono block">
                    {completionStats.pending}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── KARTU PANDUAN PRIBADI (PERSONALIZED FIELD TASK CARD) ─────────── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {posNumber === 2 && (
          <div className="bg-[#E4EFE9] rounded-2xl p-4 sm:p-5 border border-[#CBE0D4] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#CBE0D4]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#486B5A] text-white flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                  <i className="mdi mdi-run-fast" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                    Tugas Lapangan Anda: Penguji Motorik Kasar &amp; Penjemput Rotasi
                  </h3>
                  <p className="text-[11px] text-[#486B5A] font-bold">
                    Ikuti alur waktu jemput &amp; serah-terima berikut agar anak tidak menunggu di koridor:
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#486B5A] text-white shadow-2xs">
                Peran: Evaluator Motorik + Escort
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
              <div className="bg-white/95 p-3 rounded-xl border border-[#CBE0D4] space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#486B5A] text-[11px]">08.00 (Titik Awal)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#486B5A]" />
                </div>
                <p className="text-[11px] text-[#22352B] font-bold">Jemput Kelompok 1</p>
                <p className="text-[10.5px] text-[#565C58] leading-snug">
                  Hadir di titik awal kedatangan saat pembagian name tag. <strong className="text-[#486B5A]">Jemput Kelompok 1</strong> bawa ke Pos Motorik Kasar.
                </p>
              </div>

              <div className="bg-white/95 p-3 rounded-xl border border-[#CBE0D4] space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#486B5A] text-[11px]">08.12 - 08.24</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#486B5A]" />
                </div>
                <p className="text-[11px] text-[#22352B] font-bold">Uji Kelompok 1</p>
                <p className="text-[10.5px] text-[#565C58] leading-snug">
                  Uji keseimbangan titian, lompat 2 kaki, dan koordinasi tangkap bola Kelompok 1 di ruang Pos Motorik Kasar.
                </p>
              </div>

              <div className="bg-white/95 p-3 rounded-xl border border-[#B85627]/40 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#B85627] text-[11px]">08.24 (Pintu Pos A)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B85627]" />
                </div>
                <p className="text-[11px] text-[#B85627] font-bold">Handover 1</p>
                <p className="text-[10.5px] text-[#565C58] leading-snug">
                  Serahkan Kel. 1 ke SO 1, lalu sambut &amp; <strong className="text-[#486B5A]">Terima Kelompok 2</strong> dari SO 1 untuk diuji di Pos Motorik Kasar.
                </p>
              </div>

              <div className="bg-white/95 p-3 rounded-xl border border-[#B85627]/40 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#B85627] text-[11px]">08.36 (Jemput Kel. 3)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B85627]" />
                </div>
                <p className="text-[11px] text-[#B85627] font-bold">Handover 2</p>
                <p className="text-[10.5px] text-[#565C58] leading-snug">
                  Serahkan Kel. 2 ke SO 2. Segera jalan ke Pos Bahasa untuk <strong className="text-[#486B5A]">Jemput Kelompok 3</strong> bawa ke Pos Motorik Kasar.
                </p>
              </div>

              <div className="bg-white/95 p-3 rounded-xl border border-[#CBE0D4] space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#486B5A] text-[11px]">08.48 (Titik Akhir)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#486B5A]" />
                </div>
                <p className="text-[11px] text-[#22352B] font-bold">Antar ke Snack/Bermain</p>
                <p className="text-[10.5px] text-[#565C58] leading-snug">
                  Selesai uji Kelompok 3, <strong className="text-[#486B5A]">Antar Kelompok 3</strong> ke Area Bermain &amp; Snack di Titik Akhir.
                </p>
              </div>
            </div>
          </div>
        )}

        {posNumber === 1 && (
          <div className="bg-[#EFE7D6] rounded-2xl p-4 sm:p-5 border border-[#DDD0B8] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#DDD0B8]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7D5327] text-white flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                  <i className="mdi mdi-account-check-outline" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                    {currentSubrole === "so1"
                      ? "Tugas Anda: Super Observer 1 (Fokus Kelompok 2 ➔ Kelompok 1)"
                      : "Tugas Anda: Super Observer 2 (Fokus Kelompok 3 ➔ Kelompok 2)"}
                  </h3>
                  <p className="text-[11px] text-[#7D5327] font-bold">
                    Dampingi perpindahan antar-ruang &amp; catat kemandirian, emosi, dan kepatuhan instruksi secara bertahap.
                  </p>
                </div>
              </div>

              {/* Sub-role Quick Switch Pill */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/90 p-1 rounded-xl border border-[#DDD0B8] shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSubrole("so1");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("kalamula_evaluator_subrole", "so1");
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    currentSubrole === "so1"
                      ? "bg-[#7D5327] text-white shadow-2xs"
                      : "text-[#7D5327] hover:bg-[#FAF8F5]"
                  }`}
                >
                  SO 1 (Aktif)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSubrole("so2");
                    if (typeof window !== "undefined") {
                      localStorage.setItem("kalamula_evaluator_subrole", "so2");
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    currentSubrole === "so2"
                      ? "bg-[#7D5327] text-white shadow-2xs"
                      : "text-[#7D5327] hover:bg-[#FAF8F5]"
                  }`}
                >
                  Ganti ke SO 2
                </button>
              </div>
            </div>

            {/* Checklist SO 1 */}
            {currentSubrole === "so1" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.00 (Titik Awal)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Pandu Kelompok 2</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Amati berpisah dari ortu &amp; menaruh sepatu. <strong className="text-[#7D5327]">Dampingi Kelompok 2</strong> menuju Pos Bahasa &amp; Halus.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.12 - 08.24</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Amati di Pos Bahasa</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Amati ketertiban &amp; regulasi diri Kelompok 2 saat mendengarkan cerita dan menulis.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#B85627]/40 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#B85627] text-[11px]">08.24 (Pintu Pos A)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B85627]" />
                  </div>
                  <p className="text-[11px] text-[#B85627] font-bold">Switch ke Kelompok 1</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Antar Kel. 2 ke pintu Pos Motorik Kasar. Langsung <strong className="text-[#7D5327]">Jemput Kelompok 1</strong> bawa ke Pos Kognitif.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.36 - 08.48</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Dampingi Kelompok 1</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    <strong className="text-[#7D5327]">Dampingi Kelompok 1</strong> berpindah dari Pos Kognitif menuju Pos Bahasa &amp; Halus.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.48 (Titik Akhir)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Bermain &amp; Snack</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Dampingi Kel. 1 ke Area Bermain &amp; Snack. Amati interaksi sosial, berbagi alat main, dan refleksi belajar.
                  </p>
                </div>
              </div>
            )}

            {/* Checklist SO 2 */}
            {currentSubrole === "so2" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.00 (Titik Awal)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Pandu Kelompok 3</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Amati berpisah dari ortu &amp; menaruh sepatu. <strong className="text-[#7D5327]">Dampingi Kelompok 3</strong> menuju Pos Kematangan Kognitif.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.12 - 08.24</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Amati di Pos Kognitif</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Amati fokus &amp; kepatuhan instruksi Kelompok 3 saat aktivitas pola berulang dan kuantitas.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.24 - 08.36</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Dampingi Kelompok 3</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    <strong className="text-[#7D5327]">Dampingi Kelompok 3</strong> berpindah dari Pos Kognitif menuju Pos Bahasa &amp; Halus.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#B85627]/40 space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#B85627] text-[11px]">08.36 (Pintu Pos A)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B85627]" />
                  </div>
                  <p className="text-[11px] text-[#B85627] font-bold">Switch ke Kelompok 2</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Menuju depan pintu Pos Motorik Kasar. <strong className="text-[#7D5327]">Jemput Kelompok 2</strong> yang baru keluar dan bawa ke Pos Kognitif.
                  </p>
                </div>

                <div className="bg-white/95 p-3 rounded-xl border border-[#DDD0B8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#7D5327] text-[11px]">08.48 (Titik Akhir)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7D5327]" />
                  </div>
                  <p className="text-[11px] text-[#22352B] font-bold">Bermain &amp; Snack</p>
                  <p className="text-[10.5px] text-[#565C58] leading-snug">
                    Dampingi Kel. 2 ke Area Bermain &amp; Snack. Amati interaksi sosial, berbagi alat main, dan refleksi belajar.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {(posNumber === 3 || posNumber === 4) && (
          <div className="bg-[#E4EAF2] rounded-2xl p-4 border border-[#CBD8E5] shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#36506C] text-white flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                <i className="mdi mdi-door-closed" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#22352B]">
                  Peran Anda: Penguji Stasioner Ruangan
                </h3>
                <p className="text-[#36506C] font-semibold leading-relaxed">
                  Fokus menguji di dalam ruangan. Seluruh anak akan diantar dan dijemput langsung oleh SO 1, SO 2, atau Evaluator Motorik Kasar. Anda tidak perlu keluar ruangan.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#36506C] text-white shadow-2xs flex-shrink-0">
              Stasioner Di Ruangan
            </span>
          </div>
        )}

        {/* Responsive Toolbar: Pencarian, Kelompok, dan Filter Status */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Input pencarian */}
          <div className="relative flex-1 min-w-[200px] bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] px-3 py-1.5 flex items-center gap-2">
            <i className="mdi mdi-magnify text-base text-[#787F7A] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau No. Reg..."
              className="w-full text-base sm:text-xs bg-transparent text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#787F7A] hover:text-[#22352B] text-xs p-0.5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <i className="mdi mdi-close" />
              </button>
            )}
          </div>

          {/* Segmented Filter Kelompok */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D8] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedGroup("all")}
              className={`py-1 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap active:scale-[0.96] ${
                selectedGroup === "all"
                  ? "bg-[#22352B] text-white shadow-2xs"
                  : "text-[#565C58] hover:text-[#22352B] hover:bg-white"
              }`}
            >
              Semua Kelompok
            </button>
            {(["Kelompok 1", "Kelompok 2", "Kelompok 3"] as const).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap active:scale-[0.96] ${
                  selectedGroup === grp
                    ? "bg-[#B85627] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B] hover:bg-white"
                }`}
              >
                {grp.replace("Kelompok ", "Kel. ")}
              </button>
            ))}
          </div>

          {/* Filter Status Siswa */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "all"
                  ? "bg-[#486B5A] text-white shadow-2xs"
                  : "bg-[#FAF8F5] border border-[#E8E2D8] text-[#565C58] hover:bg-white"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("mandiri")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "mandiri"
                  ? "bg-[#486B5A] text-white shadow-2xs"
                  : "bg-[#FAF8F5] border border-[#E8E2D8] text-[#565C58] hover:bg-white"
              }`}
            >
              Mandiri
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("bimbingan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "bimbingan"
                  ? "bg-[#B85627] text-white shadow-2xs"
                  : "bg-[#FAF8F5] border border-[#E8E2D8] text-[#565C58] hover:bg-white"
              }`}
            >
              Perlu Bimbingan
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-white rounded-2xl border border-[#F1CFC0] text-center space-y-2 shadow-xs">
            <p className="text-sm font-bold text-[#8C3713]">Gagal memuat data observasi</p>
            <p className="text-xs text-[#565C58]">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-[#B85627] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-[0.96]"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Daftar Kartu Siswa */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl border border-[#E8E2D8] p-4.5 animate-pulse"
              />
            ))}
          </div>
        ) : !error && students.length === 0 ? (
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F6F2E9] border border-[#E8E2D8] flex items-center justify-center text-[#B85627]">
              <i className="mdi mdi-account-group-outline text-3xl" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#22352B]">
                Gelombang &ldquo;{batch?.batch_name}&rdquo; Belum Ada Siswa
              </p>
              <p className="text-xs text-[#565C58] mt-1 max-w-sm mx-auto leading-relaxed">
                Belum ada data siswa yang didaftarkan pada gelombang observasi ini.
              </p>
            </div>

            {/* Tombol Cepat Pindah ke Gelombang Lain yang Memiliki Siswa */}
            {batches.some((b) => b.id !== activeBatchId && (b.student_count ?? 0) > 0) && (
              <div className="pt-3 border-t border-[#E8E2D8]/60 space-y-2">
                <p className="text-[11px] font-bold text-[#787F7A]">
                  Pindah ke gelombang yang sudah berisi siswa:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {batches
                    .filter((b) => b.id !== activeBatchId && (b.student_count ?? 0) > 0)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleBatchChange(b.id)}
                        className="bg-[#E4EFE9] border border-[#CBE0D4] text-[#486B5A] hover:bg-[#D6E6DC] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.96]"
                      >
                        <i className="mdi mdi-swap-horizontal" />
                        <span>
                          {b.batch_name} ({b.student_count} Siswa)
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : !error && filteredStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs text-center space-y-1">
            <i className="mdi mdi-account-search-outline text-4xl text-[#787F7A]" />
            <p className="text-sm font-bold text-[#22352B]">Tidak ada siswa yang sesuai</p>
            <p className="text-xs text-[#565C58]">
              {searchQuery ? "Silakan coba kata kunci lain." : "Belum ada siswa pada kategori filter ini."}
            </p>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredStudents.map((student) => {
              const ev = getStudentEvaluation(student.id);
              const isComplete = Boolean(ev?.is_complete);
              const score = ev?.total_score || 0;
              const hasRedFlag = Boolean(ev?.has_red_flag);
              const isNeedsGuidance = isComplete && (score < 2.5 || hasRedFlag);
              const isMandiri = isComplete && !isNeedsGuidance;

              const targetUrl = `/evaluator/${posNumber}/${student.id}${
                activeBatchId ? `?batch=${activeBatchId}` : ""
              }`;

              if (isNeedsGuidance) {
                // Card Siswa Perlu Bimbingan: bg-[#FDF7F4] border border-[#F1CFC0]
                return (
                  <article
                    key={student.id}
                    onClick={() => router.push(targetUrl)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Buka observasi ${student.nickname || student.full_name}, status dengan bimbingan`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(targetUrl);
                      }
                    }}
                    className="bg-[#FDF7F4] border border-[#F1CFC0] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3 relative transition hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {/* Baris Atas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar Bulat #B85627 */}
                        <div className="w-11 h-11 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-2xs">
                          {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[#22352B] leading-tight truncate" title={student.nickname || student.full_name}>
                            {student.nickname || student.full_name}
                          </h3>
                          <p className="text-xs text-[#565C58] mt-0.5 truncate" title={student.full_name}>
                            {student.full_name}
                          </p>
                          <p className="text-[11px] text-[#787F7A] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                            {student.observation_group && (
                              <span className="font-bold text-[#7D5327]">
                                {student.observation_group}
                              </span>
                            )}
                            {student.observation_group && <span>&bull;</span>}
                            <span>{calculateAge(student.birth_date)}</span>
                            <span>&bull;</span>
                            <span className="font-mono tabular-nums text-[#8C3713]">
                              Skor: {score.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Lingkaran Ceklis Peach di Kanan Atas */}
                      <div className="w-7 h-7 rounded-full bg-[#F9E6DC] text-[#8C3713] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <i className="mdi mdi-check text-base font-bold" />
                      </div>
                    </div>

                    {/* Baris Bawah */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#F2DDD2]">
                      <span className="bg-[#F9E6DC] text-[#8C3713] text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                        <i className="mdi mdi-heart-outline text-xs" />
                        <span>Dengan Bimbingan</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(targetUrl);
                        }}
                        className="bg-[#F9E6DC] text-[#8C3713] hover:bg-[#F2D7CA] text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span>Lihat Jurnal</span>
                        <i className="mdi mdi-chevron-right text-sm" />
                      </button>
                    </div>
                  </article>
                );
              }

              if (isMandiri) {
                // Card Siswa Mandiri: bg-white
                return (
                  <article
                    key={student.id}
                    onClick={() => router.push(targetUrl)}
                    tabIndex={0}
                    role="link"
                    aria-label={`Buka observasi ${student.nickname || student.full_name}, status mandiri dan konsisten`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(targetUrl);
                      }
                    }}
                    className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3 relative transition hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {/* Baris Atas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar Bulat #486B5A */}
                        <div className="w-11 h-11 rounded-full bg-[#486B5A] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-2xs">
                          {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[#22352B] leading-tight truncate" title={student.nickname || student.full_name}>
                            {student.nickname || student.full_name}
                          </h3>
                          <p className="text-xs text-[#565C58] mt-0.5 truncate" title={student.full_name}>
                            {student.full_name}
                          </p>
                          <p className="text-[11px] text-[#787F7A] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                            {student.observation_group && (
                              <span className="font-bold text-[#486B5A]">
                                {student.observation_group}
                              </span>
                            )}
                            {student.observation_group && <span>&bull;</span>}
                            <span>{calculateAge(student.birth_date)}</span>
                            <span>&bull;</span>
                            <span className="font-mono tabular-nums text-[#486B5A]">
                              Skor: {score.toFixed(1)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Lingkaran Ceklis Hijau Lembut di Kanan Atas */}
                      <div className="w-7 h-7 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <i className="mdi mdi-check text-base font-bold" />
                      </div>
                    </div>

                    {/* Baris Bawah */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#FAF8F5]">
                      <span className="bg-[#E4EFE9] text-[#22352B] text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                        <i className="mdi mdi-shield-check-outline text-[#486B5A] text-xs" />
                        <span>Mandiri &amp; Konsisten</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(targetUrl);
                        }}
                        className="bg-[#F3EFE6] text-[#22352B] hover:bg-[#EAE4D8] text-xs font-bold px-3 py-1 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span>Lihat Jurnal</span>
                        <i className="mdi mdi-chevron-right text-sm" />
                      </button>
                    </div>
                  </article>
                );
              }

              // Card Siswa Belum Diobservasi
              return (
                <article
                  key={student.id}
                  onClick={() => router.push(targetUrl)}
                  tabIndex={0}
                  role="link"
                  aria-label={`Buka observasi ${student.nickname || student.full_name}, status belum observasi`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(targetUrl);
                    }
                  }}
                  className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-3 relative transition hover:-translate-y-0.5 hover:shadow-xs cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* Baris Atas */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#EFECE4] text-[#787F7A] flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
                        {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#22352B] leading-tight truncate" title={student.nickname || student.full_name}>
                          {student.nickname || student.full_name}
                        </h3>
                        <p className="text-xs text-[#565C58] mt-0.5 truncate" title={student.full_name}>
                          {student.full_name}
                        </p>
                        <p className="text-[11px] text-[#787F7A] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                          {student.observation_group && (
                            <span className="font-bold text-[#7D5327]">
                              {student.observation_group}
                            </span>
                          )}
                          {student.observation_group && <span>&bull;</span>}
                          <span>{calculateAge(student.birth_date)}</span>
                        </p>
                      </div>
                    </div>

                    <span className="bg-[#FAF8F5] text-[#787F7A] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border border-[#E8E2D8]">
                      Belum Observasi
                    </span>
                  </div>

                  {/* Baris Bawah */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#FAF8F5]">
                    <span className="text-[11px] text-[#787F7A] font-mono tabular-nums">
                      No: {student.registration_no}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(targetUrl);
                      }}
                      className="bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <i className="mdi mdi-pencil-outline text-xs" />
                      <span>Catat Observasi</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
