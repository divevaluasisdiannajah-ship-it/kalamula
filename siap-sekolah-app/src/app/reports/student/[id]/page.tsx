"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { RadarChart } from "@/components/reports/RadarChart";
import {
  Printer,
  ArrowLeft,
  Leaf,
  User,
  Warning,
  BookOpen,
  ChartPieSlice,
  ChartBar,
  NotePencil,
  Lightbulb,
  FileText,
} from "@phosphor-icons/react";
import type { StudentProfile } from "@/types";

interface ReportData {
  profile: StudentProfile;
  narratives: Record<number, string>;
  stimulations: string[];
}

export default function StudentReportPDFPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/student/${studentId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // offline/error handling
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center text-ios-label-secondary font-medium">
        Menyiapkan dokumen profil siswa...
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center p-6 text-center">
        <FileText weight="light" size={44} className="text-sage-700 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ios-label">Data Siswa Tidak Ditemukan</h2>
        <button
          onClick={() => router.back()}
          className="ios-btn bg-ios-blue text-white px-5 text-sm mt-4 rounded-ios-md shadow-ios-sm hover:bg-sage-600 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft weight="light" size={14} />
          <span>Kembali</span>
        </button>
      </div>
    );
  }

  const { profile, narratives, stimulations } = data;
  const { student } = profile;

  // Calculate age string (years and months)
  let ageString = "-";
  if (student.birth_date) {
    const bDate = new Date(student.birth_date);
    const now = new Date();
    if (!isNaN(bDate.getTime())) {
      let years = now.getFullYear() - bDate.getFullYear();
      let months = now.getMonth() - bDate.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      ageString = `${years} thn ${months} bln`;
    }
  }

  const readingLevelMap = {
    L1: { title: "Tingkat 1: Mengenal Gambar & Simbol", desc: "Mengenal simbol & gambar visual benda konkret sehari-hari." },
    L2: { title: "Tingkat 2: Mengenal Huruf & Bunyi", desc: "Mengenal bentuk & bunyi huruf vokal serta konsonan." },
    L3: { title: "Tingkat 3: Membaca Suku Kata", desc: "Membaca gabungan suku kata sederhana (bu-ku, bo-la)." },
    L4: { title: "Tingkat 4: Membaca Kalimat Lancar", desc: "Membaca kalimat pendek dengan lancar dan memahami artinya." },
  };

  const posNarrativeList = [
    { pos: 1, title: "Kematangan Emosi & Kemandirian", text: narratives[1] },
    { pos: 2, title: "Motorik Kasar & Koordinasi", text: narratives[2] },
    { pos: 3, title: "Kognitif & Numerasi Dasar", text: narratives[3] },
    { pos: 4, title: "Bahasa Lisan & Pra-Literasi", text: narratives[4] },
    { pos: 5, title: "Interaksi Sosial & Kolaborasi", text: narratives[5] },
  ].filter((p) => Boolean(p.text));

  return (
    <div className="min-h-screen bg-[#EDECE8] py-4 sm:py-6 px-3 md:px-6 print:bg-white print:p-0 print:min-h-0">
      {/* Embedded Print Style for Strict 1-Page A4 Fitting */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 7mm 9mm 7mm 9mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            max-height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .print-flex-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .print-sheet * {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="max-w-[780px] mx-auto mb-3 flex items-center justify-between gap-2.5 print:hidden">
        <button
          onClick={() => router.back()}
          className="ios-btn bg-white text-stone-800 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl shadow-xs ring-1 ring-black/[0.05] hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <ArrowLeft weight="light" size={14} />
          <span>Kembali</span>
        </button>
        <button
          onClick={handlePrint}
          className="ios-btn bg-[#1E2E24] hover:bg-[#152219] text-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all font-bold tracking-wide cursor-pointer flex-shrink-0"
          style={{ backgroundColor: "#1E2E24", color: "#FFFFFF" }}
        >
          <Printer weight="bold" size={16} />
          <span>Cetak Dokumen A4</span>
          <span className="hidden sm:inline text-xs font-normal opacity-80">(1 Lembar)</span>
        </button>
      </div>

      {/* Printable Sheet (Standard A4 / Portrait Page) */}
      <div className="print-sheet max-w-[780px] mx-auto bg-white rounded-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] p-3.5 sm:p-6 print:p-0 text-stone-900 leading-normal">
        {/* Document Header */}
        <div className="pb-2.5 mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 gap-2 print:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sage-800 text-white rounded-xl flex items-center justify-center shadow-xs flex-shrink-0">
              <Leaf weight="light" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-brand lowercase text-xl font-bold text-stone-900 tracking-tight leading-none">
                  kalamula
                </h1>
              </div>
              <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                Laporan Asesmen Diagnostik Kesiapan Belajar Siswa
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-[10.5px] text-stone-600 print:text-right">
            <p className="font-bold text-stone-900">{profile.batch?.batch_name || "Batch Observasi"}</p>
            <p className="text-[10px] text-stone-500">
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Card 1: Student Identity Card */}
        <div className="print-flex-row bg-stone-50/90 rounded-xl p-2.5 sm:p-3 mb-2.5 ring-1 ring-stone-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs flex-shrink-0 font-bold ${
                student.gender === "L" ? "bg-slate-100 text-slate-700 ring-1 ring-slate-200/60" : "bg-clay-100/60 text-clay-800 ring-1 ring-clay-200/60"
              }`}
            >
              <User weight="light" size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-stone-950 truncate leading-tight">
                  {student.full_name}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-white text-stone-800 shadow-xs ring-1 ring-stone-200/60">
                  &ldquo;{student.nickname}&rdquo;
                </span>
                {profile.has_any_red_flag && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FAF0E8] text-[#C86D51] shadow-xs ring-1 ring-[#F2D8C7] flex items-center gap-1">
                    <Warning weight="light" size={12} />
                    <span>Sinyal Pendampingan</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-700 mt-0.5 leading-snug font-normal">
                No. Reg: <span className="font-mono font-bold text-stone-950">{student.registration_no}</span> &bull; JK:{" "}
                <span className="font-bold text-stone-950">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</span> &bull; Usia:{" "}
                <span className="font-bold text-stone-950">{ageString}</span>
                {student.parent_name && (
                  <> &bull; Ortu: <span className="font-semibold text-stone-950">{student.parent_name}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-stretch sm:self-center justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
            <div className="text-center px-3 py-1.5 bg-white rounded-lg shadow-xs ring-1 ring-stone-200/70 min-w-[90px]">
              <span className="text-[9.5px] uppercase font-bold text-stone-600 block leading-none">Kemandirian</span>
              <span className="text-[11px] font-bold text-sage-900 leading-tight">
                {profile.overall_score !== null
                  ? profile.overall_score >= 3.3
                    ? "Mandiri & Konsisten"
                    : profile.overall_score >= 2.5
                    ? "Muncul Mandiri"
                    : "Dengan Bimbingan"
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Card Red Flag Notice (Conditional, Compact Strip) */}
        {profile.has_any_red_flag && (
          <div className="mb-2.5 px-3 py-1.5 bg-[#FAF0E8] rounded-xl ring-1 ring-clay-200/70 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10.5px] text-clay-900">
              <Warning weight="bold" size={14} className="text-[#C86D51] flex-shrink-0" />
              <span>
                <strong>Catatan Pendampingan:</strong> Terdapat indikator kesiapan belajar yang memerlukan observasi suportif dan koordinasi bersama orang tua.
              </span>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-clay-200/80 text-clay-950 flex-shrink-0">
              Perhatian Khusus
            </span>
          </div>
        )}

        {/* Middle Section: Symmetrical 2-Column Grid (Responsive on Screen, Locked Side-by-Side on Print) */}
        <div className="print-grid-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 items-stretch">
          {/* Column 1: Radar Chart (Dusk Slate Palette) */}
          <div className="bg-dusk-50/70 rounded-xl p-2.5 sm:p-3 ring-1 ring-dusk-200/70 shadow-xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <ChartPieSlice weight="light" size={16} className="text-stone-700" />
                  <span>Radar Kesiapan Belajar</span>
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-stone-900 ring-1 ring-stone-200/60 shadow-xs">
                  Profil 360°
                </span>
              </div>
              <div className="flex justify-center py-0.5">
                <RadarChart scores={profile.pos_scores} size={195} />
              </div>
            </div>
            <div className="pt-2 border-t border-dusk-200/60 flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-[10px] text-stone-800 font-medium">
              <span className="leading-tight">Skala: 1 (Bimbingan) &bull; 2 (Mulai Terbiasa) &bull; 3 (Mandiri) &bull; 4 (Sangat Mandiri)</span>
              <span className="font-bold text-stone-950 flex-shrink-0 self-end xs:self-auto">Target: &ge; 3.0</span>
            </div>
          </div>

          {/* Column 2: Reading Level & Score Breakdown */}
          <div className="flex flex-col gap-2 justify-between min-w-0">
            {/* Card: Reading Level */}
            <div className="bg-dusk-50/80 rounded-xl p-2.5 sm:p-3 ring-1 ring-dusk-200/70 shadow-xs flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <BookOpen weight="light" size={16} className="text-stone-700" />
                  <span>Tingkat Kemampuan Membaca</span>
                </h3>
                {profile.reading_level && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-800 text-white shadow-xs">
                    {profile.reading_level}
                  </span>
                )}
              </div>
              {profile.reading_level && readingLevelMap[profile.reading_level] ? (
                <div className="bg-white/95 rounded-lg p-2.5 ring-1 ring-stone-200/70 shadow-xs">
                  <p className="text-xs font-bold text-stone-950 leading-snug">
                    {readingLevelMap[profile.reading_level].title}
                  </p>
                  <p className="text-[10.5px] text-stone-800 leading-snug mt-0.5 font-medium">
                    {readingLevelMap[profile.reading_level].desc}
                  </p>
                </div>
              ) : (
                <p className="text-[10.5px] text-stone-700 italic bg-white/80 rounded-lg p-2 ring-1 ring-stone-200/60">
                  Belum dilakukan pemetaan tingkat kemampuan membaca.
                </p>
              )}
            </div>

            {/* Card: Score Summary Bar */}
            <div className="bg-sage-50/70 rounded-xl p-2.5 sm:p-3 ring-1 ring-sage-200/70 shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <ChartBar weight="light" size={16} className="text-stone-700" />
                  <span>Rincian Skor (Skala 1-4)</span>
                </h4>
                <span className="text-[10.5px] font-semibold text-stone-700">5 Aspek Asesmen</span>
              </div>
              <div className="space-y-1">
                {[
                  { pos: 1, name: "Emosi & Mandiri", score: profile.pos_scores[1] },
                  { pos: 2, name: "Motorik Kasar", score: profile.pos_scores[2] },
                  { pos: 3, name: "Kognitif & Numerasi", score: profile.pos_scores[3] },
                  { pos: 4, name: "Bahasa & Literasi", score: profile.pos_scores[4] },
                  { pos: 5, name: "Sosial & Kerjasama", score: profile.pos_scores[5] },
                ].map((item) => {
                  const pct = item.score !== null ? Math.round((item.score / 4) * 100) : 0;
                  return (
                    <div key={item.pos} className="bg-white/95 rounded-lg px-2.5 py-1 ring-1 ring-stone-200/60 shadow-xs flex items-center justify-between text-[10.5px]">
                      <span className="text-stone-950 font-semibold truncate flex-1 min-w-0 pr-2">{item.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-14 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-sage-700 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-bold text-stone-950 text-[10.5px] min-w-[42px] text-right font-mono">
                          {item.score !== null ? `${item.score.toFixed(1)}/4` : "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Symmetrical 2-Column Grid (Responsive on Screen, Locked Side-by-Side on Print) */}
        <div className="print-grid-2 grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 items-stretch">
          {/* Card: Catatan Pengamatan Lapangan */}
          <div className="bg-[#FAF4F0] rounded-xl p-2.5 sm:p-3 ring-1 ring-clay-200/70 shadow-xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <NotePencil weight="light" size={16} className="text-stone-700" />
                  <span>Catatan Pengamatan Lapangan</span>
                </h3>
                <span className="text-[10px] font-semibold text-stone-700">
                  {posNarrativeList.length} Catatan
                </span>
              </div>
              {posNarrativeList.length > 0 ? (
                <div className="space-y-1.5">
                  {posNarrativeList.slice(0, 5).map((item) => (
                    <div
                      key={item.pos}
                      className="p-1.5 bg-white/95 rounded-lg ring-1 ring-clay-200/60 shadow-xs flex items-start gap-1.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-clay-100 text-stone-900 flex items-center justify-center font-bold text-[9.5px] flex-shrink-0 mt-0.5">
                        {item.pos}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold text-stone-950 leading-tight">{item.title}</p>
                        <p className="text-[10px] text-stone-900 leading-snug italic mt-0.5 line-clamp-3 print:line-clamp-none font-medium">
                          &ldquo;{item.text}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px] text-stone-700 italic bg-white/80 p-2 rounded-lg">
                  Belum ada catatan pengamatan guru.
                </p>
              )}
            </div>
          </div>

          {/* Card: Home Stimulation Advice */}
          <div className="bg-sage-50/80 rounded-xl p-2.5 sm:p-3 ring-1 ring-sage-200/70 shadow-xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <Lightbulb weight="light" size={16} className="text-stone-700" />
                  <span>Panduan Latihan di Rumah</span>
                </h3>
                <span className="text-[10px] font-semibold text-stone-700">
                  Untuk Orang Tua
                </span>
              </div>
              {stimulations.length > 0 ? (
                <div className="space-y-1.5">
                  {stimulations.slice(0, 4).map((stim, i) => (
                    <div
                      key={i}
                      className="p-1.5 bg-white/95 rounded-lg ring-1 ring-sage-200/60 shadow-xs flex items-start gap-1.5 text-[10px] sm:text-[10.5px] text-stone-900 leading-snug font-medium"
                    >
                      <span className="w-4 h-4 rounded-full bg-sage-100 text-stone-900 flex items-center justify-center font-bold text-[9.5px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="flex-1 leading-snug">{stim}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px] text-stone-700 italic bg-white/80 p-2 rounded-lg">
                  Belum ada rekomendasi stimulasi.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="print-grid-2 pt-2.5 border-t border-stone-300 mt-2.5 grid grid-cols-2 text-center text-[10.5px]">
          <div>
            <p className="text-stone-600 font-medium">Koordinator Asesmen</p>
            <div className="h-10 flex items-end justify-center">
              <span className="font-bold text-stone-950 underline text-xs">( Tim Asesor PPDB )</span>
            </div>
          </div>
          <div>
            <p className="text-stone-600 font-medium">Mengetahui Orang Tua / Wali</p>
            <div className="h-10 flex items-end justify-center">
              <span className="font-bold text-stone-950 underline text-xs px-1 truncate max-w-[170px] sm:max-w-none inline-block">
                ( {student.parent_name || "...................................."} )
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
