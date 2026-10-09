"use client";

import React from "react";
import { Sparkle, Compass, Users, Warning, BookOpen, CheckCircle } from "@phosphor-icons/react";
import type { Batch } from "@/types";

interface MorningBriefProps {
  batch: Batch;
  totalStudents: number;
  evaluatedCount: number;
  groupACount: number;
  groupBCount: number;
  redFlagCount: number;
  className?: string;
}

export function MorningBrief({
  batch,
  totalStudents,
  evaluatedCount,
  groupACount,
  groupBCount,
  redFlagCount,
  className = "",
}: MorningBriefProps) {
  const completionPercentage = totalStudents > 0 ? Math.round((evaluatedCount / totalStudents) * 100) : 0;
  const isFullyEvaluated = evaluatedCount === totalStudents && totalStudents > 0;

  return (
    <section
      aria-label="Briefing Kontekstual Guru Kelas 1"
      className={`relative overflow-hidden rounded-2xl bg-white p-4.5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] ${className}`}
    >
      {/* Decorative Warm Ambient Glow (Aetrium Nature Accent) */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#E4EDE7]/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Contextual Briefing Narrative */}
        <div className="space-y-2 max-w-2xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0]">
              <Sparkle weight="light" size={13} className="text-[#5C7C68]" />
              <span>Briefing Pedagogis Guru Kelas 1</span>
            </span>
            <span className="text-xs font-semibold text-[#787F7A]">·</span>
            <span className="text-xs font-bold text-[#1E2320]">
              {batch.batch_name}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-[#1E2320] tracking-tight leading-snug">
            Memandu Masa Transisi PAUD ke SD dengan Hangat &amp; Berkesinambungan
          </h2>

          <p className="text-xs sm:text-[13px] text-[#565C58] leading-relaxed">
            Fokus utama masa transisi adalah menumbuhkan rasa aman, mengenalkan budaya kelas ramah anak, dan memetakan fondasi literasi awal secara bertahap tanpa beban tes tertulis calistung.
          </p>
        </div>

        {/* Right Column: Quick Status & Diagnostic Snapshot */}
        <div className="flex flex-wrap md:flex-col gap-2.5 md:items-end flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F0ECE1]">
          {/* Progress Pill */}
          <div className="inline-flex items-center gap-2 bg-[#F4F3EE] px-3.5 py-1.5 rounded-xl border border-[#E0DAD0] text-xs">
            <Compass weight="light" size={15} className="text-[#5C7C68]" />
            <span className="text-[#565C58] font-medium">Progres Observasi:</span>
            <strong className="text-[#1E2320] font-bold">
              {evaluatedCount}/{totalStudents} Siswa ({completionPercentage}%)
            </strong>
          </div>

          {/* Quick Attribute Badges */}
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            {redFlagCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]">
                <Warning weight="light" size={13} />
                <span>{redFlagCount} Perlu Pendampingan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EBF5F0] text-[#3D7A5A] border border-[#C9DBD0]">
                <CheckCircle weight="light" size={13} />
                <span>Kesiapan Adaptif Baik</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0]">
              <BookOpen weight="light" size={13} />
              <span>TaRL: {groupACount}A / {groupBCount}B</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
