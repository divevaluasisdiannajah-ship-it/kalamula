"use client";

// AETRIUM DESIGN TOKENS — SKELETON PLACEHOLDER
// Surface: #FFFFFF, Placeholder: #F0EBE1, Border: #E8E2D8

import React from "react";

export function SkeletonStudentCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-3px_rgba(30,35,32,0.04)] space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Avatar Skeleton */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#F0EBE1] flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            {/* Nickname / Name Skeleton */}
            <div className="h-5 bg-[#F0EBE1] rounded-full w-2/5 sm:w-1/3" />
            {/* Fullname / Meta Skeleton */}
            <div className="h-3.5 bg-[#F0EBE1] rounded-full w-3/5 sm:w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 self-end sm:self-center">
          {/* Progress Ring Skeleton */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F0EBE1]" />
          {/* Button Slot Skeleton */}
          <div className="w-28 h-10 rounded-xl bg-[#F0EBE1]" />
        </div>
      </div>
    </div>
  );
}
