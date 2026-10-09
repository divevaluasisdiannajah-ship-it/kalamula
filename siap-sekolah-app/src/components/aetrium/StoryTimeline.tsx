"use client";

import React from "react";
import {
  HouseLine,
  PersonSimpleRun,
  Brain,
  BookOpen,
  Handshake,
  NotePencil,
  Warning,
  ClipboardText,
} from "@phosphor-icons/react";
import type { EvaluationParsed } from "@/types";

interface StoryTimelineProps {
  evaluations: EvaluationParsed[];
  className?: string;
}

const POS_METADATA: Record<number, { name: string; Icon: React.ComponentType<{ weight?: "light"; size?: number; className?: string }> }> = {
  1: { name: "Kedatangan, Kemandirian & Kematangan Emosi", Icon: HouseLine },
  2: { name: "Motorik Kasar & Koordinasi Fisik", Icon: PersonSimpleRun },
  3: { name: "Kematangan Kognitif & Numerasi Dasar", Icon: Brain },
  4: { name: "Bahasa Lisan, Pra-Literasi & Motorik Halus", Icon: BookOpen },
  5: { name: "Bermain Bebas, Interaksi Sosial & Kerjasama", Icon: Handshake },
};

const POS_THEMES: Record<number, { bg: string; border: string; badgeBg: string; badgeText: string; iconBg: string }> = {
  1: { bg: "bg-white", border: "border-[#EED2C9]", badgeBg: "bg-[#FAF0E8]", badgeText: "text-[#C9733B]", iconBg: "bg-[#C9733B]" },
  2: { bg: "bg-white", border: "border-[#C9DBD0]", badgeBg: "bg-[#F0F4F1]", badgeText: "text-[#3D7A5A]", iconBg: "bg-[#5C7C68]" },
  3: { bg: "bg-white", border: "border-[#D6DDD8]", badgeBg: "bg-[#F4F6F4]", badgeText: "text-[#4A5D50]", iconBg: "bg-[#566D5E]" },
  4: { bg: "bg-white", border: "border-[#EED2C9]", badgeBg: "bg-[#FAF0E8]", badgeText: "text-[#C9733B]", iconBg: "bg-[#C9733B]" },
  5: { bg: "bg-white", border: "border-[#C9DBD0]", badgeBg: "bg-[#F0F4F1]", badgeText: "text-[#3D7A5A]", iconBg: "bg-[#5C7C68]" },
};

export function StoryTimeline({ evaluations, className = "" }: StoryTimelineProps) {
  // Sort evaluations by pos_number 1 to 5
  const sortedEvals = [...evaluations].sort((a, b) => a.pos_number - b.pos_number);

  if (sortedEvals.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-xs text-[#565C58] border border-[#E8E2D8] shadow-xs">
        Belum ada catatan observasi yang tersimpan untuk calon siswa ini.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} aria-label="Riwayat Catatan Pengamatan">
      <div className="relative border-l-2 border-[#C9DBD0] ml-3.5 sm:ml-5 pl-4 sm:pl-6 space-y-5">
        {sortedEvals.map((ev) => {
          const meta = POS_METADATA[ev.pos_number] || { name: `Pos ${ev.pos_number}`, Icon: ClipboardText };
          const theme = POS_THEMES[ev.pos_number] || {
            bg: "bg-white",
            border: "border-[#E8E2D8]",
            badgeBg: "bg-[#F0F4F1]",
            badgeText: "text-[#3D7A5A]",
            iconBg: "bg-[#5C7C68]",
          };
          const NodeIcon = meta.Icon;
          const hasNote = Boolean(ev.anecdotal_note && ev.anecdotal_note.trim());

          return (
            <div key={ev.id || ev.pos_number} className="relative group">
              {/* Timeline Node Point */}
              <div
                className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-xs ${
                  ev.has_red_flag
                    ? "bg-[#C9733B] text-white"
                    : ev.is_complete
                    ? `${theme.iconBg} text-white`
                    : "bg-[#DDD7CE] text-[#565C58]"
                }`}
                aria-hidden="true"
              >
                <NodeIcon weight="light" size={13} />
              </div>

              {/* Story Content Card with Thematic Color & Soft Elevation Shadow */}
              <div className={`rounded-2xl ${theme.bg} border ${theme.border} p-4 sm:p-5 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(30,35,32,0.10)]`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.badgeText} ${theme.badgeBg} px-2.5 py-0.5 rounded-full shadow-2xs`}>
                      Pos {ev.pos_number}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1E2320] mt-1 tracking-tight">
                      {meta.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {ev.reading_level && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E2E8EE] text-[#1A2127] border border-[#C5D2DE]">
                        {ev.reading_level}
                      </span>
                    )}
                    {ev.total_score !== null && (
                      <span className="text-xs font-bold text-[#3D7A5A] bg-[#EBF5F0] px-2.5 py-0.5 rounded-lg border border-[#C9DBD0]">
                        {ev.total_score >= 3.3
                          ? "Mandiri & Konsisten"
                          : ev.total_score >= 2.5
                          ? "Muncul Mandiri"
                          : ev.total_score >= 1.8
                          ? "Dengan Bimbingan"
                          : "Perlu Stimulasi"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Anecdotal Observation Text */}
                {hasNote ? (
                  <div className="bg-[#FAF7F2] rounded-xl p-3.5 border border-[#E8E2D8]">
                    <p className="text-[11px] font-bold text-[#565C58] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <NotePencil weight="light" size={14} className="text-[#5C7C68]" />
                      <span>Catatan Pengamatan Evaluator:</span>
                    </p>
                    <p className="text-xs text-[#1E2320] leading-relaxed italic">
                      &ldquo;{ev.anecdotal_note}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#787F7A] italic">
                    Belum ada catatan deskriptif khusus di pos ini.
                  </p>
                )}

                {/* Pendampingan Khusus Guidance Box */}
                {ev.has_red_flag && (
                  <div className="mt-3 rounded-xl bg-[#FAF0E8] p-3.5 border border-[#F2D8C7]">
                    <p className="text-xs font-bold text-[#C9733B] flex items-center gap-1.5">
                      <Warning weight="light" size={15} />
                      <span>Sinyal Kebutuhan Pendampingan di Pos {ev.pos_number}</span>
                    </p>
                    <p className="text-[11px] text-[#7A3E1D] mt-0.5 leading-relaxed">
                      Disarankan pendekatan afektif bertahap dan penguatan rasa aman saat masa transisi awal masuk sekolah.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
