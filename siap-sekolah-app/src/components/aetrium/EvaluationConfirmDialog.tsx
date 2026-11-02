"use client";

import React, { useEffect } from "react";

interface EvaluationConfirmDialogProps {
  isOpen: boolean;
  studentName: string;
  studentNickname: string;
  posNumber: number;
  posName: string;
  totalIndicators: number;
  filledIndicators: number;
  averageScore: number | null;
  redFlagsCount: number;
  anecdotalNote: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EvaluationConfirmDialog({
  isOpen,
  studentName,
  studentNickname,
  posNumber,
  posName,
  totalIndicators,
  filledIndicators,
  averageScore,
  redFlagsCount,
  anecdotalNote,
  onConfirm,
  onCancel,
  isSaving,
}: EvaluationConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onCancel]);

  if (!isOpen) return null;

  const getScoreSummary = (score: number | null) => {
    if (score === null) return { label: "Belum Lengkap", color: "text-[#787F7A] bg-[#EFECE4]" };
    if (score >= 3.3) return { label: `${score.toFixed(1)} — Mandiri & Konsisten`, color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 2.5) return { label: `${score.toFixed(1)} — Muncul Mandiri`, color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 1.8) return { label: `${score.toFixed(1)} — Dengan Bimbingan`, color: "text-[#8C3713] bg-[#F9E6DC] border border-[#F1CFC0]" };
    return { label: `${score.toFixed(1)} — Tahap Eksplorasi`, color: "text-[#B83A35] bg-[#FCEEEF] border border-[#F1CFC0]" };
  };

  const scoreSummary = getScoreSummary(averageScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
      <div
        className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-xs transition-opacity"
        onClick={!isSaving ? onCancel : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-2xl z-10 space-y-3.5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between pb-2.5 border-b border-[#FAF8F5] gap-2">
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-bold text-[#22352B]">
              Simpan Catatan Observasi Pos {posNumber}?
            </h3>
            <p className="text-xs text-[#565C58] mt-0.5 font-normal">
              Periksa ringkasan pengamatan sebelum menyimpan ke sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="w-7 h-7 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E8E2D8] transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 active:scale-[0.96]"
            aria-label="Tutup"
          >
            <i className="mdi mdi-close text-base" />
          </button>
        </div>

        {/* Student & Pos Recap */}
        <div className="bg-[#FAF8F5] rounded-xl p-3.5 border border-[#E8E2D8] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#565C58] font-normal">Ananda:</span>
            <span className="font-bold text-[#22352B]">
              {studentNickname} <span className="font-normal text-[#787F7A]">({studentName})</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#565C58] font-normal">Pos Asesmen:</span>
            <span className="font-semibold text-[#22352B]">Pos {posNumber} — {posName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#565C58] font-normal">Indikator Dinilai:</span>
            <span className="font-bold text-[#486B5A] tabular-nums font-mono">
              {filledIndicators} dari {totalIndicators} indikator
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D8]/60">
            <span className="text-[#565C58] font-normal">Capaian Rata-Rata:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] tabular-nums font-mono ${scoreSummary.color}`}>
              {scoreSummary.label}
            </span>
          </div>
          {redFlagsCount > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-[#E8E2D8]/60">
              <span className="text-[#8C3713] font-bold flex items-center gap-1.5">
                <i className="mdi mdi-alert text-xs text-[#B85627]" />
                <span>Perhatian Khusus:</span>
              </span>
              <span className="font-bold text-[#8C3713] tabular-nums font-mono">{redFlagsCount} sinyal terpilih</span>
            </div>
          )}
        </div>

        {/* Anecdotal Note Preview */}
        {anecdotalNote ? (
          <div className="p-3 bg-white rounded-xl border border-[#E8E2D8] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#486B5A]">
              <i className="mdi mdi-notebook-edit-outline text-sm" />
              <span>Catatan Guru:</span>
            </div>
            <p className="text-[#22352B] italic line-clamp-3 leading-relaxed">
              &ldquo;{anecdotalNote}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-[#787F7A] italic text-center py-0.5">
            (Tidak ada catatan teks tambahan)
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1.5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full sm:w-auto h-10 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#22352B] text-xs font-bold px-4 py-2 rounded-xl border border-[#E8E2D8] transition-colors text-center cursor-pointer disabled:opacity-50 active:scale-[0.96]"
          >
            Periksa Ulang
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full sm:w-auto h-10 bg-[#B85627] hover:bg-[#A34B21] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-all active:scale-[0.96] text-center inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <i className="mdi mdi-check text-base" />
                <span>Simpan Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
