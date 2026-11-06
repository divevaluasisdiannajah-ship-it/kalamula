"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type PortalKey = "classroom" | "evaluator" | "admin";

interface PortalConfig {
  key: PortalKey;
  title: string;
  badge: string;
  subtitle: string;
  pin: string;
  href: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  dotColor: string;
  ringColor: string;
}

const PORTALS: Record<PortalKey, PortalConfig> = {
  classroom: {
    key: "classroom",
    title: "Jurnal Diferensiasi Kelas",
    badge: "JURNAL KELAS",
    subtitle: "Pilih Jenjang Kelas 1-6 & Calon Siswa Baru",
    pin: "1111",
    href: "/classroom/select",
    icon: "mdi-human-male-board",
    iconBg: "bg-[#E4EFE9]",
    iconColor: "text-[#486B5A]",
    badgeColor: "bg-[#E4EFE9] text-[#486B5A] border-[#C9DBD0]",
    dotColor: "bg-[#486B5A]",
    ringColor: "focus-visible:ring-[#486B5A]",
  },
  evaluator: {
    key: "evaluator",
    title: "Observasi SPMB",
    badge: "PORTAL SPMB",
    subtitle: "Pemetaan Titik Awal Calon Siswa",
    pin: "2222",
    href: "/evaluator",
    icon: "mdi-clipboard-check-outline",
    iconBg: "bg-[#F9E6DC]",
    iconColor: "text-[#9B3F18]",
    badgeColor: "bg-[#F9E6DC] text-[#9B3F18] border-[#F2D8C7]",
    dotColor: "bg-[#9B3F18]",
    ringColor: "focus-visible:ring-[#9B3F18]",
  },
  admin: {
    key: "admin",
    title: "Admin SPMB",
    badge: "PORTAL ADMIN",
    subtitle: "Kelola Gelombang, Kelas & Laporan",
    pin: "1212",
    href: "/admin",
    icon: "mdi-view-dashboard-outline",
    iconBg: "bg-[#E4EAF2]",
    iconColor: "text-[#2D4558]",
    badgeColor: "bg-[#E4EAF2] text-[#2D4558] border-[#CCD7E5]",
    dotColor: "bg-[#2D4558]",
    ringColor: "focus-visible:ring-[#2D4558]",
  },
};

