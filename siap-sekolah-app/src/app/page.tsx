"use client";

import Link from "next/link";
import {
  Leaf,
  Gear,
  ClipboardText,
  ChalkboardTeacher,
  CaretRight,
} from "@phosphor-icons/react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#1E2320] flex flex-col items-center justify-between p-5 sm:p-8 font-sans selection:bg-[#FAF0E8] selection:text-[#C9733B]">
      {/* Top Spacer for Balance */}
      <div className="w-full h-2" />

      {/* App Header & Emblem */}
      <div className="text-center max-w-md w-full my-auto py-6 sm:py-8 space-y-7">
        <div>
          <div className="w-20 h-20 rounded-[24px] bg-[#C9733B] flex items-center justify-center mx-auto shadow-[0_12px_32px_-6px_rgba(201,115,59,0.28)] border border-[#B8632E]/20 transition-transform hover:scale-105 duration-300">
            <Leaf weight="light" size={42} className="text-white" />
          </div>
          <h1 className="font-brand lowercase text-4xl sm:text-[44px] text-[#1E2320] tracking-tight font-black leading-none mt-4">
            kalamula
          </h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-2 font-medium tracking-normal">
            Memandu Transisi, Memetakan Fondasi
          </p>
          <div className="inline-flex items-center gap-2 bg-[#F0F4F1] border border-[#D4E2D8] px-3.5 py-1.5 rounded-full text-[11px] font-bold text-[#3D7A5A] mt-3.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#5C7C68] animate-pulse" />
            <span>Ruang Observasi Aktif</span>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-3 text-left">
          <p className="text-[11px] font-bold text-[#787F7A] uppercase tracking-wider text-center mb-3">
            Pilih Ruang Masuk
          </p>

          {/* Guru Kelas 1 SD (Soft Sage Pillar) */}
          <Link
            href="/teacher"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] hover:shadow-[0_8px_26px_-2px_rgba(30,35,32,0.08)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none group block cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-13 h-13 bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                <ChalkboardTeacher weight="light" size={26} className="text-[#3D7A5A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#1E2320] leading-snug">
                  Guru Kelas 1 (Fase A)
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Morning Briefing, Peta Tumbuh & Jurnal Harian
                </p>
              </div>
              <CaretRight weight="bold" size={16} className="text-[#787F7A] group-hover:text-[#1E2320] group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Link>

          {/* Evaluator Pos (Warm Terracotta Pillar) */}
          <Link
            href="/evaluator"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] hover:shadow-[0_8px_26px_-2px_rgba(30,35,32,0.08)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none group block cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-13 h-13 bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                <ClipboardText weight="light" size={26} className="text-[#C9733B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#1E2320] leading-snug">
                  Evaluator Pos 1 s.d. 5
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Observasi Rubrik, Pra-Literasi & Catatan Khusus
                </p>
              </div>
              <CaretRight weight="bold" size={16} className="text-[#787F7A] group-hover:text-[#1E2320] group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Link>

          {/* Koordinator PPDB / Admin (Dusk Slate Pillar) */}
          <Link
            href="/admin"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] hover:shadow-[0_8px_26px_-2px_rgba(30,35,32,0.08)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none group block cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-13 h-13 bg-[#E8EDF2] text-[#283747] border border-[#D5DFE8] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                <Gear weight="light" size={26} className="text-[#283747]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#1E2320] leading-snug">
                  Koordinator Asesmen / Admin
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Kelola Gelombang, Pembagian Kelas & PDF Rekap
                </p>
              </div>
              <CaretRight weight="bold" size={16} className="text-[#787F7A] group-hover:text-[#1E2320] group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>

      {/* Sapaan Hangat & Footer */}
      <div className="text-center space-y-1 pb-3 sm:pb-4">
        <p className="text-xs text-[#565C58] font-medium">
          Hari ini kita mengamati ritme belajar Ananda tanpa tergesa.
        </p>
        <p className="text-[11px] text-[#787F7A]">
          kalamula &bull; Ruang Observasi Transisi PAUD ke SD
        </p>
      </div>
    </main>
  );
}
