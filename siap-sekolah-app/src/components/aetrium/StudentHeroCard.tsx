"use client";

// AETRIUM DESIGN TOKENS — STUDENT HERO CARD
// Canvas: #FAF8F5, Surface: #FFFFFF, Primary: #5C7C68, Success: #3D7A5A, Warning: #C9733B, Border: #E8E2D8

import React from "react";
import type { Student, ReadingLevel } from "@/types";

interface StudentHeroCardProps {
  student: Student;
  displayMode?: "evaluator" | "admin" | "report";
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
  displayMode = "admin",
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

  const getContinuumLabel = (score: number | null) => {
    if (score === null || score === undefined) return { text: "Berkembang (BSH)", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 2.6) return { text: "Mandiri (M)", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 1.8) return { text: "Berkembang (BSH)", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    return { text: "Perlu Bimbingan (PB)", color: "text-[#8C3713] bg-[#F9E6DC] border border-[#F1CFC0]" };
  };

  const getInitials = (name: string, nickname?: string) => {
    if (nickname && nickname.length >= 2) {
      return nickname.slice(0, 2).toUpperCase();
    }
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "RA";
  };

  const isEvaluator = displayMode === "evaluator";
  const initials = getInitials(student.full_name, student.nickname);
  const continuum = getContinuumLabel(overallScore);

  if (isEvaluator) {
    return (
      <article
        onClick={onClick}
        className={`bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-xs font-sans ${
          onClick ? "cursor-pointer active:scale-[0.98] transition-all hover:border-[#DDD7CE]" : ""
        } ${className}`}
      >
        {/* Top Info Row */}
        <div className="flex items-center gap-3.5">
          {/* Avatar bulat konsisten dengan visual evaluator */}
          <div className="w-12 h-12 rounded-full bg-[#3D5A47] text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-2xs">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-lg font-extrabold text-[#22352B] tracking-tight truncate" title={student.nickname}>
                  {student.nickname}
                </h3>
                <span className="text-xs text-[#787F7A] truncate font-normal" title={student.full_name}>
                  ({student.full_name})
                </span>
              </div>

              {hasRedFlag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7]">
                  <i className="mdi mdi-alert text-xs text-[#9C4322]" />
                  <span>Sinyal Perhatian</span>
                </span>
              )}
            </div>

            {/* Consolidated Metadata Row */}
            <p className="text-xs text-[#565C58] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
              {student.observation_group && (
                <span className="font-bold text-[#9C4322] bg-[#FAF0E8] border border-[#F2D8C7] px-2 py-0.5 rounded-md text-[10.5px]">
                  {student.observation_group}
                </span>
              )}
              {student.observation_group && <span>&bull;</span>}
              <span>{ageDisplay}</span>
              <span>&bull;</span>
              <span>JK: {student.gender || (isMale ? "L" : "P")}</span>
              <span>&bull;</span>
              <span className="font-mono tabular-nums text-[#22352B]">
                ID: {student.registration_no}
              </span>
            </p>
          </div>
        </div>

        {/* Garis Pemisah Tipis */}
        <div className="border-t border-[#FAF8F5] my-3" />

        {/* Baris Bawah: Label Kemandirian, Status Pill, Ceklis Selesai */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#787F7A]">
              KEMANDIRIAN:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4] text-xs font-bold shadow-2xs">
              <i className="mdi mdi-shield-check-outline text-xs" />
              <span>{continuum.text}</span>
            </div>
          </div>

          <div
            className="w-6 h-6 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 ml-auto shadow-2xs"
            title="Selesai diamati"
          >
            <i className="mdi mdi-check text-sm font-bold" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-[#E8E2D8] transition-all duration-150 ${
        onClick
          ? "cursor-pointer hover:border-[#DDD7CE] hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none"
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
          {/* Avatar konsentris */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
              isMale
                ? "bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]"
                : "bg-[#F9E6DC] text-[#8C3713] border border-[#F1CFC0]"
            }`}
            aria-hidden="true"
          >
            <i className="mdi mdi-account text-2xl" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#22352B] truncate tracking-tight" title={student.full_name}>
                {student.full_name}
              </h3>
              {student.nickname && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#565C58] border border-[#E8E2D8]" title={student.nickname}>
                  &ldquo;{student.nickname}&rdquo;
                </span>
              )}
              {student.observation_group && (
                <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <i className="mdi mdi-account-group text-xs" />
                  <span>{student.observation_group}</span>
                </span>
              )}
              {hasRedFlag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F9E6DC] text-[#8C3713] border border-[#F1CFC0]" aria-label="Terdeteksi perhatian khusus">
                  <i className="mdi mdi-alert text-xs text-[#B85627]" />
                  <span>Perhatian Khusus</span>
                </span>
              )}
            </div>

            <p className="text-xs text-[#565C58] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
              <span>{ageDisplay}</span>
              <span>&bull;</span>
              <span>JK: {isMale ? "Laki-laki" : "Perempuan"}</span>
              <span>&bull;</span>
              <span className="font-mono tabular-nums text-[#22352B]">
                ID: {student.registration_no}
              </span>
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

          {/* Growth Continuum Metric — only displayed if evaluated */}
          {overallScore !== null && (
            <div className={`px-2.5 py-1 rounded-xl text-center shadow-xs ${getContinuumLabel(overallScore).color}`}>
              <span className="text-[9px] uppercase font-bold text-[#787F7A] block leading-none">Kemandirian</span>
              <span className="text-[11px] sm:text-xs font-bold leading-tight">{getContinuumLabel(overallScore).text}</span>
            </div>
          )}

          {/* Circular Progress Ring — larger 48px with clear text */}
          <div
            className="relative w-12 h-12 flex-shrink-0"
            aria-label={`Kelengkapan observasi: ${completionRate}%`}
          >
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EFECE4" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={completionRate === 100 ? "#486B5A" : "#B85627"}
                strokeWidth="3"
                strokeDasharray={`${completionRate} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#486B5A]">
              {completionRate === 100 ? "✓" : `${completionRate}%`}
            </span>
          </div>

          {actionSlot && <div className="ml-auto sm:ml-0.5">{actionSlot}</div>}
        </div>
      </div>
    </article>
  );
}
