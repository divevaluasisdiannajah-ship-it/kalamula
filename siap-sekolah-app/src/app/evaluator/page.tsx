"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Batch } from "@/types";

interface PosInfo {
  name: string;
  roleBadge: string;
  roleBadgeColor: string;
  evaluatorNames: string;
  desc: string;
  mdiIcon: string;
  isSo: boolean;
}

const POS_DETAILS: Record<number, PosInfo> = {
  1: {
    name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    roleBadge: "Super Observer (SO 1 & SO 2)",
    roleBadgeColor: "bg-[#FAF0E8] text-[#9C4322] border-[#F2D8C7]",
    evaluatorNames: "Ahmad Furqoni, S. Pd & Novia Permatasari, S. Pd",
    desc: "Amati kedatangan di titik awal, dampingi transisi rotasi 3 pos, hingga bermain bebas & snack break.",
    mdiIcon: "mdi-account-check-outline",
    isSo: true,
  },
  2: {
    name: "Pos Motorik Kasar & Koordinasi Fisik",
    roleBadge: "Pos A (Motorik) + Escort",
    roleBadgeColor: "bg-[#F0F4F1] text-[#385642] border-[#D5E3DA]",
    evaluatorNames: "Rifky Delsandi Rifai, S. Pd",
    desc: "Jemput Kelompok 1 di titik awal, uji keseimbangan & tangkap bola, jemput Kelompok 3 di Pos Bahasa.",
    mdiIcon: "mdi-run-fast",
    isSo: false,
  },
  3: {
    name: "Pos Kematangan Kognitif & Berhitung",
    roleBadge: "Pos B (Kognitif)",
    roleBadgeColor: "bg-[#F0F4F1] text-[#385642] border-[#D5E3DA]",
    evaluatorNames: "Shalma Ruhail Maldova, S. Pd",
    desc: "Klasifikasi objek, logika pola berulang, perbandingan kuantitas & problem solving balok.",
    mdiIcon: "mdi-head-lightbulb-outline",
    isSo: false,
  },
  4: {
    name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
    roleBadge: "Pos C (Bahasa & Halus)",
    roleBadgeColor: "bg-[#F0F4F1] text-[#385642] border-[#D5E3DA]",
    evaluatorNames: "Susmurtiningsih, S. Pd",
    desc: "Menyimak cerita lisan (read-aloud), komunikasi verbal ide, & kontrol genggaman pensil (tripod grasp).",
    mdiIcon: "mdi-book-open-page-variant-outline",
    isSo: false,
  },
};

