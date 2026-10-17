"use client";
export const runtime = 'edge';

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F2E9] text-[#22352B] flex flex-col items-center justify-between p-5 sm:p-8 font-sans relative overflow-hidden">
      {/* 2 Decorative Pastel Circles in Background (Crisp Geometric Shapes, No Blur) */}
      <div
        className="w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-[#DCE9E2] absolute -top-12 -right-16 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#F5DFD3] absolute top-28 -left-36 sm:top-24 sm:-left-44 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Spacer for Vertical Balance */}
      <div className="w-full h-2 z-10" />

      {/* App Header & Emblem */}
      <div className="text-center max-w-md w-full my-auto py-6 sm:py-8 space-y-6 z-10">
        <div>
          {/* Logo Box in Warm Terracotta #D67443 */}
          <div className="w-20 h-20 rounded-[1.6rem] bg-[#D67443] flex items-center justify-center mx-auto shadow-md transition-transform hover:scale-105 duration-300">
            <i className="mdi mdi-leaf text-white text-4xl" />
          </div>

          <h1 className="font-brand lowercase text-4xl sm:text-[44px] text-[#22352B] tracking-tight font-extrabold leading-none mt-4">
            kalamula
          </h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-2 font-medium tracking-normal">
            Memandu Transisi, Memetakan Fondasi
          </p>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full text-xs font-bold text-[#22352B] mt-3.5 shadow-xs border border-[#E8E2D8]/60">
            <span className="w-2 h-2 rounded-full bg-[#4F936F] animate-pulse" />
            <span>Ruang Observasi Aktif</span>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-3 text-left pt-2">
          <p className="text-xs font-bold text-[#787F7A] uppercase tracking-wider text-left mb-2.5 px-1">
            PILIH RUANG MASUK
          </p>

          {/* 1. Guru Kelas 1 (Fase A) */}
          <Link
            href="/teacher"
            className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-14 h-14 bg-[#E4EFE9] text-[#486B5A] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <i className="mdi mdi-human-male-board text-2xl" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base text-[#22352B] leading-snug">
                  Guru Kelas 1 (Fase A)
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Morning Briefing, Peta Tumbuh & Jurnal Harian
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </Link>

          {/* 2. Evaluator Pos 1 s.d. 5 */}
          <Link
            href="/evaluator"
            className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#B85627] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-14 h-14 bg-[#F9E6DC] text-[#B85627] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <i className="mdi mdi-clipboard-check-outline text-2xl" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base text-[#22352B] leading-snug">
                  Evaluator Pos 1 s.d. 5
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Observasi Rubrik, Pra-Literasi & Catatan Khusus
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F9E6DC] text-[#B85627] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </Link>

          {/* 3. Koordinator Asesmen / Admin */}
          <Link
            href="/admin"
            className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#36506C] focus-visible:ring-offset-2 focus-visible:outline-none group flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-14 h-14 bg-[#E4EAF2] text-[#36506C] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <i className="mdi mdi-view-dashboard-outline text-2xl" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-base text-[#22352B] leading-snug">
                  Koordinator Asesmen / Admin
                </p>
                <p className="text-xs text-[#565C58] mt-0.5 truncate leading-relaxed">
                  Kelola Gelombang, Pembagian Kelas & PDF Rekap
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform">
              <i className="mdi mdi-chevron-right text-xl" />
            </div>
          </Link>
        </div>
      </div>

      {/* Sapaan Hangat & Footer */}
      <div className="text-center space-y-1 pb-3 sm:pb-4 z-10">
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
