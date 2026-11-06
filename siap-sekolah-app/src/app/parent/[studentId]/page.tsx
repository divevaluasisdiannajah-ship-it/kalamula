"use client";
export const runtime = 'edge';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Leaf, UserCheck, Heartbeat, NotePencil } from "@phosphor-icons/react";
import { DEFAULT_QUESTIONS, type QuestionnaireQuestion } from "@/types/questionnaire";

export default function ParentFormPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(DEFAULT_QUESTIONS);
  const [student, setStudent] = useState<any | null>(null);
  const [parentName, setParentName] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
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
        if (sJson.data?.parent_name) {
          setParentName(sJson.data.parent_name);
        }
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
      const payloadAnswers: Record<string, string> = {
        ...answers,
        __parent_name: parentName.trim() || student?.parent_name || "",
        __special_notes: specialNotes.trim(),
      };

      const res = await fetch("/api/parent-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          batch_id: student?.batch_id || "active",
          responses_json: payloadAnswers,
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

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const map = new Map<string, { category: string; list: { q: QuestionnaireQuestion; index: number }[] }>();
    questions.forEach((q, idx) => {
      const cat = q.category || "Pertanyaan Kuesioner";
      if (!map.has(cat)) {
        map.set(cat, { category: cat, list: [] });
      }
      map.get(cat)!.list.push({ q, index: idx });
    });
    return Array.from(map.values());
  }, [questions]);

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
          Kuesioner profil kesiapan bersekolah untuk Ananda <strong className="text-[#22352B] underline">{student?.full_name || "putra/putri Anda"}</strong> telah berhasil tersimpan dan langsung terintegrasi dengan laporan diagnostik kesiapan belajar.
        </p>
        <div className="mt-5 p-3.5 bg-white rounded-2xl border border-[#E8E2D8] max-w-xs text-left text-xs space-y-1">
          <div className="text-[10px] text-[#787F7A] uppercase font-bold tracking-wider">Ringkasan Respon</div>
          <div className="font-bold text-[#22352B] flex justify-between">
            <span>Total Pertanyaan:</span>
            <span className="text-emerald-700">{questions.length} / {questions.length} Terjawab</span>
          </div>
          {parentName && (
            <div className="text-[11px] text-[#565C58]">
              Wali: <strong>{parentName}</strong>
            </div>
          )}
        </div>
        <p className="text-[11px] text-[#787F7A] mt-6">
          Anda dapat menutup halaman ini atau kembali mendampingi ananda di ruang tunggu.
        </p>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const isComplete = questions.length > 0 && answeredCount === questions.length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans pb-36">
      {/* Header with Soft Ambient Shadow */}
      <header className="bg-white border-b border-[#E8E2D8] px-4 py-3.5 text-center sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FAF5F0] rounded-xl flex items-center justify-center text-[#9B3F18]">
              <Leaf weight="light" size={18} />
            </div>
            <div className="text-left leading-none">
              <span className="font-brand lowercase text-base text-[#22352B] font-black tracking-tight block">
                kalamula
              </span>
              <span className="text-[10px] text-[#787F7A]">SD Islam An Najah</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E4EFE9] text-[#2E6B4D] text-[10.5px] font-bold">
              {answeredCount}/{questions.length} Terjawab
            </span>
          </div>
        </div>

        {/* Thin Progress Line */}
        <div className="w-full bg-[#E8E2D8] h-1 mt-2.5 rounded-full overflow-hidden max-w-lg mx-auto">
          <div
            className="bg-[#2E6B4D] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Student Hero Banner (Varian E Megamendung) */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative overflow-hidden bg-[#2D4535] rounded-3xl p-5 shadow-sm text-white">
          <div className="bg-megamendung-overlay" aria-hidden="true" />

          <div className="relative z-10 space-y-3.5">
            {/* Top row: badge + status */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2D4535] text-xs font-black shadow-xs tracking-wider uppercase">
                <Leaf weight="bold" size={14} className="text-[#2D4535]" />
                KUESIONER ORANG TUA
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[#2D4535] text-xs font-bold shadow-xs">
                <span>SPMB 2026/2027</span>
              </div>
            </div>

            {/* Student Identity Card (Solid White Varian E) */}
            {student ? (
              <div className="bg-white rounded-2xl p-3.5 text-[#22352B] shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2E6B4D] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {student.nickname?.slice(0, 2).toUpperCase() || "AN"}
                </div>
                <div className="min-w-0">
                  <span className="text-[9.5px] font-black uppercase text-[#2E6B4D] tracking-wide block">
                    ANANDA TERPILIH
                  </span>
                  <p className="font-black text-sm sm:text-base text-[#22352B] truncate leading-tight">
                    {student.full_name}
                  </p>
                  <p className="text-[11px] text-[#787F7A] mt-0.5">
                    Panggilan: &ldquo;{student.nickname}&rdquo; &bull; No: {student.registration_no}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 rounded-2xl p-3 text-center text-xs text-white/80">
                Memuat data ananda...
              </div>
            )}

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="bg-white rounded-xl p-2 text-center shadow-xs">
                <span className="block text-[9.5px] font-bold text-[#787F7A] uppercase tracking-wider">
                  PERTANYAAN
                </span>
                <span className="text-base font-black text-[#2D4535] block">
                  {questions.length}
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 text-center shadow-xs">
                <span className="block text-[9.5px] font-bold text-[#787F7A] uppercase tracking-wider">
                  TERJAWAB
                </span>
                <span className="text-base font-black text-[#8C3713] block">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="bg-white rounded-xl p-2 text-center shadow-xs">
                <span className="block text-[9.5px] font-bold text-[#787F7A] uppercase tracking-wider">
                  ESTIMASI
                </span>
                <span className="text-base font-black text-[#2D4558] block">
                  ~4 Menit
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Identitas Pengisi & Petunjuk */}
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* Nama Orang Tua Input Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-[#22352B]">
            Nama Orang Tua / Wali Pengisi:
          </label>
          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-[#2E6B4D]">
            <UserCheck size={18} className="text-[#787F7A]" />
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Tulis nama lengkap Bapak / Ibu..."
              className="w-full bg-transparent text-xs text-[#22352B] font-semibold focus:outline-none placeholder:text-[#A8A09A]"
            />
          </div>
        </div>

        {/* Petunjuk Pengisian Singkat */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-3.5 shadow-2xs text-xs text-[#565C58] space-y-1">
          <p className="font-bold text-[#22352B] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9B3F18]" />
            Petunjuk Pengisian:
          </p>
          <p className="leading-relaxed">
            Pilihlah salah satu opsi yang paling menggambarkan kebiasaan ananda sehari-hari di rumah:
          </p>
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-bold text-[11px]">
            <span className="bg-[#E4EFE9] text-[#2E6B4D] py-1 rounded-lg">Selalu (S)</span>
            <span className="bg-[#FAF5F0] text-[#9B3F18] py-1 rounded-lg">Kadang-Kadang (K)</span>
            <span className="bg-[#F0ECE1] text-[#565C58] py-1 rounded-lg">Belum (B)</span>
          </div>
        </div>
      </div>

      {/* Grouped Questions List */}
      <div className="max-w-lg mx-auto px-4 space-y-5">
        {groupedQuestions.map((group, gIdx) => (
          <div key={group.category || gIdx} className="space-y-3">
            {/* Category Header */}
            <div className="sticky top-14 z-10 bg-[#F6F2E9]/95 backdrop-blur-xs py-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#284034] text-white text-[11px] font-black tracking-wide shadow-2xs">
                <span>{group.category}</span>
              </div>
            </div>

            {/* Questions in Category */}
            {group.list.map(({ q, index }) => {
              const currentVal = answers[q.id];
              return (
                <fieldset
                  key={q.id}
                  className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs transition hover:border-[#DDD7CE]"
                  role="radiogroup"
                  aria-labelledby={`q-label-${q.id}`}
                >
                  <legend id={`q-label-${q.id}`} className="text-xs font-bold text-[#22352B] mb-3 leading-snug">
                    <span className="text-[#9B3F18] font-black mr-1">{index + 1}.</span> {q.question}
                  </legend>

                  {/* 3-Pill Horizontal Buttons for Standard Options */}
                  {q.options.length === 3 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {q.options.map((option) => {
                        const isSelected = currentVal === option;
                        let activeColor = "bg-[#2E6B4D] text-white border-[#2E6B4D]";
                        if (option.toLowerCase().includes("kadang")) {
                          activeColor = "bg-[#9B3F18] text-white border-[#9B3F18]";
                        } else if (option.toLowerCase().includes("belum")) {
                          activeColor = "bg-[#565C58] text-white border-[#565C58]";
                        }

                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelect(q.id, option)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer active:scale-95 flex flex-col items-center justify-center gap-0.5
                              ${
                                isSelected
                                  ? `${activeColor} shadow-xs ring-1`
                                  : "bg-[#FAF8F5] border-[#E8E2D8] text-[#565C58] hover:bg-white hover:text-[#22352B]"
                              }`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Fallback for Variable Options */
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isSelected = currentVal === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelect(q.id, option)}
                            className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-xs border cursor-pointer active:scale-[0.99]
                              ${
                                isSelected
                                  ? "bg-[#F4F8F5] border-[#2E6B4D] text-[#284034] font-bold shadow-2xs ring-1 ring-[#2E6B4D]"
                                  : "bg-[#FAF8F5] border-[#E8E2D8] text-[#565C58] hover:bg-white hover:text-[#22352B]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                  ${isSelected ? "border-[#2E6B4D] bg-[#2E6B4D]" : "border-[#DDD7CE] bg-white"}`}
                              />
                              <span>{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>
        ))}

        {/* Catatan Khusus Orang Tua (Opsional) */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#9B3F18]">
            <Heartbeat size={20} weight="bold" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
              Catatan Khusus Orang Tua (Opsional)
            </h3>
          </div>
          <p className="text-[11px] text-[#787F7A] leading-relaxed">
            Tuliskan jika anak memiliki riwayat kesehatan/alergi tertentu, pemicu kecemasan khusus (misal: takut suara keras/keramaian), atau hal penting yang perlu diketahui sekolah:
          </p>
          <textarea
            rows={3}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Contoh: Ananda sensitif terhadap suara balon meletus; ada alergi telur..."
            className="w-full bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3 text-xs text-[#22352B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E6B4D] placeholder:text-[#A8A09A]"
          />
        </div>

        {/* Submit Card & Floating Trigger */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
            className={`w-full py-4 px-6 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95
              ${
                isComplete && !submitting
                  ? "bg-[#2E6B4D] hover:bg-[#24543D] text-white"
                  : "bg-[#EFECE4] text-[#A8A09A] cursor-not-allowed"
              }`}
          >
            {submitting ? (
              <span>Menyimpan Jawaban...</span>
            ) : isComplete ? (
              <span>Kirim Jawaban Kuesioner Sekarang &rarr;</span>
            ) : (
              <span>Lengkapi Seluruh Pertanyaan ({answeredCount}/{questions.length})</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
