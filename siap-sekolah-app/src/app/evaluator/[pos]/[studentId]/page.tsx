"use client";
export const runtime = 'edge';

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StudentHeroCard } from "@/components/aetrium/StudentHeroCard";
import { PosStepIndicator } from "@/components/aetrium/PosStepIndicator";
import { SkeletonAssessmentForm } from "@/components/aetrium/SkeletonAssessmentForm";
import { EvaluationConfirmDialog } from "@/components/aetrium/EvaluationConfirmDialog";
import { saveDraftEvaluation, loadDraftEvaluation, enqueuePendingSync } from "@/lib/idb";
import type { Student, AssessmentConfig, AssessmentConfigParsed, ReadingLevel, ScoreValue } from "@/types";
import { FOUNDATION_LABELS } from "@/types";

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saved" | "syncing" | "error">("synced");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Viewport detection for inline textarea vs bottom sheet
  useEffect(() => {
    const checkViewport = () => {
      setIsTabletOrDesktop(window.innerWidth >= 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

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

  // ─── Submit Evaluation (Triggered via Confirmation Dialog) ──
  const handleConfirmSubmit = async () => {
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
        setShowConfirmDialog(false);
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
      setShowConfirmDialog(false);
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

  const averageScore = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return null;
    const sum = vals.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / vals.length).toFixed(2));
  }, [scores]);

  // Continuum Score Configuration with Warm Organic Palette (Skala 1 - 3)
  const SCORE_COLOR_CONFIG: Record<
    number,
    { selected: string; label: string; full: string; callout: string }
  > = {
    1: {
      selected: "bg-[#FCEEEF] text-[#B83A35] border-2 border-[#B83A35] shadow-xs font-bold",
      label: "Bimbingan",
      full: "Perlu Bimbingan",
      callout: "border-l-2 border-[#B83A35] bg-[#FCEEEF]/50 text-[#8C3713]",
    },
    2: {
      selected: "bg-[#FAF8F5] text-[#7D5327] border-2 border-[#B85627] shadow-xs font-bold",
      label: "Berkembang",
      full: "Berkembang",
      callout: "border-l-2 border-[#B85627] bg-[#FAF8F5] text-[#8C3713]",
    },
    3: {
      selected: "bg-[#E4EFE9] text-[#22352B] border-2 border-[#486B5A] shadow-xs font-bold",
      label: "Mandiri",
      full: "Mandiri",
      callout: "border-l-2 border-[#486B5A] bg-[#E4EFE9]/60 text-[#22352B]",
    },
    4: {
      selected: "bg-[#E4EFE9] text-[#22352B] border-2 border-[#486B5A] shadow-xs font-bold",
      label: "Mandiri",
      full: "Mandiri (Legacy)",
      callout: "border-l-2 border-[#486B5A] bg-[#E4EFE9]/60 text-[#22352B]",
    },
  };

  const READING_LEVELS: { value: ReadingLevel; label: string; desc: string }[] = [
    { value: "L1", label: "Tingkat 1: Gambar & Simbol", desc: "Mengenal simbol & gambar visual benda konkret." },
    { value: "L2", label: "Tingkat 2: Huruf & Bunyi", desc: "Mengenal bentuk & bunyi huruf vokal serta konsonan." },
    { value: "L3", label: "Tingkat 3: Suku Kata", desc: "Membaca gabungan suku kata sederhana (bu-ku, bo-la)." },
    { value: "L4", label: "Tingkat 4: Kalimat Lancar", desc: "Membaca kalimat pendek & memahami isi cerita." },
  ];

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] p-4 sm:p-5 max-w-3xl lg:max-w-4xl mx-auto font-sans">
        <div className="h-12 bg-white/70 rounded-2xl mb-5 animate-pulse border border-[#E8E2D8]" />
        <SkeletonAssessmentForm />
      </div>
    );
  }

  // Error / Not Found State
  if (!loading && !student) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-[#F9E6DC] flex items-center justify-center mx-auto mb-4 border border-[#F1CFC0] shadow-xs">
          <i className="mdi mdi-alert text-3xl text-[#B85627]" />
        </div>
        <h2 className="text-base sm:text-lg font-extrabold text-[#22352B]">Data siswa tidak ditemukan</h2>
        <p className="text-xs sm:text-sm text-[#565C58] mt-1 max-w-sm">
          Siswa ini mungkin belum terdaftar di gelombang aktif atau alamat URL tidak valid.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-5 h-11 px-6 bg-[#B85627] hover:bg-[#A34B21] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer active:scale-95"
        >
          Kembali ke Daftar Siswa
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-24 font-sans">
      {/* ─── Sticky Calm Navigation Header ─────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#F6F2E9]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-2.5 sm:px-6 space-y-2">
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#22352B] hover:bg-[#FAF8F5] transition-colors shadow-2xs cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#B85627] focus-visible:ring-offset-2"
          >
            <i className="mdi mdi-chevron-left text-base" />
            <span>Daftar Siswa</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={`/reports/rubric/${posNumber}?student_id=${studentId}${student?.batch_id || batchId ? `&batch_id=${student?.batch_id || batchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] text-xs font-bold text-[#B85627] hover:bg-[#FAF8F5] shadow-2xs transition-colors cursor-pointer active:scale-[0.96]"
              title="Cetak Lembar Observasi Fisik Siswa Ini"
            >
              <i className="mdi mdi-printer-outline text-base" />
              <span className="hidden sm:inline">Cetak Lembar</span>
              <span className="sm:hidden">Cetak</span>
            </Link>

            <div className="flex items-center gap-1.5 bg-[#F9E6DC] border border-[#F1CFC0] px-3 py-1 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#B85627]" />
              <span className="text-[11px] font-bold text-[#8C3713]">
                {syncStatus === "synced" ? "Tersinkron" : "Lokal"}
              </span>
            </div>
          </div>
        </div>

        {/* Pos Step Indicator Bar */}
        <div className="max-w-3xl lg:max-w-4xl mx-auto pt-1 border-t border-[#E8E2D8]/60">
          <PosStepIndicator currentPos={posNumber} />
        </div>
      </header>

      {/* ─── Main Form Container ───────────────────────────────── */}
      <main className="max-w-3xl lg:max-w-4xl mx-auto p-4 sm:p-5 space-y-4">
        {/* Student Summary Card at the Top */}
        {student && (
          <StudentHeroCard
            student={student}
            displayMode="evaluator"
            completionRate={completionPct}
            overallScore={averageScore}
            readingLevel={posNumber === 4 ? readingLevel : null}
            hasRedFlag={Object.values(redFlags).some((v) => v)}
          />
        )}

        {/* Progress Rubrik Pos: Elevated Calm Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {posNumber === 1 ? "SUPER OBSERVER" : "STATION EVALUATOR"}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#22352B] tracking-tight truncate">
                {config?.pos_name || "Observasi Perkembangan"}
              </h2>
            </div>
            <p className="text-xs text-[#565C58]">
              {filledIndicators} dari {totalIndicators} indikator rubrik telah dinilai
            </p>
          </div>

          <div className="flex items-center gap-3 sm:w-60 flex-shrink-0">
            <div className="flex-1 h-2 bg-[#E8E2D8] rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-[#9C4322] rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="bg-[#FAF8F5] border border-[#E8E2D8] text-[#22352B] px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums flex-shrink-0">
              {completionPct}% Selesai
            </span>
          </div>
        </div>

        {/* ─── Rubrik Indicators: Clean De-nested Layout ─────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center flex-shrink-0 text-base">
                <i className="mdi mdi-tune-variant" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#22352B]">
                  Indikator Rubrik Observasi
                </h3>
                <p className="text-xs text-[#565C58]">
                  Pilih tingkat kemunculan capaian perilaku Ananda
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F9E6DC] text-[#8C3713]">
              {config?.pos_name || "Rubrik Evaluasi"}
            </span>
          </div>

          {/* Indicators list cleanly spaced without card-in-card */}
          <div className="space-y-6 pt-1">
            {config?.indicators.map((indicator, idx) => (
              <div
                key={indicator.id}
                className="pt-5 first:pt-0 border-t border-[#E8E2D8]/60 first:border-0 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#B85627] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#22352B] leading-tight">
                        {indicator.label}
                      </h4>
                      {indicator.foundation && FOUNDATION_LABELS[indicator.foundation] && (
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${FOUNDATION_LABELS[indicator.foundation].badgeBg} ${FOUNDATION_LABELS[indicator.foundation].badgeText} border border-current/20 flex items-center gap-1 shadow-2xs`}
                          title={FOUNDATION_LABELS[indicator.foundation].name}
                        >
                          <i className="mdi mdi-cube-outline text-[10px]" />
                          <span>P{indicator.foundation}: {FOUNDATION_LABELS[indicator.foundation].short}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#565C58] mt-1 font-normal leading-relaxed">
                      {indicator.description}
                    </p>
                  </div>
                </div>

                {/* Grid 3 Tombol Skor */}
                <div
                  className="grid grid-cols-3 gap-2 sm:gap-3 pt-1"
                  role="group"
                  aria-label={`Pilihan skor untuk indikator ${indicator.label}`}
                >
                  {([1, 2, 3] as ScoreValue[]).map((val) => {
                    const isSelected = scores[indicator.id] === val;
                    const config = SCORE_COLOR_CONFIG[val];

                    return (
                      <button
                        key={val}
                        type="button"
                        role="button"
                        aria-pressed={isSelected}
                        onClick={() => setScores((prev) => ({ ...prev, [indicator.id]: val }))}
                        className={`h-13 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none ${
                          isSelected
                            ? config.selected
                            : "bg-[#FAF8F5] text-[#22352B] hover:bg-white border border-[#E8E2D8] font-semibold"
                        }`}
                      >
                        <span className="text-base font-extrabold leading-none tabular-nums font-mono">{val}</span>
                        <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-tight leading-none mt-1">
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Qualitative Rubric Score Callout (Clean Accent) */}
                {scores[indicator.id] && (
                  <div className={`p-2.5 px-3.5 rounded-r-xl text-xs leading-relaxed italic font-medium transition-colors ${SCORE_COLOR_CONFIG[scores[indicator.id]].callout}`}>
                    &ldquo;{indicator.score_descriptors[scores[indicator.id]]}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Reading Level (Pos 4) ─────────────────────────────────── */}
        {posNumber === 4 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center flex-shrink-0">
                  <i className="mdi mdi-book-open-page-variant-outline text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#22352B]">
                    Tingkat Kemampuan Membaca
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Pemetaan tahap pra-literasi untuk rekomendasi guru Fase A
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFE7D6] text-[#7D5327] self-start sm:self-auto">
                Khusus Bahasa &amp; Literasi
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
                    className={`p-3.5 rounded-xl text-left transition-all text-xs min-h-[84px] flex flex-col justify-between cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isSelected
                        ? "bg-[#EFE7D6] border-2 border-[#7D5327] shadow-2xs text-[#22352B] font-bold"
                        : "bg-[#FAF8F5] text-[#22352B] hover:bg-white border border-[#E8E2D8]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#22352B]">{rl.label}</span>
                      {isSelected && <i className="mdi mdi-check text-base text-[#7D5327]" />}
                    </div>
                    <p className="text-xs text-[#565C58] leading-normal font-normal">
                      {rl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Perhatian Khusus (Pos 1-5) ──────────────────────── */}
        {config?.red_flags && config.red_flags.length > 0 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center flex-shrink-0 text-base">
                  <i className="mdi mdi-alert-outline" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#22352B]">
                    Perhatian Khusus (Pos {posNumber})
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Catatan adaptif respon awal &amp; perilaku anak
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFE7D6] text-[#7D5327]">
                {Object.values(redFlags).filter(Boolean).length} Terpilih
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {config.red_flags.map((rf) => (
                <div
                  key={rf.id}
                  onClick={() => setRedFlags((prev) => ({ ...prev, [rf.id]: !prev[rf.id] }))}
                  className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8] flex items-center justify-between gap-3 cursor-pointer transition hover:border-[#DDD7CE] active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <span className="bg-[#F9E6DC] text-[#8C3713] text-[9.5px] font-bold px-2 py-0.5 rounded-md inline-block uppercase mb-0.5">
                      PERHATIAN KHUSUS
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[#22352B] leading-tight">
                      {rf.label}
                    </p>
                  </div>

                  {/* Switch Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                    <div className="w-11 h-6 bg-[#DDD7CE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B85627]" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Catatan Guru ─── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5 pb-1 border-b border-[#FAF8F5]">
            <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 text-base">
              <i className="mdi mdi-pencil-outline" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#22352B]">Catatan Guru</h4>
              <p className="text-xs text-[#565C58]">
                Pengamatan langsung dinamika belajar Ananda di Pos {posNumber}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-3.5 border border-[#E8E2D8] space-y-2.5">
            <button
              type="button"
              onClick={() => setShowNoteSheet(true)}
              className="w-full flex items-center justify-between cursor-pointer text-left active:scale-[0.98]"
            >
              <span className="text-xs font-bold text-[#22352B]">
                Buka / Sunting Catatan
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  anecdotalNote ? "bg-[#E4EFE9] text-[#486B5A]" : "bg-[#EFECE4] text-[#787F7A]"
                }`}>
                  {anecdotalNote ? "✓ Terisi" : "Belum Terisi"}
                </span>
                <i className="mdi mdi-chevron-down text-sm text-[#787F7A]" />
              </div>
            </button>

            {anecdotalNote ? (
              <div
                onClick={() => setShowNoteSheet(true)}
                className="bg-white rounded-xl p-3 text-xs text-[#22352B] italic leading-relaxed shadow-2xs font-medium cursor-pointer border border-[#E8E2D8]"
              >
                &ldquo;{anecdotalNote}&rdquo;
              </div>
            ) : (
              <div
                onClick={() => setShowNoteSheet(true)}
                className="bg-white/80 hover:bg-white rounded-xl p-3 text-xs text-[#787F7A] italic cursor-pointer border border-dashed border-[#DDD7CE] transition"
              >
                Ketuk di sini untuk menulis catatan pengamatan siswa...
              </div>
            )}
          </div>
        </div>

        {/* ─── Tombol Penuh Simpan Catatan Observasi Pos di Paling Bawah ─── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowConfirmDialog(true)}
            disabled={saving || !isComplete}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
              isComplete
                ? "bg-[#9C4322] hover:bg-[#84371B] text-white active:scale-[0.96]"
                : "bg-[#EFECE4] text-[#787F7A] cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <i className="mdi mdi-loading mdi-spin text-base" />
                <span>Menyimpan ke Peta Tumbuh...</span>
              </>
            ) : isComplete ? (
              <>
                <i className="mdi mdi-check text-base font-bold" />
                <span>Simpan Catatan Observasi Pos</span>
              </>
            ) : (
              <span>Amati <span className="font-mono tabular-nums">{totalIndicators - filledIndicators}</span> Indikator Lagi</span>
            )}
          </button>
        </div>
      </main>

      {/* ─── Mobile Modal Dialog: Catatan Guru ── */}
      {showNoteSheet && !isTabletOrDesktop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowNoteSheet(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E2D8] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                  <i className="mdi mdi-notebook-edit-outline text-lg" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#22352B]">
                    Catatan Guru di Pos {posNumber}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#565C58]">
                    Tulis pengamatan langsung Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E8E2D8] transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#486B5A]"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-base" />
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
              className="w-full rounded-xl p-3.5 text-base sm:text-sm bg-[#FAF8F5] text-[#22352B] placeholder:text-[#A8A09A] border border-[#E8E2D8] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none resize-none leading-relaxed italic transition-all"
              autoFocus
            />

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-full sm:w-auto h-10 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#22352B] text-xs font-bold px-4 rounded-xl border border-[#E8E2D8] transition-all active:scale-[0.96] text-center focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => setShowNoteSheet(false)}
                className="w-full sm:w-auto h-10 bg-[#B85627] hover:bg-[#A34B21] text-white text-xs font-bold px-5 rounded-xl shadow-2xs transition-all active:scale-[0.96] text-center focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 cursor-pointer"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Evaluation Confirmation Dialog (Review Before Submit) ── */}
      {student && (
        <EvaluationConfirmDialog
          isOpen={showConfirmDialog}
          studentName={student.full_name}
          studentNickname={student.nickname}
          posNumber={posNumber}
          posName={config?.pos_name || `Pos ${posNumber}`}
          totalIndicators={totalIndicators}
          filledIndicators={filledIndicators}
          averageScore={averageScore}
          redFlagsCount={Object.values(redFlags).filter(Boolean).length}
          anecdotalNote={anecdotalNote}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmDialog(false)}
          isSaving={saving}
        />
      )}
    </div>
  );
}
