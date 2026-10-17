"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Student, Evaluation, AssessmentConfig, Batch } from "@/types";

export default function EvaluatorStudentListPage() {
  const params = useParams();
  const router = useRouter();
  const posNumber = Number(params.pos);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mandiri" | "bimbingan">("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [showRotationGuide, setShowRotationGuide] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get active batch
      const batchRes = await fetch("/api/batches");
      if (!batchRes.ok) throw new Error("Gagal mengambil data gelombang");

      const batchData = await batchRes.json();
      const activeBatch =
        (batchData.data || []).find((b: { status: string }) => b.status === "active") ||
        batchData.data?.[0];

      if (activeBatch) {
        setBatch(activeBatch);
        setActiveBatchId(activeBatch.id);

        // Load students for this batch
        const sRes = await fetch(`/api/students?batch_id=${activeBatch.id}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setStudents(sData.data || []);
        } else {
          throw new Error("Gagal mengambil daftar siswa");
        }

        // Load evaluations for this batch & pos
        const eRes = await fetch(
          `/api/evaluations?batch_id=${activeBatch.id}&pos_number=${posNumber}`
        );
        if (eRes.ok) {
          const eData = await eRes.json();
          setEvaluations(eData.data || []);
        }
      }

      // Load config for this pos
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
  }, [posNumber]);

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
      name: "Kedatangan, Emosi & Super Observer 1",
      focus: "Kemandirian berpisah, adab antrean & pandu Kel. 2",
      role: "Super Observer 1 (Pos 1, 3, 4, 5)",
    },
    2: {
      name: "Motorik Kasar & Koordinasi Fisik",
      focus: "Keseimbangan meniti, lempar tangkap & jemput Kel. 1",
      role: "Station Evaluator (Pos 2) + Escort",
    },
    3: {
      name: "Kematangan Kognitif & Berhitung",
      focus: "Pola bentuk, warna, klasifikasi & logika kuantitas (12 mnt)",
      role: "Station Evaluator (Pos 3)",
    },
    4: {
      name: "Bahasa Lisan, Pra-Literasi & Motorik Halus",
      focus: "Pemahaman cerita, kemampuan bicara & tripod grasp",
      role: "Station Evaluator (Pos 4)",
    },
    5: {
      name: "Bermain Bebas, Snack & Super Observer 2",
      focus: "Interaksi sosial, regulasi emosi & snack break santai (12 mnt)",
      role: "Super Observer 2 (Pos 1, 3, 4, 5)",
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
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/evaluator"
            className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-xs"
          >
            <i className="mdi mdi-chevron-left text-base" />
            <span>Ganti Pos</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/reports/rubric/${posNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E8E2D8] text-[#B85627] hover:bg-[#FAF8F5] px-3.5 py-1.5 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs"
              title="Cetak Lembar Observasi Fisik Pos"
            >
              <i className="mdi mdi-printer-outline text-base" />
              <span className="hidden sm:inline">Cetak Lembar Pos</span>
              <span className="sm:hidden">Cetak</span>
            </Link>

            {(posNumber === 1 || posNumber === 5) && (
              <Link
                href="/reports/rubric/so"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#E4EFE9] border border-[#CBE0D4] text-[#486B5A] hover:bg-[#D6E6DC] px-3 py-1.5 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs"
                title="Cetak Lembar Super Observer Terpadu (Pos 1, 3, 4, 5)"
              >
                <i className="mdi mdi-eye-check-outline text-base" />
                <span className="hidden sm:inline">Lembar Super Observer</span>
                <span className="sm:hidden">SO</span>
              </Link>
            )}

            <div className="bg-[#E4EFE9] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#486B5A] animate-pulse" />
              <span>Pos {posNumber} Aktif</span>
            </div>
          </div>
        </div>

        {/* Banner Hero Pos Aktif (Solid Terracotta #B85627) */}
        <div className="bg-[#B85627] rounded-3xl p-5 shadow-sm text-white space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="bg-white/20 text-white font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  POS {posNumber}
                </span>
                {POS_METADATA[posNumber]?.role && (
                  <span className="bg-[#FAF8F5] text-[#22352B] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                    {POS_METADATA[posNumber].role}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-extrabold text-white leading-tight">
                {config?.pos_name || POS_METADATA[posNumber]?.name || "Pos Observasi"}
              </h1>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {batch?.batch_name || "Batch 1 (TP 2026/2027)"} &bull; {POS_METADATA[posNumber]?.focus}
              </p>
              {posNumber === 5 && (
                <div className="bg-white/15 border border-white/25 rounded-2xl p-2.5 mt-2 text-[11px] text-white leading-relaxed">
                  <i className="mdi mdi-cookie-clock-outline mr-1.5" />
                  <strong>Sesi Istirahat &amp; Bermain Bebas:</strong> Anak diperkenankan minum &amp; snack sambil bermain. Observasi interaksi dan regulasi diri tetap dicatat secara rileks.
                </div>
              )}
            </div>
            <span className="bg-white/20 text-white font-extrabold px-3 py-1 rounded-full text-xs flex-shrink-0 shadow-2xs">
              {completionStats.percent}% Selesai
            </span>
          </div>

          {/* 3 Kotak Statistik */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* TOTAL */}
            <div className="bg-white/15 text-white rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block">
                TOTAL
              </span>
              <span className="text-2xl font-black text-white leading-none mt-1 block">
                {completionStats.total}
              </span>
            </div>

            {/* SELESAI (Putih Solid) */}
            <div className="bg-white text-[#486B5A] rounded-2xl p-3 text-center shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#486B5A] block">
                SELESAI
              </span>
              <span className="text-2xl font-black text-[#486B5A] leading-none mt-1 block">
                {completionStats.completed}
              </span>
            </div>

            {/* MENUNGGU */}
            <div className="bg-white/15 text-white rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block">
                MENUNGGU
              </span>
              <span className="text-2xl font-black text-white leading-none mt-1 block">
                {completionStats.pending}
              </span>
            </div>
          </div>
        </div>

        {/* Panduan Rotasi 12 Menit & Super Observer (Collapsible) */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRotationGuide(!showRotationGuide)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                <i className="mdi mdi-clock-time-four-outline text-lg" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#22352B] block">
                  Matriks Rotasi 12 Menit &bull; Waktu Total 60 Menit
                </span>
                <span className="text-[11px] text-[#565C58]">
                  Peran Super Observer (Pos 1, 3, 4, 5) &amp; Penjemputan Pos 2
                </span>
              </div>
            </div>
            <i
              className={`mdi mdi-chevron-down text-xl text-[#787F7A] transition-transform duration-200 ${
                showRotationGuide ? "rotate-180 text-[#22352B]" : ""
              }`}
            />
          </button>

          {showRotationGuide && (
            <div className="p-4 pt-1 space-y-3 border-t border-[#FAF8F5] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] space-y-1">
                  <span className="font-extrabold text-[#7D5327] block text-[11px]">
                    KELOMPOK 1 (Dijemput Pos 2)
                  </span>
                  <p className="text-[11px] text-[#565C58] leading-tight">
                    Pos 1 (08.00) &rarr; <strong className="text-[#486B5A]">Pos 2</strong> (08.12, dijemput Eval 2) &rarr; Pos 3 (08.24) &rarr; Pos 4 (08.36) &rarr; <strong className="text-[#B85627]">Pos 5</strong> (08.48, snack &amp; free play)
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] space-y-1">
                  <span className="font-extrabold text-[#36506C] block text-[11px]">
                    KELOMPOK 2 (Dipandu SO 1)
                  </span>
                  <p className="text-[11px] text-[#565C58] leading-tight">
                    Pos 1 (08.00) &rarr; Pos 3 (08.12) &rarr; Pos 4 (08.24) &rarr; <strong className="text-[#486B5A]">Pos 2</strong> (08.36, switch observer) &rarr; Pos 5 (08.48)
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E2D8] space-y-1">
                  <span className="font-extrabold text-[#8C3713] block text-[11px]">
                    KELOMPOK 3 (Dipandu SO 2)
                  </span>
                  <p className="text-[11px] text-[#565C58] leading-tight">
                    Pos 1 (08.00) &rarr; Pos 4 (08.12) &rarr; <strong className="text-[#486B5A]">Pos 2</strong> (08.24, switch observer) &rarr; Pos 3 (08.36) &rarr; Pos 5 (08.48)
                  </p>
                </div>
              </div>

              <div className="bg-[#E4EFE9] text-[#22352B] p-3 rounded-2xl border border-[#CBE0D4] space-y-1">
                <p className="text-[11px] font-bold flex items-center gap-1.5 text-[#486B5A]">
                  <i className="mdi mdi-information-outline text-base" />
                  <span>Aturan Operasional Super Observer &amp; Penjemputan:</span>
                </p>
                <ul className="list-disc pl-5 text-[10.5px] text-[#565C58] space-y-0.5">
                  <li><strong>Super Observer (SO 1 &amp; SO 2)</strong> mengamati secara kontinu di <strong>Pos 1, 3, 4, 5</strong> (TIDAK mengamati Pos 2).</li>
                  <li><strong>Evaluator Pos 2</strong> menjemput Kelompok 1 di Pos 1 setelah pembagian name tag (08.12) dan mengantar anak selesai Pos 2 ke Pos 5.</li>
                  <li><strong>Pos 5 (Selesai 09.00)</strong> dihandle oleh Super Observer sambil anak santai menikmati snack sebelum observasi klasikal psikolog.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Segmented Filter Kelompok */}
        <div className="bg-white p-1 rounded-2xl border border-[#E8E2D8] flex items-center gap-1 shadow-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedGroup("all")}
            className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
              selectedGroup === "all"
                ? "bg-[#22352B] text-white shadow-xs"
                : "text-[#565C58] hover:text-[#22352B] hover:bg-[#FAF8F5]"
            }`}
          >
            Semua
          </button>
          {(["Kelompok 1", "Kelompok 2", "Kelompok 3"] as const).map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className={`flex-1 min-w-[85px] py-1.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center whitespace-nowrap ${
                selectedGroup === grp
                  ? "bg-[#B85627] text-white shadow-xs"
                  : "text-[#565C58] hover:text-[#22352B] hover:bg-[#FAF8F5]"
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {/* Kolom Pencarian & Filter Proporsional */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {/* Input pencarian kapsul penuh */}
          <div className="relative flex-1 bg-white rounded-full border border-[#E8E2D8] shadow-xs px-3.5 py-2 flex items-center gap-2">
            <i className="mdi mdi-magnify text-lg text-[#787F7A] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full text-xs bg-transparent text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#787F7A] hover:text-[#22352B] text-xs p-1"
                aria-label="Hapus pencarian"
              >
                <i className="mdi mdi-close" />
              </button>
            )}
          </div>

          {/* 3 Tombol Filter Proporsional */}
          <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                filterTab === "all"
                  ? "bg-[#486B5A] text-white shadow-xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:bg-[#FAF8F5]"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("mandiri")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                filterTab === "mandiri"
                  ? "bg-[#486B5A] text-white shadow-xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:bg-[#FAF8F5]"
              }`}
            >
              Mandiri
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("bimbingan")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                filterTab === "bimbingan"
                  ? "bg-[#486B5A] text-white shadow-xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:bg-[#FAF8F5]"
              }`}
            >
              Perlu Bimbingan
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-white rounded-3xl border border-[#F1CFC0] text-center space-y-2 shadow-xs">
            <p className="text-sm font-bold text-[#8C3713]">Gagal memuat data observasi</p>
            <p className="text-xs text-[#565C58]">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-[#B85627] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Daftar Kartu Siswa */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-[1.85rem] border border-[#E8E2D8] p-4.5 animate-pulse"
              />
            ))}
          </div>
        ) : !error && filteredStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-[#E8E2D8] shadow-xs text-center space-y-1">
            <i className="mdi mdi-account-search-outline text-4xl text-[#787F7A]" />
            <p className="text-sm font-bold text-[#22352B]">Tidak ada siswa yang sesuai</p>
            <p className="text-xs text-[#565C58]">
              {searchQuery ? "Silakan coba kata kunci lain." : "Belum ada siswa pada kategori filter ini."}
            </p>
          </div>
        ) : !error && (
          <div className="space-y-3">
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
                    className="bg-[#FDF7F4] border border-[#F1CFC0] rounded-[1.85rem] p-4.5 shadow-sm flex flex-col justify-between gap-3.5 relative transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.99]"
                  >
                    {/* Baris Atas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar Bulat #B85627 */}
                        <div className="w-12 h-12 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-2xs">
                          {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-extrabold text-[#22352B] leading-tight truncate">
                            {student.nickname || student.full_name}
                          </h3>
                          <p className="text-xs text-[#565C58] mt-0.5 truncate">
                            {student.full_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="bg-[#F9E6DC] text-[#8C3713] text-[11px] font-bold px-2 py-0.5 rounded-full inline-block">
                              {calculateAge(student.birth_date)}
                            </span>
                            {student.observation_group && (
                              <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                <i className="mdi mdi-account-group text-xs" />
                                <span>{student.observation_group}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lingkaran Ceklis Peach di Kanan Atas */}
                      <div className="w-8 h-8 rounded-full bg-[#F9E6DC] text-[#8C3713] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <i className="mdi mdi-check text-lg font-bold" />
                      </div>
                    </div>

                    {/* Baris Bawah */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F2DDD2]">
                      <span className="bg-[#F9E6DC] text-[#8C3713] text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                        <i className="mdi mdi-heart-outline text-[#8C3713] text-sm" />
                        <span>Dengan Bimbingan</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(targetUrl);
                        }}
                        className="bg-[#F9E6DC] text-[#8C3713] hover:bg-[#F2D7CA] text-xs font-extrabold px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>Lihat Jurnal</span>
                        <i className="mdi mdi-chevron-right text-base" />
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
                    className="bg-white border border-[#E8E2D8]/60 rounded-[1.85rem] p-4.5 shadow-sm flex flex-col justify-between gap-3.5 relative transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.99]"
                  >
                    {/* Baris Atas */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar Bulat #486B5A */}
                        <div className="w-12 h-12 rounded-full bg-[#486B5A] text-white flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-2xs">
                          {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-extrabold text-[#22352B] leading-tight truncate">
                            {student.nickname || student.full_name}
                          </h3>
                          <p className="text-xs text-[#565C58] mt-0.5 truncate">
                            {student.full_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="bg-[#EFECE4] text-[#22352B] text-[11px] font-bold px-2 py-0.5 rounded-full inline-block">
                              {calculateAge(student.birth_date)}
                            </span>
                            {student.observation_group && (
                              <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                <i className="mdi mdi-account-group text-xs" />
                                <span>{student.observation_group}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lingkaran Ceklis Hijau Lembut di Kanan Atas */}
                      <div className="w-8 h-8 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <i className="mdi mdi-check text-lg font-bold" />
                      </div>
                    </div>

                    {/* Baris Bawah */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#FAF8F5]">
                      <span className="bg-[#E4EFE9] text-[#22352B] text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                        <i className="mdi mdi-shield-check-outline text-[#486B5A] text-sm" />
                        <span>Mandiri &amp; Konsisten</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(targetUrl);
                        }}
                        className="bg-[#F3EFE6] text-[#22352B] hover:bg-[#EAE4D8] text-xs font-extrabold px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>Lihat Jurnal</span>
                        <i className="mdi mdi-chevron-right text-base" />
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
                  className="bg-white border border-[#E8E2D8]/60 rounded-[1.85rem] p-4.5 shadow-sm flex flex-col justify-between gap-3.5 relative transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.99]"
                >
                  {/* Baris Atas */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[#EFECE4] text-[#787F7A] flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-2xs">
                        {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-extrabold text-[#22352B] leading-tight truncate">
                          {student.nickname || student.full_name}
                        </h3>
                        <p className="text-xs text-[#565C58] mt-0.5 truncate">
                          {student.full_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="bg-[#EFECE4] text-[#787F7A] text-[11px] font-bold px-2 py-0.5 rounded-full inline-block">
                            {calculateAge(student.birth_date)}
                          </span>
                          {student.observation_group && (
                            <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                              <i className="mdi mdi-account-group text-xs" />
                              <span>{student.observation_group}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="bg-[#FAF8F5] text-[#787F7A] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E8E2D8]">
                      Belum Observasi
                    </span>
                  </div>

                  {/* Baris Bawah */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#FAF8F5]">
                    <span className="text-[11px] text-[#787F7A] font-medium">
                      No. Reg: {student.registration_no}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(targetUrl);
                      }}
                      className="bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-extrabold px-4 py-1.5 rounded-full transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <i className="mdi mdi-pencil-outline text-sm" />
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
