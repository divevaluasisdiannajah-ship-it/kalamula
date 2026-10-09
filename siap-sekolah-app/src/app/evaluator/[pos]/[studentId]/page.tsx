export const runtime = 'edge';
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { StudentHeroCard } from "@/components/aetrium/StudentHeroCard";
import { saveDraftEvaluation, loadDraftEvaluation, enqueuePendingSync } from "@/lib/idb";
import {
  ArrowLeft,
  BookOpen,
  Warning,
  NotePencil,
  Check,
  CaretRight,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import type { Student, AssessmentConfig, AssessmentConfigParsed, ReadingLevel, ScoreValue } from "@/types";

export default function EvaluationFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = params.studentId as string;
  const posNumber = Number(params.pos);
  const batchId = searchParams.get("batch") || "";

  // ─── State ───────────────────────────────────────────────────
  const [student, setStudent] = useState<Student | null>(null);
  const [config, setConfig] = useState<AssessmentConfigParsed | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreValue>>({});
  const [redFlags, setRedFlags] = useState<Record<string, boolean>>({});
  const [readingLevel, setReadingLevel] = useState<ReadingLevel | null>(null);
  const [anecdotalNote, setAnecdotalNote] = useState("");
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saved" | "syncing" | "error">("synced");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load Data & Restore Draft ──────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [sRes, cRes, eRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch("/api/configs"),
        fetch(`/api/evaluations?student_id=${studentId}&pos_number=${posNumber}${batchId ? `&batch_id=${batchId}` : ""}`),
      ]);

      if (sRes.ok) {
        const sData = await sRes.json();
        setStudent(sData.data);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        const rawList: AssessmentConfig[] = cData.data || [];
        const posRaw = rawList.find(
          (c) => c.pos_number === posNumber && c.is_active
        );
        if (posRaw) {
          try {
            const parsedConfig: AssessmentConfigParsed = {
              id: posRaw.id,
              version: posRaw.version,
              pos_number: posRaw.pos_number,
              pos_name: posRaw.pos_name,
              pos_description: posRaw.pos_description,
              is_active: posRaw.is_active,
              created_by: posRaw.created_by,
              created_at: posRaw.created_at,
              updated_at: posRaw.updated_at,
              indicators: typeof posRaw.indicators_json === "string" ? JSON.parse(posRaw.indicators_json) : (posRaw.indicators_json || []),
              red_flags: typeof posRaw.red_flags_json === "string" ? JSON.parse(posRaw.red_flags_json) : (posRaw.red_flags_json || []),
            };
            setConfig(parsedConfig);
          } catch {
            setConfig(null);
          }
        }
      }

      if (eRes.ok) {
        const eData = await eRes.json();
        const existing = (eData.data || [])[0];
        if (existing) {
          try {
            setScores(JSON.parse(existing.scores_json || "{}"));
            setRedFlags(JSON.parse(existing.red_flags_json || "{}"));
          } catch {
            // fallback
          }
          setReadingLevel(existing.reading_level || null);
          setAnecdotalNote(existing.anecdotal_note || "");
        }
      }

      // Check IndexedDB draft
      const draft = await loadDraftEvaluation(studentId, posNumber);
      if (draft?.scores) setScores(draft.scores);
      if (draft?.red_flags) setRedFlags(draft.red_flags);
      if (draft?.reading_level) setReadingLevel(draft.reading_level);
      if (draft?.anecdotal_note) setAnecdotalNote(draft.anecdotal_note);
    } catch {
      // offline: use cached/draft data
    } finally {
      setLoading(false);
    }
  }, [studentId, posNumber, batchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Auto-save to IndexedDB ──────────────────────────────────
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveDraftEvaluation(studentId, posNumber, {
          student_id: studentId,
          pos_number: posNumber,
          scores: scores,
          red_flags: redFlags,
          reading_level: readingLevel,
          anecdotal_note: anecdotalNote,
        });
        setSyncStatus("saved");
      } catch {
        // IDB error
      }
    }, 500);
  }, [studentId, posNumber, scores, redFlags, readingLevel, anecdotalNote]);

  useEffect(() => {
    if (!loading) {
      scheduleAutoSave();
    }
  }, [scores, redFlags, readingLevel, anecdotalNote, loading, scheduleAutoSave]);

  // Close note sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showNoteSheet) {
        setShowNoteSheet(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNoteSheet]);

  // ─── Submit Evaluation ───────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setSyncStatus("syncing");

    const payload = {
      client_id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      student_id: studentId,
      batch_id: batchId || student?.batch_id || "",
      pos_number: posNumber,
      scores_json: JSON.stringify(scores),
      red_flags_json: JSON.stringify(redFlags),
      reading_level: posNumber === 4 ? readingLevel : null,
      anecdotal_note: anecdotalNote.trim() || null,
      is_complete: true,
    };

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSyncStatus("synced");
        router.back();
      } else {
        throw new Error("Gagal menyimpan ke server");
      }
    } catch {
      await enqueuePendingSync({
        client_id: payload.client_id,
        type: "evaluation",
        payload: {
          id: "",
          student_id: payload.student_id,
          batch_id: payload.batch_id,
          pos_number: payload.pos_number,
          evaluator_id: "",
          scores_json: payload.scores_json,
          red_flags_json: payload.red_flags_json,
          scores: scores,
          red_flags: redFlags,
          reading_level: payload.reading_level,
          anecdotal_note: payload.anecdotal_note,
          has_red_flag: Object.values(redFlags).some((v) => v),
          total_score: null,
          is_complete: true,
          client_id: payload.client_id,
          synced_at: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as import("@/types").EvaluationParsed,
        created_at: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
      });
      setSyncStatus("saved");
      router.back();
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed Progress ───────────────────────────────────────
  const totalIndicators = config?.indicators.length || 0;
  const filledIndicators = Object.keys(scores).length;
  const completionPct = totalIndicators > 0 ? Math.round((filledIndicators / totalIndicators) * 100) : 0;
  const isComplete = filledIndicators === totalIndicators && totalIndicators > 0;

  // Aetrium Continuity Score Configuration
  const SCORE_CONFIG = [
    { value: 1 as ScoreValue, label: "BM", full: "Belum Muncul" },
    { value: 2 as ScoreValue, label: "MB", full: "Dengan Bimbingan" },
    { value: 3 as ScoreValue, label: "MM", full: "Muncul Mandiri" },
    { value: 4 as ScoreValue, label: "MK", full: "Mandiri & Konsisten" },
  ];

  const READING_LEVELS: { value: ReadingLevel; label: string; desc: string }[] = [
    { value: "L1", label: "Tingkat 1: Gambar & Simbol", desc: "Mengenal simbol & gambar visual benda konkret." },
    { value: "L2", label: "Tingkat 2: Huruf & Bunyi", desc: "Mengenal bentuk & bunyi huruf vokal serta konsonan." },
    { value: "L3", label: "Tingkat 3: Suku Kata", desc: "Membaca gabungan suku kata sederhana (bu-ku, bo-la)." },
    { value: "L4", label: "Tingkat 4: Kalimat Lancar", desc: "Membaca kalimat pendek & memahami isi cerita." },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-[#565C58] font-medium font-sans">
        Memuat lembar asesmen...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2320] pb-36 font-sans">
      {/* ─── Sticky Calm Navigation Header ─────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-[#3D7A5A] hover:text-[#1E2320] text-xs font-bold inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <ArrowLeft weight="light" size={15} />
            <span>Daftar Siswa</span>
          </button>
          <div className="flex items-center gap-2 bg-[#F0F4F1] border border-[#D4E2D8] px-3.5 py-1.5 rounded-full shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${syncStatus === "synced" ? "bg-[#5C7C68]" : "bg-[#C9733B] animate-pulse"}`} />
            <span className="text-[11px] font-bold text-[#3D7A5A]">
              {syncStatus === "synced" ? "Tersinkron" : "Tersimpan Lokal"}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Form Container ───────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-5 space-y-5">
        {/* Aetrium Student Hero Card at the Top */}
        {student && (
          <StudentHeroCard
            student={student}
            completionRate={completionPct}
            readingLevel={posNumber === 4 ? readingLevel : null}
            hasRedFlag={Object.values(redFlags).some((v) => v)}
          />
        )}

        {/* Pos Context Bar & Visual Progress */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#1E2320] tracking-tight">
                Observasi Pos {posNumber}: {config?.pos_name}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#565C58] mt-0.5">
                {filledIndicators} dari {totalIndicators} indikator rubrik telah dinilai
              </p>
            </div>
            <span className="text-xs font-bold text-[#3D7A5A] bg-[#F0F4F1] border border-[#D4E2D8] px-3 py-1 rounded-full shadow-2xs self-start sm:self-auto">
              {completionPct}% Selesai
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full h-2 bg-[#F0EBE1] rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-[#5C7C68] rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* ─── Rubrik Indicators ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
            <h3 className="font-bold text-base text-[#1E2320] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal weight="light" size={18} />
              </div>
              <span>Indikator Rubrik Observasi</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F1] text-[#3D7A5A] self-start sm:self-auto">
              Pos {posNumber}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#565C58] leading-relaxed">
            Berikan skor pengamatan sesuai panduan capaian siswa:
          </p>

          <div className="space-y-4 pt-1">
            {config?.indicators.map((indicator, idx) => (
              <div key={indicator.id} className="bg-[#FAF8F5] p-3.5 sm:p-4.5 rounded-2xl border border-[#E8E2D8] space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#C9733B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1E2320] leading-snug">
                      {indicator.label}
                    </h4>
                    <p className="text-xs text-[#565C58] mt-0.5 leading-relaxed font-normal">
                      {indicator.description}
                    </p>
                  </div>
                </div>

                {/* iOS Jumbo Segmented Score Buttons */}
                <div
                  className="grid grid-cols-4 gap-2 pt-1"
                  role="group"
                  aria-label={`Pilihan skor untuk indikator ${indicator.label}`}
                >
                  {SCORE_CONFIG.map((sc) => {
                    const isSelected = scores[indicator.id] === sc.value;
                    return (
                      <button
                        key={sc.value}
                        type="button"
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${indicator.label}: Skor ${sc.value} (${sc.full})`}
                        onClick={() => setScores((prev) => ({ ...prev, [indicator.id]: sc.value }))}
                        className={`h-13 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none ${
                          isSelected
                            ? "bg-[#C9733B] text-white shadow-sm ring-2 ring-[#C9733B] ring-offset-2 ring-offset-white font-black"
                            : "bg-white text-[#1E2320] hover:bg-[#F3EFE8] border border-[#E5E0D8] active:bg-[#FAF8F5]"
                        }`}
                        title={sc.full}
                      >
                        <span className="text-base sm:text-lg font-black leading-none">{sc.value}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tight leading-none mt-1">{sc.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Qualitative Rubric Score Descriptor */}
                {scores[indicator.id] && (
                  <div className="p-3.5 bg-white rounded-xl mt-2 text-xs text-[#1E2320] leading-relaxed italic border border-[#E8E2D8] font-medium shadow-2xs">
                    &ldquo;{indicator.score_descriptors[scores[indicator.id]]}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Reading Level (Pos 4) ─────────────────────────────────── */}
        {posNumber === 4 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <BookOpen weight="light" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2320]">
                    Tingkat Kemampuan Membaca
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Pemetaan tahap pra-literasi untuk rekomendasi guru Fase A
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F1] text-[#3D7A5A] self-start sm:self-auto">
                Khusus Pos 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1" role="radiogroup" aria-label="Level Kesiapan Membaca">
              {READING_LEVELS.map((rl) => {
                const isSelected = readingLevel === rl.value;
                return (
                  <button
                    key={rl.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setReadingLevel(rl.value)}
                    className={`p-4 rounded-2xl text-left transition-all text-xs min-h-[88px] flex flex-col justify-between cursor-pointer active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isSelected
                        ? "bg-[#FAF0E8] border-2 border-[#C9733B] shadow-2xs text-[#1E2320] font-bold"
                        : "bg-[#FAF8F5] text-[#1E2320] hover:bg-[#F3EFE8] border border-[#E5E0D8]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-[#1E2320]">{rl.label}</span>
                      {isSelected && <Check weight="bold" size={17} className="text-[#C9733B]" />}
                    </div>
                    <p className="text-xs text-[#565C58] leading-normal font-medium">
                      {rl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Sinyal Kebutuhan Pendampingan (Pos 1-5) ────────────────── */}
        {config?.red_flags && config.red_flags.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center flex-shrink-0">
                  <Warning weight="light" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2320]">
                    Sinyal Kebutuhan Pendampingan (Pos {posNumber})
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Catatan adaptif khusus untuk respon awal anak
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C9733B] self-start sm:self-auto">
                {Object.values(redFlags).filter(Boolean).length} Terpilih
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#565C58] leading-relaxed">
              Aktifkan jika teramati perilaku atau hambatan motorik/afektif yang memerlukan penguatan khusus:
            </p>

            <div className="space-y-2.5 pt-1">
              {config.red_flags.map((rf) => (
                <div
                  key={rf.id}
                  onClick={() => setRedFlags((prev) => ({ ...prev, [rf.id]: !prev[rf.id] }))}
                  className={`flex items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    redFlags[rf.id]
                      ? "bg-[#FAF0E8] border-[#F2D8C7]"
                      : "bg-[#FAF8F5] border-[#E8E2D8] hover:bg-[#F3EFE8]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0 mr-3">
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 shadow-2xs mt-0.5 sm:mt-0 ${
                        rf.severity === "critical"
                          ? "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] font-black"
                          : "bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] font-bold"
                      }`}
                    >
                      {rf.severity === "critical" ? "PRIORITAS" : "PENGAMATAN"}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#1E2320] leading-snug">
                      {rf.label}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-checked={redFlags[rf.id] || false}
                      aria-label={`Sinyal pendampingan: ${rf.label}`}
                      checked={redFlags[rf.id] || false}
                      onChange={(e) =>
                        setRedFlags((prev) => ({ ...prev, [rf.id]: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6.5 bg-[#DDD7CE] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5C7C68] peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[#C9733B]" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Anecdotal Observation Notes Trigger ─────────────────────── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <button
            type="button"
            onClick={() => setShowNoteSheet(true)}
            className="bg-[#FAF8F5] w-full p-4 sm:p-4.5 rounded-2xl text-left border border-[#E8E2D8] hover:bg-[#F3EFE8] hover:border-[#5C7C68]/60 transition-all focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <NotePencil weight="light" size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E2320]">Catatan Pengamatan Lapangan</h4>
                  <p className="text-[11px] sm:text-xs text-[#565C58]">Respon perilaku dan catatan perkembangan penting anak</p>
                </div>
              </div>
              {anecdotalNote ? (
                <span className="text-xs text-[#3D7A5A] font-bold bg-[#F0F4F1] border border-[#D4E2D8] px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-1.5 self-start sm:self-auto">
                  <Check weight="bold" size={14} className="text-[#3D7A5A]" />
                  <span>Catatan Terisi</span>
                </span>
              ) : (
                <span className="text-xs text-[#C9733B] font-bold flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-[#F2D8C7] shadow-xs self-start sm:self-auto">
                  <span>+ Tulis Catatan</span>
                  <CaretRight weight="bold" size={13} />
                </span>
              )}
            </div>
            {anecdotalNote && (
              <p className="text-xs text-[#1E2320] leading-relaxed mt-3 line-clamp-2 italic bg-white p-3.5 rounded-xl border border-[#E8E2D8] font-medium">
                &ldquo;{anecdotalNote}&rdquo;
              </p>
            )}
          </button>
        </div>
      </main>

      {/* ─── Fixed Bottom Submit Bar ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] shadow-[0_-4px_20px_rgba(30,35,32,0.06)] px-4 py-3 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isComplete}
            className={`w-full h-12 sm:h-13 rounded-xl text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer
              ${
                isComplete
                  ? "bg-[#1E2320] hover:bg-[#2C332E] text-white shadow-xs hover:-translate-y-0.5 active:scale-[0.98]"
                  : "bg-[#EBE6DF] text-[#787F7A] cursor-not-allowed"
              }`}
          >
            {saving
              ? "Menyimpan ke Peta Tumbuh..."
              : isComplete
              ? "✓ Simpan Jurnal Observasi Pos"
              : `Amati ${totalIndicators - filledIndicators} Indikator Lagi`}
          </button>
        </div>
      </div>

      {/* ─── Modal Dialog: Anecdotal Notes (Jurnal Harian) ── */}
      {showNoteSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#1E2320]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowNoteSheet(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(30,35,32,0.25)] z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E2D8] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <NotePencil weight="light" size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E2320]">
                    Jurnal Catatan Reflektif Observasi
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#565C58]">
                    Catatan kualitatif respon & perilaku di Pos {posNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E5E0D8] transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                aria-label="Tutup"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#565C58] leading-relaxed">
              Catat respons spontan, perilaku unik, interaksi sosial, atau dinamika rasa aman Ananda selama observasi di Pos {posNumber}.
            </p>

            <textarea
              value={anecdotalNote}
              onChange={(e) => setAnecdotalNote(e.target.value)}
              placeholder="Contoh: Arka sempat terdiam sejenak saat balok jatuh, lalu tersenyum dan menyusunnya kembali dengan tenang bersama teman di sampingnya..."
              rows={5}
              className="w-full rounded-xl p-3.5 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] placeholder:text-[#A8A09A] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none resize-none leading-relaxed italic"
              autoFocus
            />

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-full sm:w-auto h-11 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E5E0D8] transition-colors text-center focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-full sm:w-auto h-11 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] text-center focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

