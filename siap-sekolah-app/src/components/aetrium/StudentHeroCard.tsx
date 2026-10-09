"use client";

import React from "react";
import { User, Warning } from "@phosphor-icons/react";
import type { Student, ReadingLevel } from "@/types";

interface StudentHeroCardProps {
  student: Student;
  completionRate?: number;       // 0-100 percent
  overallScore?: number | null;   // 1.0 - 4.0
  readingLevel?: ReadingLevel | null;
  hasRedFlag?: boolean;
  assignedClass?: "1A" | "1B" | null;
  actionSlot?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Helper to calculate accurate age in years and months */
function calculateAge(birthDateStr: string): string {
  if (!birthDateStr) return "-";
  const birth = new Date(birthDateStr);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} thn ${months} bln`;
}

export function StudentHeroCard({
  student,
  completionRate = 0,
  overallScore = null,
  readingLevel = null,
  hasRedFlag = false,
  assignedClass = null,
  actionSlot,
  onClick,
  className = "",
}: StudentHeroCardProps) {
  const isMale = student.gender === "L";
  const ageDisplay = calculateAge(student.birth_date);

  const readingLevelLabels: Record<ReadingLevel, { label: string; color: string }> = {
    L1: { label: "Tingkat 1: Gambar & Simbol", color: "bg-[#F4F3EE] text-[#1E2320] border border-[#DDD7CE]" },
    L2: { label: "Tingkat 2: Huruf & Bunyi", color: "bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0]" },
    L3: { label: "Tingkat 3: Suku Kata", color: "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]" },
    L4: { label: "Tingkat 4: Kalimat Lancar", color: "bg-[#EBF5F0] text-[#1E2320] border border-[#C9DBD0]" },
  };

  const getContinuumLabel = (score: number) => {
    if (score >= 3.3) return { text: "Mandiri & Konsisten", color: "text-[#3D7A5A] bg-[#EBF5F0] border border-[#C9DBD0]" };
    if (score >= 2.5) return { text: "Muncul Mandiri", color: "text-[#3D7A5A] bg-[#F0F4F1] border border-[#C9DBD0]" };
    if (score >= 1.8) return { text: "Dengan Bimbingan", color: "text-[#C9733B] bg-[#FAF0E8] border border-[#F2D8C7]" };
    return { text: "Tahap Eksplorasi", color: "text-[#565C58] bg-[#F4F3EE] border border-[#DDD7CE]" };
  };

  return (
    <article
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-[0_4px_20px_-3px_rgba(30,35,32,0.06),0_1px_4px_rgba(30,35,32,0.03)] border border-[#E8E2D8] transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:shadow-[0_8px_28px_-4px_rgba(30,35,32,0.10)] hover:-translate-y-0.5 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
          : ""
      } ${className}`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Identity Segment */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar with subtle warm glow */}
          <div
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
              isMale
                ? "bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0]"
                : "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]"
            }`}
            aria-hidden="true"
          >
            <User weight="light" size={26} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1E2320] truncate tracking-tight">
                {student.full_name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F4F3EE] text-[#565C58] border border-[#DDD7CE]">
                &ldquo;{student.nickname}&rdquo;
              </span>
              {hasRedFlag && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] shadow-xs" aria-label="Terdeteksi sinyal pendampingan afektif">
                  <Warning weight="light" size={13} className="text-[#C9733B]" />
                  Sinyal Pendampingan
                </span>
              )}
            </div>

            <p className="text-xs text-[#565C58] mt-1">
              ID: <span className="font-mono font-semibold text-[#1E2320]">{student.registration_no}</span> · Usia:{" "}
              <span className="font-semibold text-[#1E2320]">{ageDisplay}</span> · JK:{" "}
              <span>{isMale ? "Laki-laki" : "Perempuan"}</span>
            </p>

            {student.parent_name && (
              <p className="text-[11px] text-[#787F7A] mt-0.5 truncate">
                Orang Tua: <strong className="text-[#565C58] font-medium">{student.parent_name}</strong>{" "}
                {student.phone ? `(${student.phone})` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Right Status Badges & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:self-center flex-shrink-0 pt-2.5 sm:pt-0 w-full sm:w-auto justify-start sm:justify-end border-t border-[#F5F2EC] sm:border-t-0">
          {/* Reading Level Chip */}
          {readingLevel && readingLevelLabels[readingLevel] && (
            <span
              className={`text-[10.5px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs ${readingLevelLabels[readingLevel].color}`}
              title="Tingkat Kemampuan Membaca"
            >
              {readingLevelLabels[readingLevel].label}
            </span>
          )}

          {/* Assigned Class */}
          {assignedClass && (
            <div className="px-2.5 py-1 rounded-xl bg-[#F0F4F1] text-center shadow-xs border border-[#C9DBD0]">
              <span className="text-[9px] uppercase font-bold text-[#3D7A5A] block leading-none">Kelas</span>
              <span className="text-xs font-black text-[#1E2320] leading-tight">
                {assignedClass.startsWith("1") ? assignedClass : `1${assignedClass}`}
              </span>
            </div>
          )}

          {/* Growth Continuum Metric */}
          {overallScore !== null && (
            <div className={`px-2.5 py-1 rounded-xl text-center shadow-xs ${getContinuumLabel(overallScore).color}`}>
              <span className="text-[9px] uppercase font-bold text-[#787F7A] block leading-none">Kemandirian</span>
              <span className="text-[11px] sm:text-xs font-bold leading-tight">{getContinuumLabel(overallScore).text}</span>
            </div>
          )}

          {/* Circular Progress Ring */}
          <div
            className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0"
            aria-label={`Kelengkapan observasi: ${completionRate}%`}
          >
            <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EBE6DF" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#5C7C68"
                strokeWidth="3"
                strokeDasharray={`${completionRate} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#3D7A5A]">
              {completionRate}%
            </span>
          </div>

          {actionSlot && <div className="ml-auto sm:ml-0.5">{actionSlot}</div>}
        </div>
      </div>
    </article>
  );
}
