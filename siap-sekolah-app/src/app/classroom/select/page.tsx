"use client";
export const runtime = "edge";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ClassroomInfo {
  id: string;
  grade: number;
  section: "A" | "B";
  name: string;
  teacher_name?: string | null;
  student_count?: number;
}

const GRADES = [
  { grade: 1, fase: "Fase A", desc: "Fondasi Awal & Literasi Numerasi Dasar", icon: "mdi-numeric-1-box-multiple-outline" },
  { grade: 2, fase: "Fase A", desc: "Penguatan Kemandirian & Karakter Belajar", icon: "mdi-numeric-2-box-multiple-outline" },
  { grade: 3, fase: "Fase B", desc: "Eksplorasi Konseptual & Kolaborasi Tim", icon: "mdi-numeric-3-box-multiple-outline" },
  { grade: 4, fase: "Fase B", desc: "Penalaran Kritis & Pemecahan Masalah", icon: "mdi-numeric-4-box-multiple-outline" },
  { grade: 5, fase: "Fase C", desc: "Sintesis Pengetahuan & Literasi Digital", icon: "mdi-numeric-5-box-multiple-outline" },
  { grade: 6, fase: "Fase C", desc: "Kesiapan Transisi Lanjutan & Karakter Unggul", icon: "mdi-numeric-6-box-multiple-outline" },
];

