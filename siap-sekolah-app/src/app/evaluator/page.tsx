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
  desc: string;
  mdiIcon: string;
}

const POS_DETAILS: Record<number, PosInfo> = {
  1: {
    name: "Kedatangan, Emosi & Super Observer 1",
    roleBadge: "Super Observer 1 (Pos 1, 3, 4, 5)",
    roleBadgeColor: "bg-[#EFE7D6] text-[#7D5327] border-[#DDD0B8]",
    desc: "Pandu Kelompok 2 (Pos 1 → 3 → 4 → 5). Switch saat masuk Pos 2.",
    mdiIcon: "mdi-eye-circle-outline",
  },
  2: {
    name: "Motorik Kasar & Koordinasi Fisik",
    roleBadge: "Station Evaluator + Escort",
    roleBadgeColor: "bg-[#E4EFE9] text-[#486B5A] border-[#CBE0D4]",
    desc: "Jemput Kelompok 1 dari Pos 1 & antar ke Pos 5 seusai pos 2.",
    mdiIcon: "mdi-run-fast",
  },
  3: {
    name: "Kematangan Kognitif & Berhitung",
    roleBadge: "Station Evaluator (Pos 3)",
    roleBadgeColor: "bg-[#E4EAF2] text-[#36506C] border-[#CBD8E5]",
    desc: "Klasifikasi objek, logika pola & problem solving kuantitas.",
    mdiIcon: "mdi-head-lightbulb-outline",
  },
  4: {
    name: "Bahasa Lisan, Pra-Literasi & Motorik Halus",
    roleBadge: "Station Evaluator (Pos 4)",
    roleBadgeColor: "bg-[#E4EAF2] text-[#36506C] border-[#CBD8E5]",
    desc: "Menyimak cerita, komunikasi lisan & tripod grasp.",
    mdiIcon: "mdi-book-open-page-variant-outline",
  },
  5: {
    name: "Bermain Bebas, Snack & Super Observer 2",
    roleBadge: "Super Observer 2 (Pos 1, 3, 4, 5)",
    roleBadgeColor: "bg-[#EFE7D6] text-[#7D5327] border-[#DDD0B8]",
    desc: "Pandu Kelompok 3 (Pos 1 → 4 → 3 → 5) & observasi santai saat snack.",
    mdiIcon: "mdi-handshake-outline",
  },
};

