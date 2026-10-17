"use client";

import React from "react";

export function SkeletonAssessmentForm() {
  return (
    <div className="animate-pulse space-y-5 font-sans">
      {/* Student card skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8]/60 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#EFECE4] flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-5 bg-[#EFECE4] rounded-full w-2/5" />
            <div className="h-3.5 bg-[#EFECE4] rounded-full w-3/5" />
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#EFECE4] flex-shrink-0" />
      </div>

      {/* Pos info skeleton */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8E2D8]/60 space-y-3">
        <div className="h-4 bg-[#EFECE4] rounded-full w-1/3" />
        <div className="w-full h-2.5 bg-[#EFECE4] rounded-full" />
      </div>

      {/* Indicator cards skeleton (3x) */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8]/60 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EFECE4] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#EFECE4] rounded-full w-2/3" />
              <div className="h-3 bg-[#EFECE4] rounded-full w-5/6" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-14 rounded-2xl bg-[#EFECE4]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
