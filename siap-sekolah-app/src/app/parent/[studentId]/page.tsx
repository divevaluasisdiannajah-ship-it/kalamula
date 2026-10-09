"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Leaf } from "@phosphor-icons/react";

const PARENT_QUESTIONS = [
  {
    id: "q1",
    question: "Apakah putra/putri Anda pernah mengikuti pendidikan PAUD/TK?",
    options: ["Belum pernah", "TK 1 tahun", "TK 2 tahun (A dan B)", "PAUD dan TK lengkap"],
  },
  {
    id: "q2",
    question: "Bagaimana kebiasaan anak saat berpisah dari orang tua di pagi hari?",
    options: ["Sering menangis lama", "Kadang cemas", "Tenang setelah dibujuk", "Mandiri dan antusias"],
  },
  {
    id: "q3",
    question: "Apakah anak sudah dapat makan, minum, dan ke toilet secara mandiri?",
    options: ["Belum mandiri", "Bisa makan sendiri saja", "Bisa makan dan ke toilet", "Mandiri sepenuhnya"],
  },
  {
    id: "q4",
    question: "Apakah anak memiliki riwayat keterlambatan bicara atau terapi tumbuh kembang?",
    options: ["Tidak ada", "Pernah speech therapy", "Sedang menjalani terapi", "Ada kondisi khusus lain"],
  },
  {
    id: "q5",
    question: "Berapa lama rata-rata anak dapat fokus pada satu aktivitas bermain atau mewarnai?",
    options: ["Kurang dari 5 menit", "5-10 menit", "10-20 menit", "Lebih dari 20 menit"],
  },
];

export default function ParentFormPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < PARENT_QUESTIONS.length) {
      alert("Mohon jawab seluruh 5 pertanyaan kuesioner terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/parent-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          batch_id: "active",
          responses_json: answers,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Gagal mengirim jawaban. Silakan coba lagi.");
      }
    } catch {
      alert("Koneksi jaringan terputus. Mohon periksa internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-ios-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 shadow-ios-sm">
          <CheckCircle weight="light" size={48} className="text-emerald-800" />
        </div>
        <h1 className="text-xl font-bold text-ios-label tracking-tight mb-2">Terima Kasih!</h1>
        <p className="text-xs text-ios-label-secondary max-w-sm leading-relaxed">
          Kuesioner Anda telah berhasil tersimpan dan langsung terintegrasi dengan laporan profil diagnostik kesiapan belajar putra/putri Anda.
        </p>
        <p className="text-[11px] text-ios-label-tertiary mt-6">
          Anda dapat menutup halaman ini atau kembali mendampingi anak di ruang tunggu.
        </p>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === PARENT_QUESTIONS.length;

  return (
    <main className="min-h-screen bg-ios-bg pb-32">
      {/* Header with Soft Ambient Shadow */}
      <header className="bg-ios-surface shadow-[0_2px_14px_rgba(30,35,32,0.03)] px-4 py-4 text-center">
        <div className="w-12 h-12 bg-sage-100 rounded-ios-md flex items-center justify-center mx-auto mb-2 shadow-xs">
          <Leaf weight="light" size={24} className="text-sage-800" />
        </div>
        <p className="font-brand lowercase text-2xl text-ios-label font-bold tracking-tight">kalamula</p>
        <h1 className="text-base sm:text-lg font-bold text-ios-label tracking-tight mt-0.5">Kuesioner Orang Tua Calon Siswa</h1>
        <p className="text-xs text-ios-label-secondary mt-1">
          Memandu Transisi, Memetakan Fondasi
        </p>
      </header>

      {/* Instructions */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <p className="text-xs text-ios-label-secondary bg-ios-surface rounded-xl p-3.5 shadow-xs leading-relaxed">
          Mohon isi 5 pertanyaan singkat berikut sementara putra/putri Anda menjalani observasi di pos. Data ini bersifat <strong>rahasia</strong> dan bertujuan membantu guru merancang diferensiasi pembelajaran yang tepat.
        </p>
      </div>

      {/* Questions List */}
      <div className="max-w-lg mx-auto px-4 space-y-4">
        {PARENT_QUESTIONS.map((q, idx) => (
          <fieldset key={q.id} className="ios-card p-4 sm:p-5 shadow-ios-card" role="radiogroup" aria-labelledby={`q-label-${q.id}`}>
            <legend id={`q-label-${q.id}`} className="text-xs font-bold text-ios-label mb-3 leading-snug">
              <span className="text-sage-800 mr-1">{idx + 1}.</span> {q.question}
            </legend>
            <div className="space-y-2">
              {q.options.map((option) => {
                const isSelected = answers[q.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(q.id, option)}
                    className={`w-full text-left px-4 py-3 rounded-ios-md shadow-xs transition-all text-xs
                      focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:outline-none
                      ${
                        isSelected
                          ? "bg-sage-100 text-sage-950 font-bold shadow-ios-sm"
                          : "bg-warm-50/70 text-ios-label hover:bg-warm-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                          ${
                            isSelected
                              ? "border-sage-700 bg-sage-700 text-white"
                              : "border-neutral-300"
                          }
                        `}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Fixed Bottom Action Bar with Ambient Shadow */}
      <div className="fixed bottom-0 left-0 right-0 bg-ios-surface/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(30,35,32,0.06)] px-4 py-3 pb-safe-bottom z-30">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-ios-label-secondary">
              {answeredCount} dari {PARENT_QUESTIONS.length} pertanyaan terjawab
            </span>
            {/* Progress Bar */}
            <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-sage-600 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / PARENT_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !isComplete}
            className={`ios-btn w-full text-xs font-bold rounded-ios-md transition-all
              focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:outline-none
              ${
                isComplete
                  ? "bg-ios-blue text-white shadow-ios-sm hover:bg-sage-600"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}
          >
            {submitting ? "Mengirim Jawaban..." : isComplete ? "Kirim Jawaban Kuesioner" : `Lengkapi ${PARENT_QUESTIONS.length - answeredCount} Pertanyaan Lagi`}
          </button>
        </div>
      </div>
    </main>
  );
}
