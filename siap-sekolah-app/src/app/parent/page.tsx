"use client";
export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import { type QuestionnaireQuestion } from "@/types/questionnaire";

export default function GeneralParentFormPage() {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        fetch("/api/questionnaire"),
        fetch("/api/students"),
      ]);

      if (qRes.ok) {
        const qJson = await qRes.json();
        setQuestions(qJson.data || []);
      }

      if (sRes.ok) {
        const sJson = await sRes.json();
        setStudents(sJson.data || []);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert("Mohon pilih nama ananda terlebih dahulu.");
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      alert("Mohon lengkapi seluruh pertanyaan kuesioner terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/parent-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          batch_id: selectedStudent.batch_id || "active",
          responses_json: answers,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Gagal mengirim jawaban. Silakan coba lagi.");
      }
    } catch {
      alert("Terjadi kendala jaringan. Mohon periksa koneksi internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.nickname?.toLowerCase().includes(q) ||
      s.registration_no?.toLowerCase().includes(q)
    );
  });

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F6F2E9] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-[#E4EFE9] text-[#2E6B4D] rounded-3xl flex items-center justify-center mb-5 shadow-sm">
          <i className="mdi mdi-check-circle-outline text-5xl" />
        </div>
        <h1 className="text-2xl font-black text-[#22352B] tracking-tight mb-2">
          Alhamdulillah, Terima Kasih!
        </h1>
        <p className="text-sm font-semibold text-[#284034] mb-1">
          Kuesioner untuk Ananda <strong className="underline">{selectedStudent?.full_name}</strong> telah berhasil disimpan.
        </p>
        <p className="text-xs text-[#565C58] max-w-md leading-relaxed mt-1">
          Informasi ini telah tersinkronisasi langsung ke Laporan Diagnostik Kesiapan Belajar Siswa dan akan menjadi rujukan tim guru dalam mendampingi ananda.
        </p>
        <div className="mt-8 pt-6 border-t border-[#E8E2D8] w-full max-w-sm">
          <p className="text-[11px] text-[#787F7A]">
            SD Islam An Najah &bull; Yayasan Nurun Najah &bull; SPMB 2026/2027
          </p>
        </div>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans pb-24">
      {/* Header Kop */}
      <header className="bg-white border-b border-[#E8E2D8] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9B3F18] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              <i className="mdi mdi-sprout" />
            </div>
            <div>
              <h1 className="text-base font-black text-[#22352B] leading-tight">
                SD Islam An Najah
              </h1>
              <p className="text-[11px] font-semibold text-[#787F7A]">
                Kuesioner Observasi Wali Murid
              </p>
            </div>
          </div>
          <span className="bg-[#E4EFE9] text-[#284034] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
            SPMB 2026/2027
          </span>
        </div>

        {/* Progress Bar */}
        {selectedStudent && questions.length > 0 && (
          <div className="w-full bg-[#FAF8F5] h-1.5 overflow-hidden">
            <div
              className="bg-[#2E6B4D] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Hero Banner: Kuesioner Wali Murid (Varian E Megamendung) */}
        <div className="relative overflow-hidden bg-[#2D4535] rounded-3xl p-5 sm:p-6 shadow-sm text-white">
          <div className="bg-megamendung-overlay" aria-hidden="true" />

          <div className="relative z-10 space-y-3.5">
            {/* Top row: badge + status */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D4535] text-xs font-black shadow-xs tracking-wider uppercase">
                <i className="mdi mdi-sprout text-sm" />
                KUESIONER ORANG TUA
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[#2D4535] text-xs font-bold shadow-xs">
                <i className="mdi mdi-calendar-check text-sm" />
                <span>SPMB 2026/2027</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Selamat Datang, Bapak/Ibu Wali Murid
              </h2>
              <p className="text-xs text-white/80 font-medium mt-1 leading-relaxed">
                Kuesioner ini membantu kami memahami kebiasaan, kemandirian, dan kebutuhan belajar ananda sejak hari pertama sekolah.
              </p>
            </div>

            {/* 3 Metric Cards Putih Solid (Varian E) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  PERTANYAAN
                </span>
                <span className="text-lg sm:text-xl font-black text-[#2D4535] tracking-tight block">
                  {questions.length || "10"}
                </span>
                <span className="text-[10px] text-[#787F7A] font-semibold block">
                  Butir Singkat
                </span>
              </div>

              <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  ESTIMASI
                </span>
                <span className="text-lg sm:text-xl font-black text-[#8C3713] tracking-tight block">
                  ~3
                </span>
                <span className="text-[10px] text-[#8C3713] font-semibold block">
                  Menit Selesai
                </span>
              </div>

              <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs">
                <span className="block text-[10px] font-bold text-[#787F7A] uppercase tracking-wider">
                  INTEGRASI
                </span>
                <span className="text-lg sm:text-xl font-black text-[#2D4558] tracking-tight block">
                  100%
                </span>
                <span className="text-[10px] text-[#2D4558] font-semibold block">
                  Rapor Siswa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Pilih Nama Ananda */}
        {!selectedStudent ? (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <span className="w-8 h-8 rounded-full bg-[#FAF5F0] text-[#9B3F18] font-black text-sm inline-flex items-center justify-center mb-1">
                1
              </span>
              <h2 className="text-lg font-black text-[#22352B]">
                Pilih Nama Putra/Putri Anda
              </h2>
              <p className="text-xs text-[#565C58]">
                Silakan ketik nama panggilan atau nomor pendaftaran ananda untuk memulai pengisian kuesioner.
              </p>
            </div>

            {/* Input Pencarian */}
            <div className="relative">
              <i className="mdi mdi-magnify absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#787F7A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama ananda..."
                className="w-full bg-[#FAF8F5] border-2 border-[#E8E2D8] rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-[#22352B] font-bold focus:bg-white focus:outline-none focus:border-[#284034]"
              />
            </div>

            {/* Daftar Siswa */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-[#787F7A] font-semibold">
                  <i className="mdi mdi-loading mdi-spin text-xl block mb-1 text-[#2E6B4D]" />
                  <span>Memuat daftar calon siswa...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#787F7A] italic">
                  Nama ananda tidak ditemukan. Mohon periksa ejaan atau hubungi panitia di meja registrasi.
                </div>
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className="w-full text-left bg-[#FAF8F5] hover:bg-[#E4EFE9] border border-[#E8E2D8] hover:border-[#CBE0D4] p-3.5 rounded-2xl transition flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-[#22352B] group-hover:text-[#284034] truncate">
                        {s.full_name}
                      </p>
                      <p className="text-[11px] text-[#787F7A] font-medium mt-0.5">
                        Panggilan: <strong className="text-[#22352B]">&ldquo;{s.nickname}&rdquo;</strong> &bull; No: {s.registration_no}
                      </p>
                    </div>
                    <span className="w-7 h-7 rounded-full bg-white group-hover:bg-[#284034] group-hover:text-white text-[#787F7A] flex items-center justify-center flex-shrink-0 shadow-2xs transition">
                      <i className="mdi mdi-chevron-right text-base" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Siswa Terpilih Header Box */
          <div className="bg-white border-2 border-[#2E6B4D] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#2E6B4D] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                {selectedStudent.nickname?.slice(0, 2).toUpperCase() || "AN"}
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-black uppercase text-[#2E6B4D] tracking-wide block">
                  ANANDA TERPILIH
                </span>
                <p className="font-black text-xs sm:text-sm text-[#22352B] truncate leading-tight">
                  {selectedStudent.full_name}
                </p>
                <p className="text-[10.5px] text-[#787F7A] mt-0.5">
                  No. Reg: {selectedStudent.registration_no} &bull; Ortu: {selectedStudent.parent_name || "-"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setAnswers({});
              }}
              className="text-xs font-bold text-[#9B3F18] hover:underline flex-shrink-0"
            >
              Ganti Anak
            </button>
          </div>
        )}

        {/* Step 2: Pertanyaan Kuesioner (Hanya Muncul jika Siswa Sudah Dipilih) */}
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#565C58]">
                Pertanyaan Kuesioner
              </h3>
              <span className="text-xs font-bold text-[#2E6B4D]">
                {answeredCount} dari {questions.length} Terjawab
              </span>
            </div>

            {questions.map((q, qIdx) => {
              const selectedOpt = answers[q.id];

              return (
                <div
                  key={q.id || qIdx}
                  className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#284034] text-white font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-[#22352B] leading-snug">
                      {q.question}
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === opt;

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-semibold transition flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                            isSelected
                              ? "bg-[#F4F8F5] border-[#2E6B4D] text-[#284034] shadow-2xs font-bold ring-1 ring-[#2E6B4D]"
                              : "bg-[#FAF8F5] border-[#E8E2D8] text-[#565C58] hover:bg-white hover:text-[#22352B]"
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                              isSelected
                                ? "border-[#2E6B4D] bg-[#2E6B4D] text-white"
                                : "border-[#DDD7CE] bg-white"
                            }`}
                          >
                            {isSelected && <i className="mdi mdi-check text-xs" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Tombol Kirim */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#2E6B4D] hover:bg-[#24543D] text-white py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="mdi mdi-loading mdi-spin text-lg" />
                    <span>Menyimpan Jawaban...</span>
                  </>
                ) : (
                  <>
                    <i className="mdi mdi-send-check text-lg" />
                    <span>Kirim Jawaban Kuesioner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
