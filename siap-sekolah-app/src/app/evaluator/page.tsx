"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardText,
  Leaf,
  ArrowLeft,
  Backspace,
  HouseLine,
  PersonSimpleRun,
  Brain,
  BookOpen,
  Handshake,
} from "@phosphor-icons/react";

const POS_DETAILS: Record<number, { name: string; Icon: React.ComponentType<{ weight?: "light"; size?: number; className?: string }> }> = {
  1: { name: "Emosi & Kemandirian", Icon: HouseLine },
  2: { name: "Motorik Kasar & Fisik", Icon: PersonSimpleRun },
  3: { name: "Kematangan Kognitif", Icon: Brain },
  4: { name: "Bahasa & Pra-Literasi", Icon: BookOpen },
  5: { name: "Bermain & Interaksi Sosial", Icon: Handshake },
};

export default function EvaluatorLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [posNumber, setPosNumber] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = useCallback(async (pinValue: string, pos: number) => {
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
        router.push(`/evaluator/${pos}`);
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
  }, [router]);

  const handlePinInput = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4 && posNumber) {
        submitLogin(newPin, posNumber);
      }
    }
  }, [pin, posNumber, submitLogin]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, []);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        setPin("");
        setPosNumber(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePinInput, handleDelete]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#1E2320] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Return to Role Selector */}
      <div className="w-full max-w-md mb-4">
        <Link
          href="/"
          className="text-xs font-bold text-[#3D7A5A] hover:text-[#1E2320] inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none rounded-lg px-2 py-1 transition-colors"
        >
          <ArrowLeft weight="light" size={14} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="w-14 h-14 bg-[#F0F4F1] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border border-[#C9DBD0]">
          <Leaf weight="light" size={28} className="text-[#3D7A5A]" />
        </div>
        <p className="font-brand lowercase text-[24px] text-[#1E2320] font-black tracking-tight">kalamula</p>
        <h1 className="text-base font-bold text-[#1E2320] tracking-tight mt-1">Ruang Observasi Pos Evaluator</h1>
        <p className="text-xs text-[#565C58] mt-1">
          Pilih pos observasi Anda dan masukkan PIN 4-digit
        </p>
      </div>

      {/* Pos Selector (Pure Crisp White Container matching Portal Guru) */}
      <div className="w-full max-w-md mb-5 bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)]">
        <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider mb-3 text-center">
          Pilih Pos Observasi (1 s.d. 5)
        </p>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label="Pilihan Pos Observasi">
          {[1, 2, 3, 4, 5].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => {
                setPosNumber(pos);
                setPin("");
                setError("");
              }}
              className={`
                h-12 sm:h-13 rounded-xl font-bold text-sm sm:text-base transition-all shadow-xs
                focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer
                ${
                  posNumber === pos
                    ? "bg-[#C9733B] text-white shadow-xs font-black ring-2 ring-[#C9733B] ring-offset-2 ring-offset-white"
                    : "bg-[#F4F3EE] text-[#1E2320] hover:bg-[#EBE6DF] border border-[#DDD7CE] active:bg-[#EBE6DF]"
                }
              `}
              aria-pressed={posNumber === pos}
              aria-label={`Pos ${pos}: ${POS_DETAILS[pos].name}`}
            >
              P{pos}
            </button>
          ))}
        </div>

        {posNumber && (
          <div className="mt-3.5 p-3.5 bg-[#F4F3EE] rounded-xl text-center border border-[#E8E2D8] flex items-center justify-center gap-2">
            {(() => {
              const PosIcon = POS_DETAILS[posNumber].Icon;
              return <PosIcon weight="light" size={18} className="text-[#C9733B]" />;
            })()}
            <span className="text-xs font-bold text-[#1E2320]">
              Pos {posNumber}: {POS_DETAILS[posNumber].name}
            </span>
          </div>
        )}
      </div>

      {/* PIN Section (Pure Crisp White Container matching Portal Guru) */}
      {posNumber && (
        <div className="w-full max-w-md bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)]">
          <p className="text-xs text-[#565C58] text-center mb-3">
            Masukkan PIN 4-digit untuk <span className="font-bold text-[#1E2320]">Pos {posNumber}</span>
          </p>

          {/* PIN Indicators */}
          <div className="flex justify-center gap-4 mb-5" aria-label={`PIN terisi ${pin.length} dari 4 digit`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  pin.length > i
                    ? "bg-[#C9733B] scale-110 shadow-xs"
                    : "bg-[#EBE6DF] border border-[#DDD7CE]"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-[#C9733B] text-center mb-3 font-semibold bg-[#FAF0E8] p-2.5 rounded-xl border border-[#F2D8C7]">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <p className="text-xs text-[#565C58] text-center mb-3 font-medium animate-pulse">
              Memverifikasi PIN...
            </p>
          )}

          {/* Tactile Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinInput(String(num))}
                disabled={loading}
                className="h-12 sm:h-13 rounded-xl bg-[#F4F3EE] hover:bg-[#EBE6DF] shadow-xs
                  text-lg sm:text-xl font-bold text-[#1E2320] border border-[#DDD7CE]
                  active:bg-[#E0DAD0] active:scale-95 transition-all
                  focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none
                  disabled:opacity-50 cursor-pointer"
                aria-label={`Digit ${num}`}
              >
                {num}
              </button>
            ))}
            <div /> {/* Grid spacer */}
            <button
              type="button"
              onClick={() => handlePinInput("0")}
              disabled={loading}
              className="h-12 sm:h-13 rounded-xl bg-[#F4F3EE] hover:bg-[#EBE6DF] shadow-xs
                text-lg sm:text-xl font-bold text-[#1E2320] border border-[#DDD7CE]
                active:bg-[#E0DAD0] active:scale-95 transition-all
                focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:opacity-50 cursor-pointer"
              aria-label="Digit 0"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-12 sm:h-13 rounded-xl bg-[#EBE6DF] hover:bg-[#DDD7CE] shadow-xs border border-[#DDD7CE]
                text-base font-bold text-[#565C58] flex items-center justify-center
                active:scale-95 transition-all
                focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none
                disabled:opacity-40 cursor-pointer"
              aria-label="Hapus satu digit"
            >
              <Backspace weight="light" size={20} />
            </button>
          </div>

          <p className="text-[11px] text-[#787F7A] text-center mt-4">
            Tip: Anda juga dapat mengetik PIN langsung menggunakan keyboard fisik.
          </p>
        </div>
      )}
    </main>
  );
}