export default function Home() {
  const router = useRouter();

  // Modal State
  const [activePortalKey, setActivePortalKey] = useState<PortalKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // PIN Input State
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const activePortal = activePortalKey ? PORTALS[activePortalKey] : null;

  // Open Modal with smooth animated entrance
  const openPinModal = useCallback((key: PortalKey) => {
    setActivePortalKey(key);
    setPin("");
    setError("");
    setLoading(false);
    setIsSuccess(false);
    setIsShaking(false);
    setIsModalOpen(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsModalVisible(true);
      });
    });
  }, []);

  // Close Modal with smooth exit transition
  const closePinModal = useCallback(() => {
    if (loading || isSuccess) return;
    setIsModalVisible(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setActivePortalKey(null);
      setPin("");
      setError("");
      setLoading(false);
      setIsSuccess(false);
      setIsShaking(false);
    }, 250);
  }, [loading, isSuccess]);

  // Lock body scroll when modal is open
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

  // PIN Submission with animated verification
  const submitPin = useCallback(
    (pinValue: string, portal: PortalConfig) => {
      setLoading(true);
      setError("");

      setTimeout(() => {
        if (pinValue === portal.pin) {
          setIsSuccess(true);
          setLoading(false);
          // Allow success animation to play briefly before route transition
          setTimeout(() => {
            router.push(portal.href);
          }, 350);
        } else {
          setLoading(false);
          setIsShaking(true);
          setError("PIN salah. Silakan coba lagi.");
          setPin("");
          setTimeout(() => {
            setIsShaking(false);
          }, 500);
        }
      }, 250);
    },
    [router]
  );

  // Handle Digit Keypress
  const handleDigit = useCallback(
    (digit: string) => {
      if (loading || isSuccess || !activePortal) return;
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);
        setError("");

        if (nextPin.length === 4) {
          submitPin(nextPin, activePortal);
        }
      }
    },
    [pin, loading, isSuccess, activePortal, submitPin]
  );

  // Handle Backspace Delete
  const handleDelete = useCallback(() => {
    if (loading || isSuccess) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, [loading, isSuccess]);

  // Physical Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || !isModalVisible) return;
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        closePinModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isModalVisible, handleDigit, handleDelete, closePinModal]);

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] flex flex-col items-center justify-between p-5 sm:p-8 md:p-12 font-sans relative">
      {/* Embedded Animation Keyframes */}
      <style jsx global>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-pin-shake {
          animation: pinShake 0.45s ease-in-out;
        }
      `}</style>

      {/* Top Spacer for Vertical Balance */}
      <div className="w-full h-2 sm:h-4 z-10" />

      {/* App Header & Emblem (Centered, Dignified & Clean) */}
      <div className="text-center w-full max-w-4xl lg:max-w-5xl my-auto py-6 sm:py-10 space-y-8 z-10">
        <div>
          {/* Logo Box in Warm Terracotta #D67443 (Enlarged on desktop, clean & dignified) */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[1.6rem] sm:rounded-[2.2rem] bg-[#D67443] flex items-center justify-center mx-auto shadow-md transition-transform hover:scale-105 duration-300">
            <i className="mdi mdi-leaf text-white text-4xl sm:text-5xl" />
          </div>

          <h1 className="font-brand lowercase text-4xl sm:text-5xl md:text-6xl text-[#22352B] tracking-tight font-extrabold leading-none mt-4 sm:mt-5">
            kalamula
          </h1>
          <p className="text-xs sm:text-base md:text-lg text-[#565C58] mt-2 sm:mt-3 font-medium tracking-normal max-w-md mx-auto">
            Memandu Pembelajaran, Memetakan Potensi
          </p>
        </div>

        {/* Role Selection Cards (3-Column Grid on Desktop, Stack on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto">
          {/* 1. Jurnal Diferensiasi Kelas (PIN: 1111) */}
          <button
            type="button"
            onClick={() => openPinModal("classroom")}
            className="w-full relative overflow-hidden bg-[#486B5A] text-white rounded-3xl p-4 sm:p-5 md:py-7 md:px-5 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none group cursor-pointer flex md:flex-col items-center justify-between md:justify-center text-left md:text-center md:h-[156px]"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            
            {/* Desktop Center Layout & Mobile Row Layout */}
            <div className="relative z-10 flex md:flex-col items-center md:justify-center gap-3.5 sm:gap-4 md:gap-3 min-w-0 w-full">
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 bg-white text-[#486B5A] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-human-male-board text-2xl md:text-3xl" />
              </div>
              <div className="min-w-0 md:w-full">
                <p className="font-bold text-base sm:text-lg md:text-xl text-white leading-snug">
                  Jurnal Diferensiasi Kelas
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate md:hidden">
                  Pilih Jenjang Kelas 1-6 &amp; Calon Siswa Baru
                </p>
              </div>
            </div>

            {/* Mobile-only Chevron Indicator */}
            <div className="relative z-10 w-9 h-9 rounded-full bg-white text-[#486B5A] flex md:hidden items-center justify-center flex-shrink-0 ml-3 shadow-xs">
              <i className="mdi mdi-chevron-right text-lg" />
            </div>
          </button>

          {/* 2. Observasi SPMB (PIN: 2222) */}
          <button
            type="button"
            onClick={() => openPinModal("evaluator")}
            className="w-full relative overflow-hidden bg-[#9B3F18] text-white rounded-3xl p-4 sm:p-5 md:py-7 md:px-5 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#9B3F18] focus-visible:ring-offset-2 focus-visible:outline-none group cursor-pointer flex md:flex-col items-center justify-between md:justify-center text-left md:text-center md:h-[156px]"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            
            <div className="relative z-10 flex md:flex-col items-center md:justify-center gap-3.5 sm:gap-4 md:gap-3 min-w-0 w-full">
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 bg-white text-[#9B3F18] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-clipboard-check-outline text-2xl md:text-3xl" />
              </div>
              <div className="min-w-0 md:w-full">
                <p className="font-bold text-base sm:text-lg md:text-xl text-white leading-snug">
                  Observasi SPMB
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate md:hidden">
                  Pemetaan Titik Awal Calon Siswa
                </p>
              </div>
            </div>

            <div className="relative z-10 w-9 h-9 rounded-full bg-white text-[#9B3F18] flex md:hidden items-center justify-center flex-shrink-0 ml-3 shadow-xs">
              <i className="mdi mdi-chevron-right text-lg" />
            </div>
          </button>

          {/* 3. Admin SPMB (PIN: 1212) */}
          <button
            type="button"
            onClick={() => openPinModal("admin")}
            className="w-full relative overflow-hidden bg-[#2D4558] text-white rounded-3xl p-4 sm:p-5 md:py-7 md:px-5 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#2D4558] focus-visible:ring-offset-2 focus-visible:outline-none group cursor-pointer flex md:flex-col items-center justify-between md:justify-center text-left md:text-center md:h-[156px]"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            
            <div className="relative z-10 flex md:flex-col items-center md:justify-center gap-3.5 sm:gap-4 md:gap-3 min-w-0 w-full">
              <div className="w-13 h-13 sm:w-14 sm:h-14 md:w-15 md:h-15 bg-white text-[#2D4558] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-view-dashboard-outline text-2xl md:text-3xl" />
              </div>
              <div className="min-w-0 md:w-full">
                <p className="font-bold text-base sm:text-lg md:text-xl text-white leading-snug">
                  Admin SPMB
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate md:hidden">
                  Kelola Gelombang, Kelas &amp; Laporan
                </p>
              </div>
            </div>

            <div className="relative z-10 w-9 h-9 rounded-full bg-white text-[#2D4558] flex md:hidden items-center justify-center flex-shrink-0 ml-3 shadow-xs">
              <i className="mdi mdi-chevron-right text-lg" />
            </div>
          </button>
        </div>
      </div>

      {/* Sapaan Hangat & Footer */}
      <div className="text-center space-y-1 pb-4 sm:pb-6 z-10">
        <p className="text-xs sm:text-sm text-[#565C58] font-medium">
          Hari ini kita mengamati ritme belajar Ananda tanpa tergesa.
        </p>
        <p className="text-[11px] text-[#787F7A]">
          kalamula &bull; Platform Asesmen Diagnostik &amp; Diferensiasi Pembelajaran Deep Learning SD
        </p>
      </div>

      {/* ─── ANIMATED PIN ACCESS MODAL (MIRRORS EVALUATOR PIN MODAL) ─── */}
      {isModalOpen && activePortal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-pin-title"
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
            {/* Modal Header with Varian E Megamendung accent */}
            <div
              className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-xs ${
                activePortalKey === "classroom"
                  ? "bg-[#486B5A]"
                  : activePortalKey === "evaluator"
                  ? "bg-[#9B3F18]"
                  : "bg-[#2D4558]"
              }`}
            >
              <div className="bg-megamendung-overlay" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs text-xl font-bold">
                    <i
                      className={`mdi ${activePortal.icon} ${
                        activePortalKey === "classroom"
                          ? "text-[#486B5A]"
                          : activePortalKey === "evaluator"
                          ? "text-[#9B3F18]"
                          : "text-[#2D4558]"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white inline-block mb-0.5 tracking-wider uppercase">
                      {activePortal.badge}
                    </span>
                    <h2 id="portal-pin-title" className="text-sm font-black text-white leading-tight">
                      {activePortal.title}
                    </h2>
                    <p className="text-[11px] text-white/80 truncate mt-0.5 font-medium">
                      {activePortal.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closePinModal}
                  disabled={loading || isSuccess}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer active:scale-95 flex-shrink-0 disabled:opacity-40"
                  aria-label="Tutup Popup PIN"
                >
                  <i className="mdi mdi-close text-lg" />
                </button>
              </div>
            </div>

            {/* Instruction Text */}
            <div className="text-center pt-1">
              <span className="text-[11px] font-bold text-[#565C58] uppercase tracking-wider block">
                Masukkan 4 Digit PIN Akses
              </span>
              <p className="text-[11px] text-[#787F7A] mt-0.5">
                Verifikasi keamanan untuk masuk ke {activePortal.badge}
              </p>

              {/* 4 Animated PIN Dots */}
              <div
                className={`flex justify-center gap-4 my-3.5 transition-transform ${
                  isShaking ? "animate-pin-shake" : ""
                }`}
                aria-label={`PIN terisi ${pin.length} dari 4 digit`}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = idx < pin.length;
                  return (
                    <div
                      key={idx}
                      className={`w-4.5 h-4.5 rounded-full transition-all duration-200 border-2 ${
                        isSuccess
                          ? "bg-emerald-600 border-emerald-600 scale-110"
                          : isFilled
                          ? `${activePortal.dotColor} ${activePortal.dotColor.replace("bg-", "border-")} scale-110 shadow-xs`
                          : "bg-white border-[#DDD7CE]"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Status Message / Error Message */}
              <div className="h-5 flex items-center justify-center">
                {error ? (
                  <p className="text-xs text-red-600 font-bold animate-fadeIn flex items-center gap-1">
                    <i className="mdi mdi-alert-circle text-sm" />
                    <span>{error}</span>
                  </p>
                ) : loading ? (
                  <p className="text-xs text-[#565C58] font-medium flex items-center gap-1.5">
                    <i className="mdi mdi-loading mdi-spin text-sm text-[#486B5A]" />
                    <span>Memverifikasi PIN...</span>
                  </p>
                ) : isSuccess ? (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                    <i className="mdi mdi-check-circle text-sm" />
                    <span>Akses Berhasil! Mengalihkan...</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#A8A09A]">
                    Tekan tombol angka di bawah atau gunakan keyboard
                  </p>
                )}
              </div>
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  disabled={loading || isSuccess}
                  className="h-14 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D8] text-[#22352B] text-xl font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center font-sans"
                >
                  {digit}
                </button>
              ))}

              {/* Empty placeholder */}
              <div aria-hidden="true" />

              {/* Digit 0 */}
              <button
                type="button"
                onClick={() => handleDigit("0")}
                disabled={loading || isSuccess}
                className="h-14 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D8] text-[#22352B] text-xl font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center font-sans"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || isSuccess || pin.length === 0}
                className="h-14 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E8E2D8] text-[#787F7A] hover:text-[#9B3F18] transition-all shadow-2xs active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center"
                aria-label="Hapus Satu Digit"
              >
                <i className="mdi mdi-backspace-outline text-2xl" />
              </button>
            </div>

            {/* Cancel Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={closePinModal}
                disabled={loading || isSuccess}
                className="w-full py-2.5 text-xs text-[#787F7A] hover:text-[#22352B] font-bold transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
