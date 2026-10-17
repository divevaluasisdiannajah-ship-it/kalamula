"use client";

import React from "react";

interface PosStepIndicatorProps {
  currentPos: number;
  className?: string;
}

const POS_LABELS: Record<number, string> = {
  1: "EMOSI",
  2: "MOTORIK",
  3: "KOGNITIF",
  4: "BAHASA",
  5: "SOSIAL",
};

export function PosStepIndicator({ currentPos, className = "" }: PosStepIndicatorProps) {
  return (
    <nav
      aria-label="Tahapan Pos Observasi"
      className={`relative flex items-center justify-between w-full max-w-sm mx-auto py-1 font-sans ${className}`}
    >
      {/* Continuous horizontal dashed connecting line behind nodes */}
      <div
        className="absolute top-[15px] left-4 right-4 border-t-2 border-dashed border-[#DDD7CE] -z-0"
        aria-hidden="true"
      />

      {[1, 2, 3, 4, 5].map((pos) => {
        const isActive = pos === currentPos;

        return (
          <div key={pos} className="relative z-10 flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                isActive
                  ? "bg-[#B85627] text-white shadow-sm ring-2 ring-[#B85627] ring-offset-2 ring-offset-[#F6F2E9]"
                  : "bg-white text-[#787F7A] border border-[#DDD7CE] shadow-2xs"
              }`}
              aria-current={isActive ? "step" : undefined}
              title={`Pos ${pos}: ${POS_LABELS[pos]}`}
            >
              {pos}
            </div>
            <span
              className={`text-[9.5px] font-extrabold tracking-wider leading-none ${
                isActive ? "text-[#B85627]" : "text-[#787F7A]"
              }`}
            >
              {POS_LABELS[pos]}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
