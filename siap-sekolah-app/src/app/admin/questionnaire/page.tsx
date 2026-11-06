"use client";
export const runtime = "edge";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DEFAULT_QUESTIONS,
  QUESTIONNAIRE_CATEGORIES,
  type QuestionnaireQuestion,
} from "@/types/questionnaire";

export default function AdminQuestionnairePage() {
  const [activeTab, setActiveTab] = useState<"editor" | "standee" | "responses">("editor");
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(DEFAULT_QUESTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Responses & Students state
  const [students, setStudents] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedResponseStudent, setSelectedResponseStudent] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, sRes, rRes] = await Promise.all([
        fetch("/api/questionnaire"),
        fetch("/api/students"),
        fetch("/api/parent-responses"),
      ]);

      if (qRes.ok) {
        const qJson = await qRes.json();
        if (qJson.data && Array.isArray(qJson.data)) {
          setQuestions(qJson.data);
        }
      }

      if (sRes.ok) {
        const sJson = await sRes.json();
        setStudents(sJson.data || []);
      }

      if (rRes.ok) {
        const rJson = await rRes.json();
        const rList = rJson.data || [];
        const rMap: Record<string, any> = {};
        rList.forEach((r: any) => {
          rMap[r.student_id] = r;
        });
        setResponses(rMap);
      }
    } catch {
      // Offline / fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Question Editor Helpers ─────────────────────────────────────
  const addQuestion = () => {
    const newId = `q${Date.now().toString().slice(-4)}`;
    setQuestions([
      ...questions,
      {
        id: newId,
        category: "A. Kemandirian & Perawatan Diri (Self-Care)",
        question: "",
        options: ["Selalu", "Kadang-Kadang", "Belum"],
      },
    ]);
  };

  const updateQuestionCategory = (index: number, category: string) => {
    const updated = [...questions];
    updated[index].category = category;
    setQuestions(updated);
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push(`Pilihan ${updated[qIndex].options.length + 1}`);
    setQuestions(updated);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      alert("Pertanyaan minimal memiliki 2 pilihan jawaban.");
      return;
    }
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
    setQuestions(updated);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      alert("Kuesioner minimal memiliki 1 pertanyaan.");
      return;
    }
    if (confirm("Hapus pertanyaan ini dari kuesioner?")) {
      setQuestions(questions.filter((_, i) => i !== qIndex));
    }
  };

  const resetToDefault20Questions = () => {
    if (confirm("Muat ulang seluruh 20 pertanyaan standar Kemampuan Fondasi PAUD ke SD?")) {
      setQuestions(DEFAULT_QUESTIONS);
    }
  };

  const saveQuestions = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        alert(`Pertanyaan #${i + 1} belum memiliki teks pertanyaan.`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].trim()) {
          alert(`Pilihan #${j + 1} pada pertanyaan #${i + 1} tidak boleh kosong.`);
          return;
        }
      }
    }

    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/questionnaire", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert("Gagal menyimpan perubahan pertanyaan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintStandee = () => {
    window.print();
  };

  // Filtered students for response tab
  const filteredStudents = students.filter((s) => {
    const q = searchStudent.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.nickname?.toLowerCase().includes(q) ||
      s.registration_no?.toLowerCase().includes(q)
    );
  });

  const answeredCount = Object.keys(responses).length;
  const totalStudents = students.length;

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Embedded Print Style for A4 Standee ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 15mm 10mm 15mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #22352B !important;
          }
          .screen-only {
            display: none !important;
          }
          .standee-print-card {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-shadow: none !important;
            border: 2px solid #284034 !important;
            border-radius: 24px !important;
            padding: 24mm 16mm !important;
            height: 275mm !important;
            max-height: 275mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── Screen Header ─── */}
      <div className="screen-only flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B85627]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#B85627]">
              SPMB SD ISLAM AN NAJAH
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#22352B] tracking-tight mt-1">
            Kuesioner Orang Tua &amp; Standee QR
          </h1>
          <p className="text-xs text-[#565C58] mt-0.5">
            Kelola profil kesiapan bersekolah 6 kemampuan fondasi PAUD ke SD &amp; cetak 1 lembar QR Code ruang tunggu.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D8] p-1 rounded-2xl text-xs gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "editor"
                ? "bg-[#284034] text-white shadow-2xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            <i className="mdi mdi-tune text-base" />
            <span>Editor Pertanyaan ({questions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("standee")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "standee"
                ? "bg-[#284034] text-white shadow-2xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            <i className="mdi mdi-qrcode-scan text-base" />
            <span>Cetak Standee QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("responses")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "responses"
                ? "bg-[#284034] text-white shadow-2xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            <i className="mdi mdi-account-check-outline text-base" />
            <span>Rekap Respon ({answeredCount}/{totalStudents})</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: EDITOR PERTANYAAN (MANDIRI) ─────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "editor" && (
        <div className="screen-only space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#22352B]">
                Daftar Pertanyaan Kuesioner ({questions.length} Pertanyaan)
              </h2>
              <p className="text-xs text-[#787F7A]">
                Disusun berdasarkan 6 Kemampuan Fondasi Transisi PAUD ke SD (Kemendikbudristek).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={resetToDefault20Questions}
                className="bg-[#FAF8F5] hover:bg-white border border-[#E8E2D8] text-[#565C58] hover:text-[#22352B] px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Muat ulang 20 pertanyaan baku"
              >
                <i className="mdi mdi-restore text-base" />
                <span>Reset 20 Soal Baku</span>
              </button>

              <button
                type="button"
                onClick={addQuestion}
                className="bg-white hover:bg-[#FAF8F5] border border-[#E8E2D8] text-[#22352B] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <i className="mdi mdi-plus text-base text-[#2E6B4D]" />
                <span>Tambah Pertanyaan</span>
              </button>

              <button
                type="button"
                onClick={saveQuestions}
                disabled={saving}
                className="bg-[#2E6B4D] hover:bg-[#24543D] text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <i className="mdi mdi-loading mdi-spin text-base" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <i className="mdi mdi-content-save-outline text-base" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-[#E4EFE9] border border-[#CBE0D4] text-[#2E6B4D] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
              <i className="mdi mdi-check-circle text-lg" />
              <span>Pembaruan kuesioner berhasil disimpan ke database. Pertanyaan langsung aktif di link kuesioner orang tua.</span>
            </div>
          )}

          {/* List of Questions */}
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-[#DDD7CE] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#284034] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      {qIndex + 1}
                    </span>
                    <span className="text-xs font-extrabold text-[#787F7A] uppercase tracking-wider">
                      Pertanyaan #{qIndex + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-[#9B3F18] hover:bg-[#FAF5F0] p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Hapus Pertanyaan"
                  >
                    <i className="mdi mdi-trash-can-outline text-base" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>

                {/* Kategori Pertanyaan */}
                <div>
                  <label className="block text-[11px] font-bold text-[#565C58] mb-1">
                    Dimensi / Kategori Kemampuan Fondasi
                  </label>
                  <select
                    value={q.category || QUESTIONNAIRE_CATEGORIES[0]}
                    onChange={(e) => updateQuestionCategory(qIndex, e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#22352B] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6B4D]"
                  >
                    {QUESTIONNAIRE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Pertanyaan */}
                <div>
                  <label className="block text-[11px] font-bold text-[#565C58] mb-1">
                    Kalimat Pertanyaan
                  </label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    placeholder="Contoh: Mampu makan dan minum sendiri secara mandiri dan rapi."
                    className="w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#22352B] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6B4D]"
                  />
                </div>

                {/* Pilihan Jawaban */}
                <div className="space-y-2 pt-1 border-t border-[#FAF8F5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#565C58]">
                      Pilihan Jawaban (Pilihan Ganda / Radio Chips)
                    </span>
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-[#2E6B4D] hover:underline text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <i className="mdi mdi-plus-circle-outline text-sm" />
                      <span>Tambah Opsi</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {q.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-1.5 pl-3 focus-within:bg-white focus-within:border-[#2E6B4D]"
                      >
                        <span className="text-[10px] font-bold text-[#787F7A] w-4">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                          placeholder={`Opsi ${optIndex + 1}`}
                          className="flex-1 bg-transparent text-xs text-[#22352B] focus:outline-none font-medium"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="text-[#787F7A] hover:text-[#9B3F18] p-1 rounded transition cursor-pointer"
                            title="Hapus opsi"
                          >
                            <i className="mdi mdi-close text-xs" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={saveQuestions}
              disabled={saving}
              className="bg-[#2E6B4D] hover:bg-[#24543D] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <i className="mdi mdi-content-save-outline text-base" />
              <span>Simpan Seluruh Pertanyaan</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: STANDEE CETAK QR RUANG TUNGGU (A4 SIAP PRINT) ────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "standee" && (
        <div className="space-y-4">
          <div className="screen-only flex items-center justify-between bg-white border border-[#E8E2D8] p-4 rounded-2xl shadow-2xs">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                Pratinjau Lembar Standee Ruang Tunggu (Format A4)
              </h3>
              <p className="text-xs text-[#787F7A]">
                Cetak lembar ini, laminating, atau letakkan pada akrilik meja di ruang tunggu wali murid.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintStandee}
              className="bg-[#9B3F18] hover:bg-[#853714] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <i className="mdi mdi-printer text-base" />
              <span>Cetak Standee (A4)</span>
            </button>
          </div>

          {/* Standee A4 Printable Box */}
          <div className="standee-print-card max-w-[650px] mx-auto bg-white border-2 border-[#284034] rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
            {/* Header Standee Bertekstur Megamendung (Varian E) */}
            <div className="relative overflow-hidden bg-[#284034] rounded-2xl p-6 sm:p-7 text-white shadow-sm">
              <div className="bg-megamendung-overlay" aria-hidden="true" />
              <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#284034] flex items-center justify-center text-2xl shadow-xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
                  YAYASAN PENDIDIKAN ISLAM AN-NAJAH MANDIRI &bull; SPMB 2026/2027
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  SD Islam An Najah
                </h2>
                <div className="inline-block bg-white text-[#284034] text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-xs mt-1">
                  Kuesioner Kesiapan Belajar &amp; Kebiasaan Anak di Rumah
                </div>
                <p className="text-[10px] text-white/80 max-w-sm mt-1">
                  6 Kemampuan Fondasi Transisi PAUD ke SD
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="py-2 flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-white border-4 border-[#284034] rounded-2xl shadow-md inline-block">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fobservasi.sdiannajah.ai.id%2Fparent&color=22352B&bgcolor=FFFFFF"
                  alt="QR Code Kuesioner Orang Tua"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              </div>

              <div className="space-y-0.5">
                <p className="font-mono font-black text-sm text-[#22352B] tracking-wide">
                  observasi.sdiannajah.ai.id/parent
                </p>
                <p className="text-xs font-bold text-[#9B3F18]">
                  Pindai / Scan QR Code Melalui Kamera Ponsel
                </p>
              </div>
            </div>

            {/* 3 Petunjuk Singkat */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 text-left space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#284034] text-center mb-1">
                Langkah Pengisian Kuesioner:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#565C58]">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#E8E2D8]">
                  <span className="w-5 h-5 rounded-full bg-[#284034] text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <p className="text-[11px] leading-tight">
                    Buka kamera ponsel Anda dan arahkan ke QR Code.
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#E8E2D8]">
                  <span className="w-5 h-5 rounded-full bg-[#284034] text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <p className="text-[11px] leading-tight">
                    Cari &amp; pilih nama ananda dari daftar siswa.
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-[#E8E2D8]">
                  <span className="w-5 h-5 rounded-full bg-[#284034] text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <p className="text-[11px] leading-tight">
                    Pilih kebiasaan ananda (Selalu / Kadang / Belum) &amp; kirim.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Standee */}
            <p className="text-[10px] text-[#787F7A] pt-2 border-t border-[#E8E2D8]">
              Data kuesioner otomatis terhubung dengan dokumen diagnostik kesiapan belajar ananda &bull; Panitia SPMB SD Islam An Najah
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 3: REKAP RESPON WALI MURID ─────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "responses" && (
        <div className="screen-only space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E8E2D8] p-4 rounded-2xl shadow-2xs">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                Monitoring Pengisian Kuesioner Orang Tua
              </h3>
              <p className="text-xs text-[#787F7A]">
                Total: <strong className="text-[#2E6B4D]">{answeredCount}</strong> sudah mengisi dari{" "}
                <strong className="text-[#22352B]">{totalStudents}</strong> calon siswa terdaftar.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <i className="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#787F7A]" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#22352B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6B4D]"
              />
            </div>
          </div>

          {/* Table of Students & Response Status */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] text-[#565C58] font-bold text-[11px] border-b border-[#E8E2D8]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Calon Siswa</th>
                  <th className="py-3 px-4">Wali Murid / Ortu</th>
                  <th className="py-3 px-4">Kelompok</th>
                  <th className="py-3 px-4 text-center">Status Kuesioner</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] text-[11.5px]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#787F7A] italic">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const resp = responses[s.id];
                    const isAnswered = !!resp;

                    return (
                      <tr key={s.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="py-2.5 px-4 text-center font-bold text-[#787F7A]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-[#22352B]">{s.full_name}</p>
                          <p className="text-[10px] text-[#787F7A] font-mono">
                            {s.registration_no} &bull; &ldquo;{s.nickname}&rdquo;
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-[#565C58]">
                          {s.parent_name || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-[#565C58]">
                          {s.observation_group || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {isAnswered ? (
                            <span className="inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2.5 py-1 rounded-full text-[10.5px] font-bold">
                              <i className="mdi mdi-check-circle text-xs" />
                              <span>Sudah Mengisi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#FAF5F0] text-[#9B3F18] px-2.5 py-1 rounded-full text-[10.5px] font-bold">
                              <i className="mdi mdi-clock-outline text-xs" />
                              <span>Belum Mengisi</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isAnswered ? (
                            <button
                              type="button"
                              onClick={() => setSelectedResponseStudent({ student: s, response: resp })}
                              className="text-[#2E6B4D] hover:underline font-bold text-xs cursor-pointer"
                            >
                              Lihat Jawaban
                            </button>
                          ) : (
                            <Link
                              href={`/parent/${s.id}`}
                              target="_blank"
                              className="text-[#9B3F18] hover:underline font-semibold text-xs"
                            >
                              Buka Link Form
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal View Detail Jawaban */}
          {selectedResponseStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-[#E8E2D8] max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between pb-3 border-b border-[#E8E2D8]">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#2E6B4D]">
                      JAWABAN KUESIONER ORANG TUA (20 INDIKATOR)
                    </span>
                    <h3 className="text-base font-black text-[#22352B]">
                      {selectedResponseStudent.student.full_name}
                    </h3>
                    <p className="text-xs text-[#787F7A]">
                      No. Reg: {selectedResponseStudent.student.registration_no} &bull; Panggilan: &ldquo;{selectedResponseStudent.student.nickname}&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedResponseStudent(null)}
                    className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#787F7A] hover:text-[#22352B] flex items-center justify-center cursor-pointer"
                  >
                    <i className="mdi mdi-close text-lg" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                  {(() => {
                    const rawResp = selectedResponseStudent.response.responses_json;
                    const parsedResp = typeof rawResp === "string" ? JSON.parse(rawResp) : rawResp || {};
                    const pName = parsedResp.__parent_name || selectedResponseStudent.student.parent_name;
                    const sNotes = parsedResp.__special_notes;

                    return (
                      <>
                        {/* Identity & Special Notes Alert */}
                        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#787F7A]">Wali Pengisi:</span>
                            <span className="font-bold text-[#22352B]">{pName || "Tidak dicantumkan"}</span>
                          </div>
                          {sNotes && (
                            <div className="bg-[#FFF8E6] border border-[#F3DF9A] p-3 rounded-xl text-[#7A4B00] space-y-1">
                              <span className="font-black text-[10.5px] uppercase flex items-center gap-1 text-[#9B3F18]">
                                <i className="mdi mdi-alert-circle text-sm" /> Catatan Khusus Orang Tua:
                              </span>
                              <p className="text-xs leading-relaxed font-medium">{sNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Questions & Answers */}
                        <div className="space-y-2.5 pt-1">
                          {questions.map((q, qIdx) => {
                            const ans = parsedResp[q.id];
                            let badgeClass = "bg-[#E4EFE9] text-[#2E6B4D] border-[#CBE0D4]";
                            if (ans?.toLowerCase().includes("kadang")) {
                              badgeClass = "bg-[#FAF5F0] text-[#9B3F18] border-[#EAD5C5]";
                            } else if (ans?.toLowerCase().includes("belum")) {
                              badgeClass = "bg-[#F0ECE1] text-[#565C58] border-[#DDD7CE]";
                            }

                            return (
                              <div key={q.id || qIdx} className="bg-white border border-[#E8E2D8] rounded-xl p-3 space-y-1.5 shadow-2xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-[#787F7A] uppercase">
                                    {q.category || `Pertanyaan #${qIdx + 1}`}
                                  </span>
                                  {ans ? (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border ${badgeClass}`}>
                                      {ans}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                      Belum dijawab
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-[#22352B]">
                                  {qIdx + 1}. {q.question}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="pt-2 flex justify-end border-t border-[#E8E2D8]">
                  <button
                    type="button"
                    onClick={() => setSelectedResponseStudent(null)}
                    className="bg-[#284034] text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
