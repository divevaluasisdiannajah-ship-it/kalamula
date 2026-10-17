"use client";

import React from "react";
import type { EvaluationParsed } from "@/types";

interface StoryTimelineProps {
  evaluations: EvaluationParsed[];
  className?: string;
}

const POS_METADATA: Record<number, { name: string; mdiIcon: string }> = {
  1: { name: "Kedatangan, Kemandirian & Kematangan Emosi", mdiIcon: "mdi-home-heart" },
  2: { name: "Motorik Kasar & Koordinasi Fisik", mdiIcon: "mdi-run-fast" },
  3: { name: "Kematangan Kognitif & Numerasi Dasar", mdiIcon: "mdi-head-lightbulb-outline" },
  4: { name: "Bahasa Lisan, Pra-Literasi & Motorik Halus", mdiIcon: "mdi-book-open-page-variant-outline" },
  5: { name: "Bermain Bebas, Interaksi Sosial & Kerjasama", mdiIcon: "mdi-handshake-outline" },
};

const POS_THEMES: Record<
  number,
  { bg: string; border: string; badgeBg: string; badgeText: string; iconBg: string }
> = {
  1: { bg: "bg-white", border: "border-[#E8E2D8]", badgeBg: "bg-[#F9E6DC]", badgeText: "text-[#8C3713]", iconBg: "bg-[#B85627]" },
  2: { bg: "bg-white", border: "border-[#E8E2D8]", badgeBg: "bg-[#E4EFE9]", badgeText: "text-[#486B5A]", iconBg: "bg-[#486B5A]" },
  3: { bg: "bg-white", border: "border-[#E8E2D8]", badgeBg: "bg-[#E4EAF2]", badgeText: "text-[#36506C]", iconBg: "bg-[#36506C]" },
  4: { bg: "bg-white", border: "border-[#E8E2D8]", badgeBg: "bg-[#EFE7D6]", badgeText: "text-[#7D5327]", iconBg: "bg-[#7D5327]" },
  5: { bg: "bg-white", border: "border-[#E8E2D8]", badgeBg: "bg-[#E4EFE9]", badgeText: "text-[#486B5A]", iconBg: "bg-[#486B5A]" },
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
      <div className="relative border-l-2 border-[#CBE0D4] ml-3.5 sm:ml-5 pl-4 sm:pl-6 space-y-4">
        {sortedEvals.map((ev) => {
          const meta = POS_METADATA[ev.pos_number] || {
            name: `Pos ${ev.pos_number}`,
            mdiIcon: "mdi-clipboard-text-outline",
          };
          const theme = POS_THEMES[ev.pos_number] || {
            bg: "bg-white",
            border: "border-[#E8E2D8]",
            badgeBg: "bg-[#E4EFE9]",
            badgeText: "text-[#486B5A]",
            iconBg: "bg-[#486B5A]",
          };
          const hasNote = Boolean(ev.anecdotal_note && ev.anecdotal_note.trim());

          return (
            <div key={ev.id || ev.pos_number} className="relative group">
              {/* Timeline Node Point */}
              <div
                className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-6 h-6 rounded-full shadow-xs flex items-center justify-center text-xs ${
                  ev.has_red_flag
                    ? "bg-[#B85627] text-white"
                    : ev.is_complete
                    ? `${theme.iconBg} text-white`
                    : "bg-[#DDD7CE] text-[#565C58]"
                }`}
                aria-hidden="true"
              >
                <i className={`mdi ${meta.mdiIcon} text-xs`} />
              </div>

              {/* Story Content Card */}
              <div
                className={`rounded-2xl ${theme.bg} border ${theme.border} p-4 shadow-sm space-y-2`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF8F5]">
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.badgeText} ${theme.badgeBg} px-2.5 py-0.5 rounded-full shadow-2xs`}
                    >
                      Pos {ev.pos_number}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#22352B] mt-1 tracking-tight">
                      {meta.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {ev.reading_level && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFE7D6] text-[#7D5327] border border-[#E8DFC8]">
                        {ev.reading_level}
                      </span>
                    )}
                    {ev.total_score !== null && (
                      <span className="text-xs font-bold text-[#486B5A] bg-[#E4EFE9] px-2.5 py-0.5 rounded-lg border border-[#CBE0D4]">
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
                  <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E8E2D8]">
                    <p className="text-[11px] font-bold text-[#565C58] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <i className="mdi mdi-pencil-outline text-[#486B5A]" />
                      <span>Catatan Pengamatan Evaluator:</span>
                    </p>
                    <p className="text-xs text-[#22352B] leading-relaxed italic">
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
                  <div className="rounded-xl bg-[#F9E6DC] p-3 border border-[#F1CFC0]">
                    <p className="text-xs font-bold text-[#8C3713] flex items-center gap-1.5">
                      <i className="mdi mdi-alert-outline text-base" />
                      <span>Sinyal Kebutuhan Pendampingan di Pos {ev.pos_number}</span>
                    </p>
                    <p className="text-[11px] text-[#8C3713] mt-0.5 leading-relaxed">
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
