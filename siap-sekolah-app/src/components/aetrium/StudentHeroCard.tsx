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
    if (score === null || score === undefined) return { text: "Muncul Mandiri", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 3.3) return { text: "Mandiri & Konsisten", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 2.5) return { text: "Muncul Mandiri", color: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]" };
    if (score >= 1.8) return { text: "Dengan Bimbingan", color: "text-[#8C3713] bg-[#F9E6DC] border border-[#F1CFC0]" };
    return { text: "Tahap Eksplorasi", color: "text-[#787F7A] bg-[#EFECE4] border border-[#DDD7CE]" };
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
        className={`bg-white rounded-[1.85rem] p-4 sm:p-5 border border-[#E8E2D8]/60 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] font-sans ${
          onClick ? "cursor-pointer active:scale-[0.99] transition-all" : ""
        } ${className}`}
      >
        {/* Top Info Row */}
        <div className="flex items-center gap-3.5">
          {/* Avatar bulat #486B5A */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#486B5A] text-white flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-xs">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-[#22352B] tracking-tight">
                {student.nickname}
              </h3>
              <span className="bg-[#EFECE4] text-[#787F7A] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {ageDisplay}
              </span>
              {student.observation_group && (
                <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <i className="mdi mdi-account-group text-xs" />
                  <span>{student.observation_group}</span>
                </span>
              )}
              {hasRedFlag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F9E6DC] text-[#8C3713] border border-[#F1CFC0]">
                  <i className="mdi mdi-alert text-xs text-[#B85627]" />
                  <span>Perhatian Khusus</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-[13px] font-medium text-[#565C58] truncate mt-0.5">
              {student.full_name}
            </p>

            <p className="text-xs text-[#787F7A] mt-0.5">
              ID: <span className="font-mono font-semibold text-[#22352B]">{student.registration_no}</span> · JK:{" "}
              <span className="font-bold text-[#22352B]">{student.gender || (isMale ? "L" : "P")}</span>
            </p>
          </div>
        </div>

        {/* Garis Pemisah Tipis */}
        <div className="border-t border-[#EFECE4] my-3.5" />

        {/* Baris Bawah: Label Kemandirian, Status Pill, Ceklis Selesai */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A]">
              KEMANDIRIAN
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4] text-xs font-bold shadow-2xs">
              <i className="mdi mdi-shield-check-outline text-sm" />
              <span>{continuum.text}</span>
            </div>
          </div>

          <div
            className="w-7 h-7 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 ml-auto shadow-2xs"
            title="Selesai diamati"
          >
            <i className="mdi mdi-check text-base font-bold" />
          </div>
        </div>
      </article>
    );
  }

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
            <i className="mdi mdi-account text-2xl" />
          </div>

          <div className="min-w-0">
            {isEvaluator ? (
              /* Evaluator Mode: Nickname is primary, prominent */
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-[#1E2320] tracking-tight">
                    {student.nickname}
                  </h3>
                  {hasRedFlag && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] shadow-xs" aria-label="Terdeteksi perhatian khusus">
                      <i className="mdi mdi-alert text-xs text-[#C9733B]" />
                      <span>Perhatian Khusus</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-[#565C58] truncate mt-0.5">
                  {student.full_name}
                </p>
                <p className="text-xs text-[#787F7A] mt-0.5">
                  <span className="font-semibold text-[#1E2320]">{ageDisplay}</span> · ID:{" "}
                  <span className="font-mono font-semibold text-[#1E2320]">{student.registration_no}</span> · JK:{" "}
                  <span>{isMale ? "L" : "P"}</span>
                </p>
              </div>
            ) : (
              /* Admin/Report Mode: Full name primary */
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-[#1E2320] truncate tracking-tight">
                    {student.full_name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F4F3EE] text-[#565C58] border border-[#DDD7CE]">
                    &ldquo;{student.nickname}&rdquo;
                  </span>
                  {student.observation_group && (
                    <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                      <i className="mdi mdi-account-group text-xs" />
                      <span>{student.observation_group}</span>
                    </span>
                  )}
                  {hasRedFlag && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] shadow-xs" aria-label="Terdeteksi perhatian khusus">
                      <i className="mdi mdi-alert text-xs text-[#C9733B]" />
                      <span>Perhatian Khusus</span>
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
