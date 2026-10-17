"use client";

// AETRIUM DESIGN TOKENS — MORNING BRIEF EVALUATOR
// Canvas: #F4F3EE, Surface: #FFFFFF, Primary: #5C7C68, Success: #3D7A5A, Border: #E8E2D8

import React from "react";
import type { Batch } from "@/types";

interface EvaluatorMorningBriefProps {
  posNumber: number;
  posName: string;
  posFocus?: string;
  batch: Batch | null;
  totalStudents: number;
  completedStudents: number;
  className?: string;
}

export function EvaluatorMorningBrief({
  posNumber,
  posName,
  posFocus,
  batch,
  totalStudents,
  completedStudents,
  className = "",
}: EvaluatorMorningBriefProps) {
  const pendingStudents = Math.max(0, totalStudents - completedStudents);
  const completionPct = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

  return (
    <section
      aria-label={`Ringkasan Observasi Pos ${posNumber}`}
      className={`rounded-2xl bg-white p-4.5 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FAF8F5] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5C7C68]" />
            <h2 className="text-sm sm:text-base font-bold text-[#1E2320] tracking-tight">
              Pos {posNumber}: {posName}
            </h2>
          </div>
          <p className="text-xs text-[#565C58] mt-0.5">
            {batch?.batch_name || "Gelombang Observasi Calon Siswa"} {posFocus ? `• ${posFocus}` : ""}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] self-start sm:self-auto">
          <span>{completionPct}% Selesai</span>
        </div>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8] text-center">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#787F7A] tracking-wider block">
            Total Siswa
          </span>
          <span className="text-lg sm:text-2xl font-black text-[#1E2320] leading-tight mt-0.5 block">
            {totalStudents}
          </span>
        </div>
        <div className="bg-[#F0F4F1] p-3 rounded-xl border border-[#D4E2D8] text-center">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#3D7A5A] tracking-wider block">
            Selesai
          </span>
          <span className="text-lg sm:text-2xl font-black text-[#3D7A5A] leading-tight mt-0.5 block">
            {completedStudents}
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8] text-center">
          <span className="text-[10px] sm:text-[11px] uppercase font-bold text-[#787F7A] tracking-wider block">
            Menunggu
          </span>
          <span className="text-lg sm:text-2xl font-black text-[#1E2320] leading-tight mt-0.5 block">
            {pendingStudents}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-[#F0EBE1] rounded-full overflow-hidden" role="progressbar" aria-valuenow={completionPct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-[#5C7C68] rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
