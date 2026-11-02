"use client";

import React from "react";

interface PosStepIndicatorProps {
  currentPos: number;
  className?: string;
}

const DOMAIN_STAGES: Record<number, { short: string; full: string; icon: string }> = {
  1: {
    short: "EMOSI & KEMANDIRIAN",
    full: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    icon: "mdi-account-check-outline",
  },
  2: {
    short: "MOTORIK KASAR",
    full: "Pos Motorik Kasar & Koordinasi Fisik",
    icon: "mdi-run-fast",
  },
  3: {
    short: "KOGNITIF",
    full: "Pos Kematangan Kognitif & Berhitung",
    icon: "mdi-head-lightbulb-outline",
  },
  4: {
    short: "BAHASA & LITERASI",
    full: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
    icon: "mdi-book-open-page-variant-outline",
  },
};

export function PosStepIndicator({ currentPos, className = "" }: PosStepIndicatorProps) {
  return (
    <nav
      aria-label="Tahapan Observasi SPMB"
      className={`relative flex items-center justify-between w-full max-w-md mx-auto py-1 font-sans ${className}`}
    >
      {/* Continuous horizontal dashed connecting line behind nodes */}
      <div
        className="absolute top-3.5 sm:top-4 left-6 right-6 border-t-2 border-dashed border-[#DDD7CE] -z-0"
        aria-hidden="true"
      />

      {[1, 2, 3, 4].map((pos) => {
        const stage = DOMAIN_STAGES[pos];
        const isActive = pos === currentPos;

        return (
          <div key={pos} className="relative z-10 flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-150 ease-out ${
                isActive
                  ? "bg-[#B85627] text-white shadow-xs ring-2 ring-[#B85627] ring-offset-2 ring-offset-[#F6F2E9]"
                  : "bg-white text-[#787F7A] border border-[#DDD7CE] shadow-2xs"
              }`}
              aria-current={isActive ? "step" : undefined}
              title={stage?.full || `Pos ${pos}`}
            >
              <i className={`mdi ${stage?.icon || "mdi-circle"} text-sm leading-none`} />
            </div>
            <span
              className={`text-[9px] font-extrabold tracking-wider leading-none text-center max-w-[85px] ${
                isActive ? "text-[#B85627]" : "text-[#787F7A]"
              }`}
            >
              {stage?.short}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