export default function EvaluatorLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [activePos, setActivePos] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [soRole, setSoRole] = useState<"so1" | "so2">("so1");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [posFilter, setPosFilter] = useState<"all" | "so" | "posA" | "posB" | "posC">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/batches");
        if (res.ok) {
          const json = await res.json();
          const list: Batch[] = json.data || [];
          setBatches(list);
          if (list.length > 0) {
            const saved =
              typeof window !== "undefined"
                ? localStorage.getItem("kalamula_evaluator_batch_id")
                : null;
            const chosen =
              list.find((b) => b.id === saved) ||
              list.find((b) => b.status === "active" && (b.student_count || 0) > 0) ||
              list.find((b) => (b.student_count || 0) > 0) ||
              list.find((b) => b.status === "active") ||
              list[0];
            setSelectedBatchId(chosen.id);
            if (typeof window !== "undefined") {
              localStorage.setItem("kalamula_evaluator_batch_id", chosen.id);
            }
          }
        }
      } catch {
        // network prefetch fail-safe
      }
    }
    loadBatches();
  }, []);

  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  // Modal open with smooth in-transition
  const openPinModal = useCallback((pos: number) => {
    setActivePos(pos);
    setPin("");
    setError("");
    setIsModalOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });
  }, []);

  // Modal close with smooth out-transition
  const closePinModal = useCallback(() => {
    if (loading) return;
    setIsModalVisible(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setActivePos(null);
      setPin("");
      setError("");
    }, 250);
  }, [loading]);

  // Lock body scroll when popup is active
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const submitLogin = useCallback(
    async (pinValue: string, pos: number) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pinValue, pos_number: pos }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("session", JSON.stringify(data.data.session));
          localStorage.setItem("token", data.data.token);
          if (pos === 1) {
            localStorage.setItem("kalamula_evaluator_subrole", soRole);
          }
          const subroleParam = pos === 1 ? `&subrole=${soRole}` : "";
          if (selectedBatchId) {
            localStorage.setItem("kalamula_evaluator_batch_id", selectedBatchId);
            router.push(`/evaluator/${pos}?batch_id=${selectedBatchId}${subroleParam}`);
          } else {
            router.push(`/evaluator/${pos}${subroleParam ? `?${subroleParam.slice(1)}` : ""}`);
          }
        } else {
          setError("PIN salah. Silakan coba lagi.");
          setPin("");
        }
      } catch {
        setError("Koneksi gagal. Periksa jaringan Anda.");
        setPin("");
      } finally {
        setLoading(false);
      }
    },
    [router, selectedBatchId, soRole]
  );

  const handlePinInput = useCallback((digit: string) => {
    if (loading || !activePos) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        submitLogin(newPin, activePos);
      }
    }
  }, [pin, activePos, loading, submitLogin]);

  const handleDelete = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, [loading]);

  // Physical keyboard support when modal is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || !isModalVisible) return;
      if (e.key >= "0" && e.key <= "9") {
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        closePinModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isModalVisible, handlePinInput, handleDelete, closePinModal]);

  const filteredPosList = useMemo(() => {
    return [1, 2, 3, 4].filter((pos) => {
      if (posFilter === "all") return true;
      if (posFilter === "so") return pos === 1;
      if (posFilter === "posA") return pos === 2;
      if (posFilter === "posB") return pos === 3;
      if (posFilter === "posC") return pos === 4;
      return true;
    });
  }, [posFilter]);

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-16 font-sans">
      <div className="p-4 sm:p-6 max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96]"
          >
            <i className="mdi mdi-chevron-left text-base" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D8] px-3 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#385642] animate-pulse" />
            <span className="text-[#385642] text-[11px] font-extrabold uppercase tracking-wide">
              Online
            </span>
          </div>
        </div>

        {/* Hero Banner: Deep Forest Pine (#385642) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#385642] to-[#2D4535] rounded-3xl p-5 sm:p-6 text-white shadow-sm space-y-4">
          {/* Top Row: Icon + Portal Badge + Title + Subtitle */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 text-2xl shadow-inner border border-white/10">
              <i className="mdi mdi-shield-account-outline" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="bg-white/20 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-block">
                PORTAL EVALUATOR
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Ruang Observasi SPMB
              </h1>
              <p className="text-xs text-white/85 font-normal leading-relaxed">
                Pilih pos observasi dan masukkan 4 digit PIN tugas Anda.
              </p>
            </div>
          </div>

          {/* Active Batch Strip */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/75">
              GELOMBANG OBSERVASI AKTIF
            </p>
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 flex items-center justify-between text-[#22352B] shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#385642] flex items-center justify-center flex-shrink-0">
                  <i className="mdi mdi-calendar-check text-lg" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#22352B] truncate block">
                    {currentBatch ? `${currentBatch.batch_name} (${currentBatch.student_count ?? 0} Siswa)` : "Pilih Gelombang"}
                  </span>
                </div>
              </div>

              {batches.length > 1 && (
                <div className="flex-shrink-0">
                  <label htmlFor="batch-hero-select" className="sr-only">
                    Pilih Gelombang
                  </label>
                  <select
                    id="batch-hero-select"
                    value={selectedBatchId}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kalamula_evaluator_batch_id", e.target.value);
                      }
                    }}
                    className="bg-[#FAF8F5] border border-[#DDD0B8] text-[#22352B] font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#385642] cursor-pointer"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_name} ({b.student_count ?? 0} Siswa)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Card 1: Total Pos */}
            <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10 flex flex-col justify-center items-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/80 block">
                TOTAL POS
              </span>
              <span className="text-2xl font-black text-white leading-tight font-mono tabular-nums">
                4
              </span>
            </div>

            {/* Card 2: Peserta (Highlighted Solid White Card) */}
            <div className="bg-white rounded-2xl p-3 text-center shadow-xs flex flex-col justify-center items-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#385642]/80 block">
                PESERTA
              </span>
              <span className="text-2xl font-black text-[#385642] leading-tight font-mono tabular-nums">
                {currentBatch?.student_count ?? 0}
              </span>
            </div>

            {/* Card 3: Status */}
            <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10 flex flex-col justify-center items-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/80 block">
                STATUS
              </span>
              <span className="text-base sm:text-lg font-black text-white leading-tight tracking-wide">
                AKTIF
              </span>
            </div>
          </div>
        </div>

        {/* Section Header & Filter Chips */}
        <div className="space-y-3 pt-1">
          <div className="space-y-0.5 px-0.5">
            <h2 className="text-xs sm:text-sm font-black text-[#22352B] uppercase tracking-wider">
              PILIH RUANG &amp; DOMAIN OBSERVASI
            </h2>
            <p className="text-[11px] text-[#787F7A]">
              Ketuk kartu pos untuk verifikasi PIN &amp; mulai menilai
            </p>
          </div>

          {/* Filter Chips Horizontal Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Filter Pos Observasi">
            <button
              type="button"
              role="tab"
              aria-selected={posFilter === "all"}
              onClick={() => setPosFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                posFilter === "all"
                  ? "bg-[#9C4322] text-white shadow-2xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#9C4322]/40"
              }`}
            >
              Semua Pos (4)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={posFilter === "so"}
              onClick={() => setPosFilter("so")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                posFilter === "so"
                  ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#9C4322]/40"
              }`}
            >
              Super Observer (1)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={posFilter === "posA"}
              onClick={() => setPosFilter("posA")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                posFilter === "posA"
                  ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#9C4322]/40"
              }`}
            >
              Pos A (Motorik)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={posFilter === "posB"}
              onClick={() => setPosFilter("posB")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                posFilter === "posB"
                  ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#9C4322]/40"
              }`}
            >
              Pos B (Kognitif)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={posFilter === "posC"}
              onClick={() => setPosFilter("posC")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                posFilter === "posC"
                  ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#9C4322]/40"
              }`}
            >
              Pos C (Bahasa)
            </button>
          </div>

          {/* Pos Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1" role="group" aria-label="Daftar Ruang Observasi">
            {filteredPosList.map((pos) => {
              const details = POS_DETAILS[pos];
              const isSo = details.isSo;

              return (
                <div
                  key={pos}
                  onClick={() => openPinModal(pos)}
                  className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-xs hover:border-[#9C4322]/40 hover:shadow-md transition-all text-left flex flex-col justify-between gap-4 group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPinModal(pos);
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      {/* Circular avatar: Terracotta for SO, Soft sage for Pos A, B, C */}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                          isSo
                            ? "bg-[#9C4322] text-white"
                            : "bg-[#E4EFE9] text-[#385642]"
                        }`}
                      >
                        <i className={`mdi ${details.mdiIcon} text-xl`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mb-1 ${details.roleBadgeColor}`}
                        >
                          {details.roleBadge}
                        </span>
                        <h3 className="text-sm font-extrabold text-[#22352B] group-hover:text-[#9C4322] transition-colors leading-snug">
                          {details.name}
                        </h3>
                        <p className="text-[11px] font-semibold text-[#385642] mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#385642]" />
                          <span>{details.evaluatorNames}</span>
                        </p>
                        <p className="text-xs text-[#565C58] mt-2 font-normal leading-relaxed">
                          {details.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="pt-3 border-t border-[#F6F2E9] flex items-center justify-between gap-2">
                    {/* Left pill */}
                    {isSo ? (
                      <span className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] rounded-full px-3 py-1 text-[11px] font-bold inline-flex items-center gap-1.5">
                        <i className="mdi mdi-shield-key-outline text-xs" />
                        <span>Wajib PIN Tugas</span>
                      </span>
                    ) : (
                      <span className="bg-[#FAF8F5] text-[#787F7A] border border-[#E8E2D8] rounded-full px-3 py-1 text-[11px] font-bold inline-flex items-center gap-1.5">
                        <i className="mdi mdi-key-outline text-xs" />
                        <span>PIN 4 Digit</span>
                      </span>
                    )}

                    {/* Right Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPinModal(pos);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                        isSo
                          ? "bg-[#9C4322] hover:bg-[#85371B] text-white"
                          : "bg-[#ECE7DF] hover:bg-[#9C4322] hover:text-white text-[#4A4F4C]"
                      }`}
                    >
                      <span>Masuk &amp; Verifikasi PIN</span>
                      <i className="mdi mdi-chevron-right text-sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Link: Cetak Lembar Observasi Fisik Lapangan */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs space-y-3.5 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E4EFE9] text-[#385642] flex items-center justify-center flex-shrink-0">
              <i className="mdi mdi-printer-outline text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#22352B]">Lembar Cetak Observasi Fisik</h3>
              <p className="text-[11px] text-[#787F7A] font-normal">Format matriks observasi lapangan cadangan / manual</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Link
              href={`/reports/rubric/so${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#E4EFE9] hover:bg-[#D4E6DC] text-[#385642] border border-[#CBE0D4] px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-eye-check-outline" />
              <span>SO Terpadu</span>
            </Link>
            <Link
              href={`/reports/rubric/2${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF0E8] hover:bg-[#F2DFD3] text-[#9C4322] border border-[#F2D8C7] px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-run-fast" />
              <span>Pos A (Motorik)</span>
            </Link>
            <Link
              href={`/reports/rubric/3${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-head-lightbulb-outline text-[#385642]" />
              <span>Pos B (Kognitif)</span>
            </Link>
            <Link
              href={`/reports/rubric/4${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-book-open-page-variant-outline text-[#385642]" />
              <span>Pos C (Bahasa)</span>
            </Link>
          </div>

          {/* Banner Khusus: Buku Panduan & Rubrik Lengkap Semua Pos (Siap Cetak) */}
          <div className="pt-2 border-t border-[#F6F2E9]">
            <Link
              href="/reports/rubric/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#FAF0E8] hover:bg-[#F5E6DC] text-[#9C4322] border border-[#F2D8C7] p-3 rounded-2xl font-extrabold transition flex items-center justify-between gap-3 text-xs shadow-2xs active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9C4322] text-white flex items-center justify-center text-base shadow-xs flex-shrink-0">
                  <i className="mdi mdi-book-open-page-variant" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-[#22352B] text-xs sm:text-sm">
                    Buku Panduan &amp; Rubrik Asesmen Lengkap Semua Pos (Siap Cetak A4)
                  </span>
                  <span className="block text-[10.5px] text-[#787F7A] font-normal">
                    Lengkap dengan SOP alur rotasi, indikator 6 fondasi, rubrik deskriptor skala 1-3, dan lembar pengesahan
                  </span>
                </div>
              </div>
              <span className="bg-white text-[#9C4322] px-3 py-1.5 rounded-xl text-[11px] font-black border border-[#F2D8C7] flex items-center gap-1 shadow-2xs flex-shrink-0">
                <span>Buka Buku Panduan</span>
                <i className="mdi mdi-open-in-new text-xs" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── POPUP MODAL VERIFIKASI PIN (Smooth In-Out Transition) ─── */}
      {isModalOpen && activePos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-modal-title"
        >
          {/* Backdrop with smooth opacity transition */}
          <div
            className={`fixed inset-0 bg-[#22352B]/60 backdrop-blur-xs transition-opacity duration-250 ease-out ${
              isModalVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closePinModal}
            aria-hidden="true"
          />

          {/* Modal Container with smooth scale, opacity & translateY transition */}
          <div
            className={`relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto transform transition-all duration-250 ease-out ${
              isModalVisible
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-3 pointer-events-none"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#FAF8F5]">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                    POS_DETAILS[activePos]?.isSo
                      ? "bg-[#9C4322] text-white"
                      : "bg-[#E4EFE9] text-[#385642]"
                  }`}
                >
                  <i className={`mdi ${POS_DETAILS[activePos]?.mdiIcon} text-2xl`} />
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border inline-block mb-0.5 ${POS_DETAILS[activePos]?.roleBadgeColor}`}
                  >
                    {POS_DETAILS[activePos]?.roleBadge}
                  </span>
                  <h2 id="pin-modal-title" className="text-sm font-bold text-[#22352B] truncate">
                    {activePos === 1 ? (
                      soRole === "so1" ? "Ahmad Furqoni, S. Pd" : "Novia Permatasari, S. Pd"
                    ) : (
                      POS_DETAILS[activePos]?.evaluatorNames
                    )}
                  </h2>
                  <p className="text-[11px] text-[#787F7A] truncate">
                    {POS_DETAILS[activePos]?.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePinModal}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] hover:bg-[#EFECE4] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer active:scale-95 flex-shrink-0"
                aria-label="Tutup Popup PIN"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            {/* Sub-Role Selector Khusus Pos 1 (Super Observer) */}
            {activePos === 1 && (
              <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#DDD0B8] space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C4322] block text-center">
                  PILIH PENUGASAN ANDA HARI INI
                </span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Penugasan Super Observer">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={soRole === "so1"}
                    onClick={() => {
                      setSoRole("so1");
                      setPin("");
                      setError("");
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                      soRole === "so1"
                        ? "bg-[#9C4322] text-white shadow-2xs"
                        : "bg-white text-[#9C4322] border border-[#DDD0B8] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <i className="mdi mdi-account-check text-sm" />
                      <span>SO 1 (Kel. 2 &rarr; 1)</span>
                    </div>
                    <span className={`text-[9.5px] font-semibold ${soRole === "so1" ? "text-white/90" : "text-[#9C4322]"}`}>
                      Ahmad Furqoni, S. Pd
                    </span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={soRole === "so2"}
                    onClick={() => {
                      setSoRole("so2");
                      setPin("");
                      setError("");
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                      soRole === "so2"
                        ? "bg-[#9C4322] text-white shadow-2xs"
                        : "bg-white text-[#9C4322] border border-[#DDD0B8] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <i className="mdi mdi-account-check text-sm" />
                      <span>SO 2 (Kel. 3 &rarr; 2)</span>
                    </div>
                    <span className={`text-[9.5px] font-semibold ${soRole === "so2" ? "text-white/90" : "text-[#9C4322]"}`}>
                      Novia Permatasari, S. Pd
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-[#565C58] text-center leading-tight">
                  {soRole === "so1"
                    ? "SO 1 (Ahmad Furqoni, S. Pd): Dampingi Kel. 2 di awal, lalu Kel. 1 dari Pos B, C, hingga Titik Akhir"
                    : "SO 2 (Novia Permatasari, S. Pd): Dampingi Kel. 3 di awal, lalu Kel. 2 dari Pos B, C, hingga Titik Akhir"}
                </p>
              </div>
            )}

            {/* 4 PIN Dots */}
            <div className="text-center pt-1">
              <span className="text-[11px] font-semibold text-[#565C58] uppercase tracking-wider block">
                Masukkan 4 Digit PIN Tugas
              </span>
              <div className="flex justify-center gap-4 my-3" aria-label={`PIN terisi ${pin.length} dari 4 digit`}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      pin.length > i
                        ? "bg-[#9C4322] shadow-xs scale-115"
                        : "border-2 border-[#C5B4A5] bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-[#B83A35] text-center font-medium bg-[#FCEEEF] p-2.5 rounded-xl border border-[#F2D8C7] animate-in fade-in duration-150">
                {error}
              </p>
            )}

            {/* Loading Status */}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#9C4322] font-medium py-1 animate-pulse">
                <i className="mdi mdi-loading mdi-spin text-base" />
                <span>Memverifikasi PIN Pos <strong className="font-mono">{activePos}</strong>...</span>
              </div>
            )}

            {/* Keypad 3 Kolom */}
            <div className={`grid grid-cols-3 gap-2 max-w-[240px] mx-auto transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(String(num))}
                  disabled={loading}
                  className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
                  aria-label={`Digit ${num}`}
                >
                  {num}
                </button>
              ))}

              <div />

              <button
                type="button"
                onClick={() => handlePinInput("0")}
                disabled={loading}
                className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
                aria-label="Digit 0"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || pin.length === 0}
                className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] rounded-2xl h-12 font-bold hover:bg-[#F5E6DC] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
                aria-label="Hapus satu digit"
              >
                <i className="mdi mdi-backspace-outline text-xl" />
              </button>
            </div>

            <p className="text-[10px] text-[#787F7A] text-center pt-1">
              Dapat menggunakan keyboard angka fisik atau tombol layar.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