export default function EvaluatorLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [posNumber, setPosNumber] = useState<number | null>(1); // Default to Pos 1 as in reference
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
          if (selectedBatchId) {
            localStorage.setItem("kalamula_evaluator_batch_id", selectedBatchId);
            router.push(`/evaluator/${pos}?batch_id=${selectedBatchId}`);
          } else {
            router.push(`/evaluator/${pos}`);
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
    [router, selectedBatchId]
  );

  const handlePinInput = useCallback((digit: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4 && posNumber) {
        submitLogin(newPin, posNumber);
      }
    }
  }, [pin, posNumber, loading, submitLogin]);

  const handleDelete = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, [loading]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePinInput, handleDelete]);

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
            <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight leading-tight">
              Ruang Observasi SPMB
            </h1>
            <p className="text-xs text-[#565C58] mt-0.5">
              Pilih pos observasi Anda dan masukkan PIN 4-digit
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

        {/* Responsive Grid: Pos List (Left) + PIN Numpad (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri: PILIH POS OBSERVASI (1 S.D. 5) */}
          <div className="md:col-span-7 space-y-2.5">
            <p className="text-xs font-bold text-[#787F7A] uppercase tracking-wider px-0.5">
              PILIH POS OBSERVASI (1 S.D. 5)
            </p>

            <div className="space-y-2.5" role="group" aria-label="Daftar Pos Observasi">
              {[1, 2, 3, 4, 5].map((pos) => {
                const isSelected = posNumber === pos;
                const details = POS_DETAILS[pos];

                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      setPosNumber(pos);
                      setPin("");
                      setError("");
                    }}
                    className={`w-full bg-white rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition text-left active:scale-[0.98] ${
                      isSelected
                        ? "border-[2px] border-[#B85627] shadow-sm ring-2 ring-[#B85627]/20"
                        : "border border-[#E8E2D8] shadow-xs hover:border-[#DDD7CE]"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#B85627] text-white shadow-2xs"
                            : "bg-[#F9E6DC] text-[#8C3713]"
                        }`}
                      >
                        <i className={`mdi ${details.mdiIcon} text-2xl`} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block leading-none ${
                              isSelected ? "text-[#B85627]" : "text-[#787F7A]"
                            }`}
                          >
                            POS {pos}
                          </span>
                          <span
                            className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${details.roleBadgeColor}`}
                          >
                            {details.roleBadge}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#22352B] block truncate">
                          {details.name}
                        </span>
                        <span className="text-xs text-[#565C58] block truncate mt-0.5 font-normal">
                          {details.desc}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#B85627] text-white flex items-center justify-center flex-shrink-0 ml-2 shadow-2xs">
                        <i className="mdi mdi-check text-sm font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolom Kanan: Card Numpad PIN 4-Digit & Lembar Cetak */}
          <div className="md:col-span-5 space-y-4">
            {posNumber && (
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#E8E2D8] space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-[#787F7A] uppercase tracking-wider">
                    Verifikasi Keamanan
                  </span>
                  <p className="text-sm font-bold text-[#22352B] mt-0.5">
                    PIN Pos {posNumber}: <span className="text-[#B85627]">{POS_DETAILS[posNumber]?.name.split(",")[0]}</span>
                  </p>
                </div>

                {/* 4 Indikator Titik Bulat */}
                <div className="flex justify-center gap-3.5 my-2" aria-label={`PIN terisi ${pin.length} dari 4 digit`}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                        pin.length > i
                          ? "bg-[#B85627] shadow-xs scale-110"
                          : "border-2 border-[#C5B4A5] bg-transparent"
                      }`}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-xs text-[#B83A35] text-center font-medium bg-[#FCEEEF] p-2 rounded-xl border border-[#F2D8C7]">
                    {error}
                  </p>
                )}

                {/* Loading Status */}
                {loading && (
                  <p className="text-xs text-[#B85627] text-center font-bold animate-pulse">
                    Memverifikasi PIN Pos {posNumber}...
                  </p>
                )}

                {/* Keypad 3 Kolom */}
                <div className={`grid grid-cols-3 gap-2 max-w-[240px] mx-auto transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handlePinInput(String(num))}
                      disabled={loading}
                      className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl h-12 font-bold text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.96] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50"
                      aria-label={`Digit ${num}`}
                    >
                      {num}
                    </button>
                  ))}

                  <div /> {/* Slot Kiri Bawah Kosong */}

                  <button
                    type="button"
                    onClick={() => handlePinInput("0")}
                    disabled={loading}
                    className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl h-12 font-bold text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.96] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50"
                    aria-label="Digit 0"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading || pin.length === 0}
                    className="bg-[#F9E6DC] text-[#B85627] border border-[#F1CFC0] rounded-xl h-12 font-bold hover:bg-[#F2D7CA] active:scale-[0.96] transition flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-40"
                    aria-label="Hapus satu digit"
                  >
                    <i className="mdi mdi-backspace-outline text-xl" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Link: Cetak Lembar Observasi Fisik Lapangan */}
            <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#22352B] flex items-center gap-1.5">
                  <i className="mdi mdi-printer-outline text-base text-[#486B5A]" />
                  <span>Lembar Cetak Observasi Fisik</span>
                </span>
                <span className="text-[10px] font-medium text-[#787F7A]">A4 Cetak</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href={`/reports/rubric/${posNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8] px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-2xs active:scale-[0.96]"
                >
                  <i className="mdi mdi-table-large text-[#B85627]" />
                  <span>Lembar Pos {posNumber}</span>
                </Link>
                <Link
                  href="/reports/rubric/so"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#E4EFE9] hover:bg-[#D4E6DC] text-[#486B5A] border border-[#CBE0D4] px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-2xs active:scale-[0.96]"
                >
                  <i className="mdi mdi-eye-check-outline text-[#486B5A]" />
                  <span>Lembar SO Terpadu</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
