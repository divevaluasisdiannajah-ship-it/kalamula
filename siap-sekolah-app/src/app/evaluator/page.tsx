"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
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
}

const POS_DETAILS: Record<number, PosInfo> = {
  1: {
    name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    roleBadge: "Super Observer (SO 1 & SO 2)",
    roleBadgeColor: "bg-[#EFE7D6] text-[#7D5327] border-[#DDD0B8]",
    evaluatorNames: "Ahmad Furqoni, S. Pd & Novia Permatasari, S. Pd",
    desc: "Amati kedatangan di titik awal, dampingi transisi rotasi 3 pos, hingga bermain bebas & snack break.",
    mdiIcon: "mdi-account-check-outline",
  },
  2: {
    name: "Pos Motorik Kasar & Koordinasi Fisik",
    roleBadge: "Pos A (Motorik) + Escort",
    roleBadgeColor: "bg-[#E4EFE9] text-[#486B5A] border-[#CBE0D4]",
    evaluatorNames: "Rifky Delsandi Rifai, S. Pd",
    desc: "Jemput Kelompok 1 di titik awal, uji keseimbangan & tangkap bola, jemput Kelompok 3 di Pos Bahasa.",
    mdiIcon: "mdi-run-fast",
  },
  3: {
    name: "Pos Kematangan Kognitif & Berhitung",
    roleBadge: "Pos B (Kognitif)",
    roleBadgeColor: "bg-[#E4EAF2] text-[#36506C] border-[#CBD8E5]",
    evaluatorNames: "Shalma Ruhail Maldova, S. Pd",
    desc: "Klasifikasi objek, logika pola berulang, perbandingan kuantitas & problem solving balok.",
    mdiIcon: "mdi-head-lightbulb-outline",
  },
  4: {
    name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
    roleBadge: "Pos C (Bahasa & Halus)",
    roleBadgeColor: "bg-[#E4EAF2] text-[#36506C] border-[#CBD8E5]",
    evaluatorNames: "Susmurtiningsih, S. Pd",
    desc: "Menyimak cerita lisan (read-aloud), komunikasi verbal ide, & kontrol genggaman pensil (tripod grasp).",
    mdiIcon: "mdi-book-open-page-variant-outline",
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

          <span className="bg-[#F9E6DC] text-[#B85627] text-xs font-extrabold px-3 py-1 rounded-full shadow-2xs">
            OBSERVASI SPMB
          </span>
        </div>

        {/* Hero Judul: Kotak Ikon Besar #D67443 + Teks */}
        <div className="flex items-center gap-3.5 py-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#D67443] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <i className="mdi mdi-clipboard-check-outline text-3xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#22352B] tracking-tight leading-tight">
              Ruang Observasi SPMB
            </h1>
            <p className="text-xs text-[#565C58] mt-0.5">
              Pilih pos observasi dan masukkan 4 digit PIN tugas Anda.
            </p>
          </div>
        </div>

        {/* Pilihan Gelombang Observasi */}
        {batches.length > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-[#E8E2D8] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#F6F2E9] border border-[#E8E2D8] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-calendar-clock text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A] leading-tight">
                  Gelombang Observasi
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#22352B] truncate">
                    {batches.find((b) => b.id === selectedBatchId)?.batch_name || "Pilih Gelombang"}
                  </span>
                  {selectedBatchId && (
                    <span className="text-[11px] font-medium text-[#486B5A] tabular-nums font-mono">
                      ({batches.find((b) => b.id === selectedBatchId)?.student_count ?? 0} Siswa)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <label htmlFor="batch-select-entrance" className="sr-only">
                Pilih Gelombang
              </label>
              <select
                id="batch-select-entrance"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("kalamula_evaluator_batch_id", e.target.value);
                  }
                }}
                className="w-full sm:w-auto bg-[#FAF8F5] border border-[#DDD0B8] text-[#22352B] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#486B5A] cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name} ({b.student_count ?? 0} Siswa){b.status === "active" ? " • Aktif" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Responsive Grid of Pos Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[11px] font-bold text-[#565C58] uppercase tracking-wider">
              PILIH RUANG &amp; DOMAIN OBSERVASI
            </p>
            <span className="text-[11px] text-[#787F7A]">
              Klik kartu pos untuk memasukkan PIN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" role="group" aria-label="Daftar Ruang Observasi">
            {[1, 2, 3, 4].map((pos) => {
              const details = POS_DETAILS[pos];

              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => openPinModal(pos)}
                  className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs hover:border-[#D67443]/60 hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 group active:scale-[0.98] cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F9E6DC] text-[#8C3713] flex items-center justify-center flex-shrink-0 group-hover:bg-[#B85627] group-hover:text-white transition-colors shadow-2xs">
                          <i className={`mdi ${details.mdiIcon} text-xl`} />
                        </div>
                        <div>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${details.roleBadgeColor}`}>
                            {details.roleBadge}
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#E8E2D8] text-[#787F7A] group-hover:text-[#B85627] group-hover:border-[#B85627]/30 flex items-center justify-center transition-all flex-shrink-0">
                        <i className="mdi mdi-lock-outline text-sm" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#22352B] group-hover:text-[#B85627] transition-colors leading-snug">
                        {details.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-[#486B5A] mt-0.5">
                        • {details.evaluatorNames}
                      </p>
                      <p className="text-xs text-[#565C58] mt-1 font-normal leading-relaxed">
                        {details.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#FAF8F5] flex items-center justify-between text-xs font-bold text-[#B85627]">
                    <span className="flex items-center gap-1.5">
                      <i className="mdi mdi-key-outline text-sm" />
                      <span>Masuk Pos &amp; Verifikasi PIN</span>
                    </span>
                    <i className="mdi mdi-arrow-right text-base group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Link: Cetak Lembar Observasi Fisik Lapangan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#22352B] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F6F2E9] border border-[#E8E2D8] text-[#486B5A] flex items-center justify-center">
                <i className="mdi mdi-printer-outline text-base" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[#22352B]">Lembar Cetak Observasi Fisik (A4)</span>
                <span className="block text-[11px] text-[#787F7A] font-normal">Format matriks observasi lapangan untuk dicetak</span>
              </div>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <Link
              href={`/reports/rubric/so${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#E4EFE9] hover:bg-[#D4E6DC] text-[#486B5A] border border-[#CBE0D4] px-3 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-eye-check-outline" />
              <span>SO Terpadu</span>
            </Link>
            <Link
              href={`/reports/rubric/2${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-run-fast text-[#B85627]" />
              <span>Pos A (Motorik)</span>
            </Link>
            <Link
              href={`/reports/rubric/3${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-head-lightbulb-outline text-[#36506C]" />
              <span>Pos B (Kognitif)</span>
            </Link>
            <Link
              href={`/reports/rubric/4${selectedBatchId ? `?batch_id=${selectedBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-2xs active:scale-[0.96] text-center"
            >
              <i className="mdi mdi-book-open-page-variant-outline text-[#36506C]" />
              <span>Pos C (Bahasa)</span>
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
                <div className="w-11 h-11 rounded-2xl bg-[#D67443] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
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
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7D5327] block text-center">
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
                        ? "bg-[#7D5327] text-white shadow-2xs"
                        : "bg-white text-[#7D5327] border border-[#DDD0B8] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <i className="mdi mdi-account-check text-sm" />
                      <span>SO 1 (Kel. 2 &rarr; 1)</span>
                    </div>
                    <span className={`text-[9.5px] font-semibold ${soRole === "so1" ? "text-white/90" : "text-[#7D5327]"}`}>
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
                        ? "bg-[#7D5327] text-white shadow-2xs"
                        : "bg-white text-[#7D5327] border border-[#DDD0B8] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <i className="mdi mdi-account-check text-sm" />
                      <span>SO 2 (Kel. 3 &rarr; 2)</span>
                    </div>
                    <span className={`text-[9.5px] font-semibold ${soRole === "so2" ? "text-white/90" : "text-[#7D5327]"}`}>
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
                        ? "bg-[#B85627] shadow-xs scale-115"
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
              <div className="flex items-center justify-center gap-2 text-xs text-[#B85627] font-medium py-1 animate-pulse">
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
                  className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:outline-none"
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
                className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:outline-none"
                aria-label="Digit 0"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || pin.length === 0}
                className="bg-[#F9E6DC] text-[#B85627] border border-[#F1CFC0] rounded-2xl h-12 font-bold hover:bg-[#F2D7CA] active:scale-[0.94] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:outline-none"
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