export default function ClassroomSelectPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Bottom Sheet State
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<"A" | "B">("A");
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [verifying, setVerifying] = useState(false);

  // Fetch classroom data on mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/classrooms");
        if (res.ok) {
          const json = await res.json();
          setClassrooms(json.data || []);
        }
      } catch (err) {
        console.error("Gagal memuat data kelas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  // Handle opening modal for a grade
  const handleOpenGrade = (grade: number) => {
    setSelectedGrade(grade);
    setSelectedSection("A");
    setPin("");
    setErrorMsg("");
  };

  const handleCloseModal = () => {
    setSelectedGrade(null);
    setPin("");
    setErrorMsg("");
  };

  // Target class ID based on selection, e.g. "2A"
  const currentClassId = selectedGrade ? `${selectedGrade}${selectedSection}` : "";
  const currentClassInfo = classrooms.find((c) => c.id === currentClassId);

  // Numpad handler
  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg("");
      if (nextPin.length === 4) {
        verifyAndProceed(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleClear = () => {
    setPin("");
    setErrorMsg("");
  };

  // Keyboard support for typing PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedGrade) return;
      if (e.key >= "0" && e.key <= "9") {
        handleNumClick(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGrade, pin]);

  // PIN Verification
  const verifyAndProceed = async (pinToTest: string) => {
    if (!currentClassId) return;
    setVerifying(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/classrooms/${currentClassId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToTest }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Save session locally
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`classroom_auth_${currentClassId}`, "authenticated");
        }
        router.push(`/classroom/${currentClassId}`);
      } else {
        setErrorMsg(json.error || "PIN salah. Silakan coba lagi.");
        setPin("");
      }
    } catch {
      setErrorMsg("Koneksi bermasalah. Coba lagi.");
      setPin("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] p-4 sm:p-6 md:p-8 font-sans relative overflow-x-hidden">
      {/* Decorative Geometric Shapes */}
      <div
        className="w-72 h-72 rounded-full bg-[#DCE9E2] absolute -top-10 -right-20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="w-80 h-80 rounded-full bg-[#F5DFD3] absolute top-40 -left-40 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#486B5A] bg-white px-3.5 py-2 rounded-2xl border border-[#E8E2D8] shadow-2xs hover:bg-[#F2F7F4] active:scale-95 transition-all"
          >
            <i className="mdi mdi-arrow-left text-base" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4EFE9] text-[#486B5A] text-xs font-extrabold border border-[#CBE0D4]">
            <i className="mdi mdi-school-outline text-sm" />
            <span>Portal Diferensiasi Pembelajaran</span>
          </div>
        </div>

        {/* Page Title & Context */}
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#D67443] text-white flex items-center justify-center text-xl shadow-xs">
              <i className="mdi mdi-human-male-board" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight leading-tight">
                Asesmen Kualitatif untuk Diferensiasi Pembelajaran
              </h1>
              <p className="text-xs sm:text-sm text-[#565C58] font-medium">
                Pilih jenjang kelas atau calon peserta didik baru untuk memulai observasi &amp; pemetaan profil lulusan.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Calon Kelas 1 (SPMB) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-[#787F7A] px-1">
              1. Calon Peserta Didik Baru (SPMB)
            </p>
            <span className="text-[11px] font-bold text-[#B85627] bg-[#F9E6DC] px-2.5 py-0.5 rounded-full">
              Khusus Siswa Baru
            </span>
          </div>

          <Link
            href="/teacher"
            className="block bg-white rounded-3xl p-5 border-2 border-[#B85627]/30 shadow-sm hover:shadow-md hover:border-[#B85627] transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  <i className="mdi mdi-account-star-outline" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-[#22352B]">
                      Calon Kelas 1 Tahun Ajaran Terbaru
                    </h2>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#7D5327] border border-[#EFE7D6]">
                      SPMB Aktif
                    </span>
                  </div>
                  <p className="text-xs text-[#565C58] mt-1 leading-relaxed">
                    Portal guru untuk Morning Briefing, Peta Tumbuh Kesiapan Siswa Baru, dan Jurnal MPLS Ramah Fondasi Belajar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <span className="text-xs font-bold text-[#B85627] group-hover:underline">
                  Buka Portal Guru SPMB
                </span>
                <div className="w-9 h-9 rounded-full bg-[#F9E6DC] text-[#B85627] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <i className="mdi mdi-arrow-right text-lg" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* SECTION 2: Jenjang Kelas 1 s.d. Kelas 6 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-[#787F7A] px-1">
              2. Ruang Kelas Berjalan (Kelas 1 s.d. 6 SD)
            </p>
            <span className="text-[11px] font-medium text-[#565C58]">
              Klik jenjang untuk memilih sub-kelas A/B &amp; masukkan PIN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {GRADES.map((item) => {
              const studentsInA =
                classrooms.find((c) => c.id === `${item.grade}A`)?.student_count ?? 0;
              const studentsInB =
                classrooms.find((c) => c.id === `${item.grade}B`)?.student_count ?? 0;
              const totalStudents = studentsInA + studentsInB;

              return (
                <div
                  key={item.grade}
                  onClick={() => handleOpenGrade(item.grade)}
                  className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-2xs hover:shadow-md hover:border-[#486B5A] hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                      <i className={`mdi ${item.icon}`} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#EFECE4] text-[#22352B]">
                      {item.fase}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#22352B] group-hover:text-[#486B5A] transition-colors">
                      Kelas {item.grade}
                    </h3>
                    <p className="text-xs text-[#565C58] mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F6F3EC] flex items-center justify-between text-xs font-bold text-[#787F7A]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#486B5A]" />
                      <span>{item.grade}A &bull; {item.grade}B</span>
                    </div>
                    <span className="text-[#486B5A] bg-[#E4EFE9] px-2 py-0.5 rounded-lg text-[11px]">
                      {loading ? "..." : `${totalStudents} Siswa`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Information Card */}
        <div className="bg-[#FAF8F5] rounded-3xl p-4 sm:p-5 border border-[#E8E2D8] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center text-xl flex-shrink-0">
            <i className="mdi mdi-shield-key-outline" />
          </div>
          <div className="text-xs text-[#565C58] leading-relaxed">
            <span className="font-bold text-[#22352B]">Keamanan &amp; Privasi Kelas:</span> Setiap ruang kelas dilindungi oleh 4-digit PIN Guru Kelas (default: <code className="bg-[#EFECE4] px-1.5 py-0.5 rounded font-mono font-bold text-[#22352B]">1234</code>). Administrator dapat menyetel ulang PIN sewaktu-waktu melalui menu Admin SPMB.
          </div>
        </div>
      </div>

      {/* ─── MODAL / BOTTOM SHEET POP-UP ─── */}
      {selectedGrade !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#22352B]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#E8E2D8] max-h-[92vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1.5 bg-[#E8E2D8] rounded-full mx-auto sm:hidden -mt-1 mb-2" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F6F3EC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#486B5A] text-white flex items-center justify-center text-xl shadow-xs">
                  <i className="mdi mdi-google-classroom" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#22352B]">
                    Ruang Kelas {selectedGrade}
                  </h3>
                  <p className="text-xs text-[#565C58]">
                    Pilih rombel dan masukkan PIN akses pengajar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-[#EFECE4] text-[#22352B] flex items-center justify-center hover:bg-[#E4EAF2] transition-colors"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            {/* 1. Pilih Rombel Sub-Kelas A atau B */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-[#787F7A] block">
                Pilih Rombel Sub-Kelas:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B"] as const).map((sec) => {
                  const cId = `${selectedGrade}${sec}`;
                  const isSel = selectedSection === sec;
                  const cInfo = classrooms.find((c) => c.id === cId);

                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setPin("");
                        setErrorMsg("");
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#E4EFE9] border-[#486B5A] ring-2 ring-[#486B5A] text-[#22352B] shadow-xs"
                          : "bg-[#FAF8F5] border-[#E8E2D8] hover:bg-white text-[#565C58]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black">
                          Kelas {cId}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            isSel ? "bg-[#486B5A] text-white" : "bg-[#EFECE4] text-transparent"
                          }`}
                        >
                          <i className="mdi mdi-check" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#565C58] mt-1 truncate">
                        {cInfo?.teacher_name || "Guru Kelas"}
                      </p>
                      <span className="inline-block text-[10px] font-bold mt-1 text-[#486B5A]">
                        {cInfo?.student_count ?? 0} Siswa Terdaftar
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. PIN Input Display */}
            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] text-center space-y-3">
              <p className="text-xs font-bold text-[#565C58]">
                Masukkan 4-Digit PIN Kelas <span className="font-black text-[#22352B]">{currentClassId}</span>
              </p>

              {/* 4 Pin Circles */}
              <div className="flex items-center justify-center gap-3.5 py-1">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl flex items-center justify-center text-xl font-black transition-all ${
                        filled
                          ? "bg-[#486B5A] text-white shadow-xs scale-105"
                          : "bg-white border-2 border-[#E8E2D8] text-transparent"
                      }`}
                    >
                      {filled ? "•" : ""}
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="bg-[#F9E6DC] text-[#B85627] text-xs font-bold py-1.5 px-3 rounded-xl border border-[#F1CFC0] flex items-center justify-center gap-1.5">
                  <i className="mdi mdi-alert-circle text-sm" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-[11px] text-[#787F7A]">
                Default PIN: <span className="font-bold font-mono text-[#22352B]">1234</span>
              </p>
            </div>

            {/* 3. Interactive Numpad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleNumClick(n)}
                  className="h-12 rounded-2xl bg-[#EFECE4] hover:bg-[#E4EFE9] active:bg-[#486B5A] active:text-white font-black text-lg text-[#22352B] transition-all cursor-pointer shadow-2xs"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-[#EFECE4] hover:bg-[#F9E6DC] text-[#787F7A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumClick("0")}
                className="h-12 rounded-2xl bg-[#EFECE4] hover:bg-[#E4EFE9] active:bg-[#486B5A] active:text-white font-black text-lg text-[#22352B] transition-all cursor-pointer shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-[#EFECE4] hover:bg-[#F9E6DC] text-[#B85627] flex items-center justify-center text-xl transition-all cursor-pointer"
                aria-label="Hapus digit"
              >
                <i className="mdi mdi-backspace-outline" />
              </button>
            </div>

            {/* Direct CTA */}
            <button
              type="button"
              disabled={pin.length < 4 || verifying}
              onClick={() => verifyAndProceed(pin)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#486B5A] hover:bg-[#22352B] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {verifying ? (
                <>
                  <i className="mdi mdi-loading mdi-spin text-lg" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Buka Ruang Kelas {currentClassId}</span>
                  <i className="mdi mdi-arrow-right text-base" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
