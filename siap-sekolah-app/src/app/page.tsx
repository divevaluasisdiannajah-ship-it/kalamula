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
    title: "Asesmen Kualitatif untuk Diferensiasi Pembelajaran",
    badge: "PORTAL ASESMEN",
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
    subtitle: "Observasi Rubrik, Pra-Literasi & Catatan Khusus",
    pin: "2222",
    href: "/evaluator",
    icon: "mdi-clipboard-check-outline",
    iconBg: "bg-[#F9E6DC]",
    iconColor: "text-[#B85627]",
    badgeColor: "bg-[#F9E6DC] text-[#B85627] border-[#F2D8C7]",
    dotColor: "bg-[#B85627]",
    ringColor: "focus-visible:ring-[#B85627]",
  },
  admin: {
    key: "admin",
    title: "Admin SPMB",
    badge: "PORTAL ADMIN",
    subtitle: "Kelola Gelombang, Pembagian Kelas & PDF Rekap",
    pin: "1212",
    href: "/admin",
    icon: "mdi-view-dashboard-outline",
    iconBg: "bg-[#E4EAF2]",
    iconColor: "text-[#36506C]",
    badgeColor: "bg-[#E4EAF2] text-[#36506C] border-[#CCD7E5]",
    dotColor: "bg-[#36506C]",
    ringColor: "focus-visible:ring-[#36506C]",
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
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] flex flex-col items-center justify-between p-5 sm:p-8 font-sans relative overflow-hidden">
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

      {/* 2 Decorative Pastel Circles in Background */}
      <div
        className="w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-[#DCE9E2] absolute -top-12 -right-16 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#F5DFD3] absolute top-28 -left-36 sm:top-24 sm:-left-44 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Spacer for Vertical Balance */}
      <div className="w-full h-2 z-10" />

      {/* App Header & Emblem */}
      <div className="text-center max-w-md w-full my-auto py-6 sm:py-8 space-y-6 z-10">
        <div>
          {/* Logo Box in Warm Terracotta #D67443 */}
          <div className="w-20 h-20 rounded-[1.6rem] bg-[#D67443] flex items-center justify-center mx-auto shadow-md transition-transform hover:scale-105 duration-300">
            <i className="mdi mdi-leaf text-white text-4xl" />
          </div>

          <h1 className="font-brand lowercase text-4xl sm:text-[44px] text-[#22352B] tracking-tight font-extrabold leading-none mt-4">
            kalamula
          </h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-2 font-medium tracking-normal">
            Memandu Pembelajaran, Memetakan Potensi
          </p>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-xs font-bold text-[#22352B] mt-3.5 shadow-xs border border-[#E8E2D8]/60">
            <span className="w-2 h-2 rounded-full bg-[#4F936F] animate-pulse" />
            <span>Ruang Observasi Aktif</span>
          </div>
        </div>

        {/* Role Selection Cards (Varian E Megamendung) */}
        <div className="space-y-3.5 text-left pt-2">
          <p className="text-xs font-bold text-[#787F7A] uppercase tracking-wider text-left mb-2 px-1">
            PILIH RUANG MASUK
          </p>

          {/* 1. Asesmen Kualitatif (PIN: 1111) */}
          <button
            type="button"
            onClick={() => openPinModal("classroom")}
            className="w-full text-left relative overflow-hidden bg-[#486B5A] text-white rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white text-[#486B5A] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-human-male-board text-2xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-[#486B5A] shadow-xs inline-flex items-center gap-1 uppercase tracking-wider">
                    <i className="mdi mdi-lock-outline text-[11px]" />
                    <span>PORTAL ASESMEN &bull; PIN 1111</span>
                  </span>
                </div>
                <p className="font-extrabold text-base sm:text-lg text-white leading-snug mt-1">
                  Asesmen Kualitatif Pembelajaran
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate leading-relaxed">
                  Pilih Jenjang Kelas 1-6 &amp; Calon Siswa Baru
                </p>
              </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white text-[#486B5A] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform shadow-xs">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </button>

          {/* 2. Observasi SPMB (PIN: 2222) */}
          <button
            type="button"
            onClick={() => openPinModal("evaluator")}
            className="w-full text-left relative overflow-hidden bg-[#9B3F18] text-white rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#9B3F18] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white text-[#9B3F18] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-clipboard-check-outline text-2xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-[#9B3F18] shadow-xs inline-flex items-center gap-1 uppercase tracking-wider">
                    <i className="mdi mdi-lock-outline text-[11px]" />
                    <span>PORTAL SPMB &bull; PIN 2222</span>
                  </span>
                </div>
                <p className="font-extrabold text-base sm:text-lg text-white leading-snug mt-1">
                  Observasi SPMB
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate leading-relaxed">
                  Observasi Rubrik Pos, Pra-Literasi &amp; Catatan Khusus
                </p>
              </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white text-[#9B3F18] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform shadow-xs">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </button>

          {/* 3. Admin SPMB (PIN: 1212) */}
          <button
            type="button"
            onClick={() => openPinModal("admin")}
            className="w-full text-left relative overflow-hidden bg-[#2D4558] text-white rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#2D4558] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="bg-megamendung-overlay" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white text-[#2D4558] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                <i className="mdi mdi-view-dashboard-outline text-2xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-[#2D4558] shadow-xs inline-flex items-center gap-1 uppercase tracking-wider">
                    <i className="mdi mdi-lock-outline text-[11px]" />
                    <span>PORTAL ADMIN &bull; PIN 1212</span>
                  </span>
                </div>
                <p className="font-extrabold text-base sm:text-lg text-white leading-snug mt-1">
                  Admin SPMB
                </p>
                <p className="text-xs text-white/80 mt-0.5 truncate leading-relaxed">
                  Kelola Gelombang, Rubrik, Pembagian Kelas &amp; PDF Rekap
                </p>
              </div>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-full bg-white text-[#2D4558] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform shadow-xs">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </button>
        </div>
      </div>

      {/* Sapaan Hangat & Footer */}
      <div className="text-center space-y-1 pb-3 sm:pb-4 z-10">
        <p className="text-xs text-[#565C58] font-medium">
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
                {[0, 1, 2, 3].map((i) => {
                  const isFilled = pin.length > i;
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        isSuccess
                          ? "bg-[#2E6B4D] shadow-sm scale-125"
                          : isFilled
                          ? `${activePortal.dotColor} shadow-xs scale-115`
                          : "border-2 border-[#C5B4A5] bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-[#B83A35] text-center font-bold bg-[#FCEEEF] p-2.5 rounded-xl border border-[#F2D8C7] animate-in fade-in duration-150">
                {error}
              </p>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#2E6B4D] font-bold bg-[#E4EFE9] p-2.5 rounded-xl border border-[#C9DBD0] animate-in fade-in duration-150">
                <i className="mdi mdi-check-circle text-base" />
                <span>PIN benar! Mengarahkan ke {activePortal.badge}...</span>
              </div>
            )}

            {/* Loading Status */}
            {loading && !isSuccess && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#565C58] font-medium py-1 animate-pulse">
                <i className="mdi mdi-loading mdi-spin text-base" />
                <span>Memverifikasi PIN...</span>
              </div>
            )}

            {/* Keypad 3 Kolom */}
            <div
              className={`grid grid-cols-3 gap-2 max-w-[240px] mx-auto transition-opacity ${
                loading || isSuccess ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(String(num))}
                  disabled={loading || isSuccess}
                  className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.92] transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
                  aria-label={`Digit ${num}`}
                >
                  {num}
                </button>
              ))}

              <div />

              <button
                type="button"
                onClick={() => handleDigit("0")}
                disabled={loading || isSuccess}
                className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl h-12 font-bold font-mono tabular-nums text-lg text-[#22352B] hover:bg-[#F3EFE6] active:scale-[0.92] transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
                aria-label="Digit 0"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || isSuccess || pin.length === 0}
                className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] rounded-2xl h-12 font-bold hover:bg-[#F5E6DC] active:scale-[0.92] transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#385642] focus-visible:outline-none"
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
