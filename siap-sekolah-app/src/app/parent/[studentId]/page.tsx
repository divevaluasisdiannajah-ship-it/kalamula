"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Leaf } from "@phosphor-icons/react";
import { DEFAULT_QUESTIONS, type QuestionnaireQuestion } from "@/types/questionnaire";

export default function ParentFormPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(DEFAULT_QUESTIONS);
  const [student, setStudent] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        fetch("/api/questionnaire"),
        fetch(`/api/students/${studentId}`),
      ]);

      if (qRes.ok) {
        const qJson = await qRes.json();
        if (qJson.data && Array.isArray(qJson.data)) {
          setQuestions(qJson.data);
        }
      }

      if (sRes.ok) {
        const sJson = await sRes.json();
        setStudent(sJson.data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert(`Mohon jawab seluruh ${questions.length} pertanyaan kuesioner terlebih dahulu.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/parent-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          batch_id: student?.batch_id || "active",
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
      alert("Koneksi jaringan terputus. Mohon periksa internet Anda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F6F2E9] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-5 shadow-xs">
          <CheckCircle weight="light" size={48} className="text-emerald-800" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight mb-2">
          Terima Kasih!
        </h1>
        <p className="text-xs sm:text-sm text-[#565C58] max-w-sm leading-relaxed">
          Kuesioner untuk Ananda <strong className="text-[#22352B] underline">{student?.full_name || "putra/putri Anda"}</strong> telah berhasil tersimpan dan langsung terintegrasi dengan laporan diagnostik kesiapan belajar.
        </p>
        <p className="text-[11px] text-[#787F7A] mt-6">
          Anda dapat menutup halaman ini atau kembali mendampingi ananda di ruang tunggu.
        </p>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isComplete = questions.length > 0 && answeredCount === questions.length;

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans pb-32">
      {/* Header with Soft Ambient Shadow */}
      <header className="bg-white border-b border-[#E8E2D8] px-4 py-4 text-center sticky top-0 z-20 shadow-2xs">
        <div className="w-11 h-11 bg-[#FAF5F0] rounded-2xl flex items-center justify-center mx-auto mb-2 text-[#9B3F18]">
          <Leaf weight="light" size={24} />
        </div>
        <p className="font-brand lowercase text-xl text-[#22352B] font-black tracking-tight leading-none">
          kalamula
        </p>
        <h1 className="text-sm sm:text-base font-black text-[#22352B] tracking-tight mt-1">
          Kuesioner Observasi Orang Tua
        </h1>
        <p className="text-[11px] text-[#787F7A] mt-0.5">
          SD Islam An Najah &bull; SPMB 2026/2027
        </p>
      </header>

      {/* Student Badge Card if loaded */}
      {student && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-white border border-[#DFE7E2] rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-[#2E6B4D] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
              {student.nickname?.slice(0, 2).toUpperCase() || "AN"}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-[#22352B] truncate leading-tight">
                {student.full_name}
              </p>
              <p className="text-[10.5px] text-[#787F7A] mt-0.5">
                Panggilan: &ldquo;{student.nickname}&rdquo; &bull; No: {student.registration_no}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <p className="text-xs text-[#565C58] bg-white border border-[#E8E2D8] rounded-2xl p-3.5 shadow-2xs leading-relaxed">
          Mohon jawab pertanyaan singkat berikut sementara ananda menjalani kegiatan observasi di pos. Data ini bersifat <strong>rahasia</strong> dan bertujuan membantu guru merancang pendekatan pembelajaran yang tepat.
        </p>
      </div>

      {/* Questions List */}
      <div className="max-w-lg mx-auto px-4 space-y-4">
        {questions.map((q, idx) => (
          <fieldset
            key={q.id}
            className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs"
            role="radiogroup"
            aria-labelledby={`q-label-${q.id}`}
          >
            <legend id={`q-label-${q.id}`} className="text-xs font-bold text-[#22352B] mb-3 leading-snug">
              <span className="text-[#9B3F18] font-black mr-1">{idx + 1}.</span> {q.question}
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
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all text-xs border cursor-pointer active:scale-[0.99]
                      ${
                        isSelected
                          ? "bg-[#F4F8F5] border-[#2E6B4D] text-[#284034] font-bold shadow-2xs ring-1 ring-[#2E6B4D]"
                          : "bg-[#FAF8F5] border-[#E8E2D8] text-[#565C58] hover:bg-white hover:text-[#22352B]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                          ${
                            isSelected
                              ? "border-[#2E6B4D] bg-[#2E6B4D] text-white"
                              : "border-[#DDD7CE] bg-white"
                          }`}
                      >
                        {isSelected && <i className="mdi mdi-check text-[10px]" />}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
            className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95
              ${
                isComplete && !submitting
                  ? "bg-[#2E6B4D] hover:bg-[#24543D] text-white"
                  : "bg-[#EFECE4] text-[#A8A09A] cursor-not-allowed"
              }`}
          >
            {submitting ? (
              <span>Mengirim Jawaban...</span>
            ) : isComplete ? (
              <span>Kirim Jawaban Kuesioner</span>
            ) : (
              <span>Lengkapi Seluruh Pertanyaan ({answeredCount}/{questions.length})</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
