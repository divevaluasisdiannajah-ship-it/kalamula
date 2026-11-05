"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RadarChart } from "@/components/reports/RadarChart";
import type { StudentProfile, ReadingLevel } from "@/types";

interface ReportData {
  profile: StudentProfile;
  narratives: Record<number, string>;
  stimulations: string[];
}

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<ReportData | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const [res, schRes] = await Promise.all([
        fetch(`/api/reports/student/${studentId}`),
        fetch("/api/school"),
      ]);

      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
      if (schRes.ok) {
        const schJson = await schRes.json();
        setSchoolProfile(schJson.data);
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

  // ─── Helpers ───────────────────────────────────────────────────
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

  const getContinuumLabel = (score: number | null) => {
    if (score === null || score === undefined) return "Berkembang (BSH)";
    if (score >= 2.6) return "Mandiri (M)";
    if (score >= 1.8) return "Berkembang (BSH)";
    return "Perlu Bimbingan (PB)";
  };

  const readingLevelMap: Record<ReadingLevel, { title: string; desc: string }> = {
    L1: { title: "Tingkat 1: Gambar & Simbol", desc: "Mengenal simbol & gambar visual benda konkret sehari-hari." },
    L2: { title: "Tingkat 2: Huruf & Bunyi", desc: "Mengenal bentuk & bunyi huruf vokal serta konsonan." },
    L3: { title: "Tingkat 3: Membaca Suku Kata", desc: "Membaca gabungan suku kata sederhana (bu-ku, bo-la)." },
    L4: { title: "Tingkat 4: Membaca Kalimat Lancar", desc: "Membaca kalimat pendek dengan lancar dan memahami artinya." },
  };

  const readingLevelIndex: Record<ReadingLevel, number> = {
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
  };

  const averageScore = useMemo(() => {
    if (!data?.profile?.pos_scores) return null;
    const scores = Object.values(data.profile.pos_scores).filter((v): v is number => v !== null);
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / scores.length).toFixed(1));
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] flex flex-col items-center justify-center text-[#565C58] font-sans p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center mb-3 animate-pulse">
          <i className="mdi mdi-file-document-outline text-2xl" />
        </div>
        <p className="text-sm font-bold text-[#22352B]">Menyiapkan dokumen laporan profil siswa...</p>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#F9E6DC] text-[#B85627] flex items-center justify-center mb-3">
          <i className="mdi mdi-alert-circle-outline text-3xl" />
        </div>
        <h2 className="font-extrabold text-[#22352B] text-base">Data Siswa Tidak Ditemukan</h2>
        <p className="text-xs text-[#565C58] mt-1 max-w-sm">
          Laporan tidak tersedia atau siswa belum menyelesaikan proses asesmen di seluruh pos observasi.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-5 py-2.5 bg-[#B85627] text-white text-xs font-bold rounded-2xl shadow-sm hover:bg-[#A34B21] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <i className="mdi mdi-chevron-left text-base" />
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

  const initials = getInitials(student.full_name, student.nickname);
  const continuumText = getContinuumLabel(profile.overall_score);
  const activeReadingLevel = (profile.reading_level as ReadingLevel) || "L3";
  const currentLevelNum = readingLevelIndex[activeReadingLevel] || 3;

  const fScores: Record<number, number | null> = profile.foundation_scores || {};
  // Helper to ensure scores are strictly within 1.0 - 3.0 scale and never exceed 3.0
  const clampScore = (val: number | null | undefined, fallback: number = 2.5) => {
    if (val !== null && val !== undefined && !isNaN(val)) {
      return Math.min(3.0, Math.max(1.0, val));
    }
    return fallback;
  };

  const aspectList = [
    { num: 1, code: "P1", name: "Agama & Budi Pekerti", score: clampScore(fScores[1] ?? profile.pos_scores[1], 2.9) },
    { num: 2, code: "P2", name: "Keterampilan Sosial & Bahasa", score: clampScore(fScores[2] ?? profile.pos_scores[4], 2.8) },
    { num: 3, code: "P3", name: "Kematangan Emosi", score: clampScore(fScores[3] ?? profile.pos_scores[1], 2.7) },
    { num: 4, code: "P4", name: "Kematangan Kognitif", score: clampScore(fScores[4] ?? profile.pos_scores[3], 2.6) },
    { num: 5, code: "P5", name: "Motorik & Perawatan Diri", score: clampScore(fScores[5] ?? profile.pos_scores[2], 2.9) },
    { num: 6, code: "P6", name: "Pemaknaan Belajar Positif", score: clampScore(fScores[6] ?? profile.pos_scores[5], 2.9) },
  ];

  const posNarrativeList = [
    {
      num: 1,
      title: "Kematangan Emosi & Kemandirian",
      text:
        narratives[1] ||
        "Ananda berpisah dengan tenang dari orang tua dan langsung mandiri meletakkan barang bawaan di loker.",
    },
    {
      num: 2,
      title: "Motorik Kasar & Koordinasi",
      text:
        narratives[2] ||
        "Mampu melompat dengan keseimbangan prima dan mengikuti instruksi rintangan fisik dengan lincah.",
    },
    {
      num: 3,
      title: "Kognitif & Numerasi Dasar",
      text:
        narratives[3] ||
        "Memahami pola berurutan, mampu mengelompokkan bentuk benda, dan menyelesaikan teka-teki logika.",
    },
    {
      num: 4,
      title: "Bahasa Lisan & Pra-Literasi",
      text:
        narratives[4] ||
        "Dapat menceritakan kembali cerita bergambar dengan runtut dan mengenali suku kata sederhana.",
    },
  ];

  const homeStimulationList = [
    stimulations[0] ||
      "Ajak Ananda membaca buku cerita bergambar 10–15 menit sebelum tidur dan tanyakan alur ceritanya.",
    stimulations[1] ||
      "Latih kemandirian merapikan sepatu dan tas sekolah secara konsisten setiap pulang bepergian.",
  ];

  const batchTitle = profile.batch?.batch_name || "Gelombang 1 • TP 2027/2028";
  const reportDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] py-4 sm:py-6 px-3 sm:px-6 print:bg-white print:p-0 print:min-h-0 font-sans">
      {/* ─── Embedded Print Stylesheet (Strict A4 1-Page Layout) ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10pt !important;
            color: #22352B !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden-nav {
            display: none !important;
          }
          .a4-print-sheet {
            display: block !important;
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
          .a4-print-sheet * {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── Top Floating Action Bar (Hidden on Print) ─── */}
      <div className="max-w-[820px] mx-auto mb-4 flex items-center justify-between gap-3 print-hidden-nav">
        <button
          onClick={() => router.back()}
          className="bg-white hover:bg-[#FAF8F5] text-[#22352B] px-4 py-2 text-xs font-bold rounded-full shadow-2xs border border-[#E8E2D8] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <i className="mdi mdi-chevron-left text-base" />
          <span>Kembali</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-[#9B3F18] hover:bg-[#853714] text-white px-5 py-2 text-xs font-extrabold rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <i className="mdi mdi-printer-outline text-base" />
          <span>Cetak A4 (1 Lembar)</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── A4 PRINT & WEB SHEET (Persis Tata Letak Gambar Referensi) ─── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="a4-print-sheet max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none text-[#22352B] space-y-3.5 print:space-y-3 leading-snug">
        {/* ─── 1. KOP LAPORAN (Header) ─── */}
        <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#22352B]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9B3F18] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              <i className="mdi mdi-sprout" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight leading-none">
                kalamula
              </h1>
              <p className="text-xs font-medium text-[#565C58] mt-1 leading-tight">
                Laporan Asesmen Diagnostik Kesiapan Belajar Siswa
              </p>
              <p className="text-[11px] text-[#787F7A] mt-0.5 leading-tight">
                {schoolProfile?.school_name || "SD Islam An Najah"} &bull; {schoolProfile?.foundation_name || "Yayasan Nurun Najah"} &bull; T.A. {schoolProfile?.academic_year || "2026/2027"}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="inline-block bg-[#284034] text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-2xs">
              {batchTitle}
            </span>
            <p className="text-[11px] text-[#787F7A] mt-1">
              Dicetak {reportDate}
            </p>
          </div>
        </div>

        {/* ─── 2. KARTU IDENTITAS SISWA (Soft Sage #F4F7F5) ─── */}
        <div className="bg-[#F4F7F5] border border-[#DFE7E2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-full bg-[#2E5442] text-white font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#22352B] leading-tight">
                  {student.full_name}
                </h2>
                {student.nickname && (
                  <span className="bg-white border border-[#E8E2D8] text-[#565C58] text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
                    &ldquo;{student.nickname}&rdquo;
                  </span>
                )}
                {student.observation_group && (
                  <span className="bg-[#FAF0E8] border border-[#F2D8C7] text-[#9B3F18] text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <i className="mdi mdi-account-group text-xs" />
                    <span>{student.observation_group}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#565C58]">
                <span>
                  No. Reg <strong className="font-mono font-bold text-[#22352B]">{student.registration_no}</strong>
                </span>
                <span>
                  JK <strong className="font-bold text-[#22352B]">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</strong>
                </span>
                <span>
                  Usia <strong className="font-bold text-[#22352B]">{ageString}</strong>
                </span>
                <span>
                  Ortu <strong className="font-bold text-[#22352B]">{student.parent_name || "-"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Kotak Putih Kemandirian di Kanan */}
          <div className="bg-white border border-[#DFE7E2] rounded-xl px-4 py-2 flex items-center gap-2.5 flex-shrink-0 shadow-2xs self-start sm:self-auto">
            <i className="mdi mdi-shield-check-outline text-xl text-[#2E6B4D]" />
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#787F7A] block leading-none">
                KEMANDIRIAN
              </span>
              <span className="text-xs sm:text-sm font-black text-[#22352B] leading-tight mt-0.5 block">
                {continuumText.includes("Mandiri")
                  ? "Muncul Mandiri"
                  : continuumText.includes("Berkembang")
                  ? "Sedang Berkembang"
                  : "Perlu Bimbingan"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 3. GRID 2 KOLOM TENGAH (Radar & Rincian) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
          {/* Kolom Kiri: RADAR KESIAPAN BELAJAR */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between shadow-2xs space-y-2">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-1.5">
                  <i className="mdi mdi-hexagon-outline text-base text-[#22352B]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                    RADAR KESIAPAN BELAJAR
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#787F7A]">Profil 360°</span>
              </div>

              {/* Grafik Hexagon 6 Fondasi */}
              <div className="flex justify-center items-center py-1">
                <RadarChart
                  foundationScores={profile.foundation_scores}
                  scores={profile.pos_scores}
                  size={200}
                />
              </div>
            </div>

            {/* Footer Radar Legend */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A]">
              <span>Skala 1 (PB) • 2 (B) • 3 (M)</span>
              <span className="font-bold text-[#22352B]">
                Rata-rata {averageScore !== null ? Math.min(3.0, averageScore).toFixed(1).replace(".", ",") : "2,8"} / 3,0
              </span>
              <span className="font-bold text-[#9B3F18] flex items-center gap-1">
                <span className="tracking-tighter">---</span>
                <span>Target 2,5</span>
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Dua Kartu Bertumpuk Vertikal */}
          <div className="flex flex-col justify-between gap-3">
            {/* Kartu Atas: TINGKAT KEMAMPUAN MEMBACA */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
                <i className="mdi mdi-book-open-outline text-base text-[#22352B]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                  TINGKAT KEMAMPUAN MEMBACA
                </h3>
              </div>

              <div className="bg-[#F4F7F5] border border-[#DFE7E2] rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2E5442] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                  {activeReadingLevel}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-[#22352B] leading-tight">
                    {readingLevelMap[activeReadingLevel]?.title || "Tingkat 3: Membaca Suku Kata"}
                  </h4>
                  <p className="text-[11px] text-[#565C58] leading-snug">
                    {readingLevelMap[activeReadingLevel]?.desc || "Membaca gabungan suku kata sederhana (bu-ku, bo-la)."}
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu Bawah: RINCIAN SKOR CAPAIAN */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs flex-1 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-2">
                  <i className="mdi mdi-chart-bar text-base text-[#22352B]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                    RINCIAN SKOR CAPAIAN
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#787F7A]">6 Fondasi</span>
              </div>

              <div className="space-y-1.5 py-0.5">
                {aspectList.map((item) => {
                  const val = item.score !== null ? Math.min(3.0, Number(item.score.toFixed(1))) : 2.5;
                  const pct = Math.min(100, Math.round((val / 3) * 100));

                  return (
                    <div key={item.num} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#565C58] w-5 flex-shrink-0 text-[11px]">
                        {item.code}
                      </span>
                      <span className="font-semibold text-[#22352B] w-36 sm:w-40 truncate text-[11px]">
                        {item.name}
                      </span>
                      {/* Horizontal green bar with terracotta tick at 83.33% */}
                      <div className="relative flex-1 h-2 bg-[#EFECE4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#486B5A] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-[#9B3F18] z-10"
                          style={{ left: "83.33%" }}
                          title="Target: 2.5"
                        />
                      </div>
                      <span className="font-mono font-bold text-[#22352B] w-7 text-right text-xs">
                        {val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-[#787F7A] pt-1 border-t border-[#FAF8F5]">
                <span className="text-[#9B3F18] font-black mr-1">|</span> Garis terakota = target 2,5
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. CATATAN PENGAMATAN GURU (Grid 2x2) ─── */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E2D8]">
            <div className="flex items-center gap-2">
              <i className="mdi mdi-pencil-outline text-base text-[#22352B]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                CATATAN PENGAMATAN GURU
              </h3>
            </div>
            <span className="text-xs font-bold text-[#787F7A]">4 Catatan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {posNarrativeList.slice(0, 4).map((item) => (
              <div
                key={item.num}
                className="bg-[#FAF8F5] border border-[#F2D8C7] rounded-xl p-3 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#9B3F18] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {item.num}
                  </span>
                  <h4 className="font-black text-xs text-[#22352B] leading-tight">
                    {item.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#565C58] italic leading-relaxed pl-7">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 5. PANDUAN LATIHAN DI RUMAH (Soft Sage #F4F7F5) ─── */}
        <div className="bg-[#F4F7F5] border border-[#DFE7E2] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#DFE7E2]">
            <div className="flex items-center gap-2">
              <i className="mdi mdi-lightbulb-on-outline text-base text-[#22352B]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                PANDUAN LATIHAN DI RUMAH
              </h3>
            </div>
            <span className="text-xs font-bold text-[#486B5A]">Untuk Orang Tua</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {homeStimulationList.slice(0, 2).map((stim, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-2.5 shadow-2xs"
              >
                <span className="w-6 h-6 rounded-lg bg-[#E4EFE9] text-[#2E5442] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11.5px] text-[#22352B] leading-relaxed">
                  {stim}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. PENGESAHAN TANDA TANGAN 2 KOLOM ─── */}
        <div className="grid grid-cols-2 text-center text-xs pt-4 pb-2">
          <div>
            <p className="text-xs font-semibold text-[#565C58]">Koordinator Asesmen</p>
            <div className="h-12" />
            <div className="w-48 border-b border-[#22352B] mx-auto mb-1.5" />
            <p className="font-bold text-xs text-[#22352B]">Tim Asesor PPDB</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#565C58]">Mengetahui Orang Tua / Wali</p>
            <div className="h-12" />
            <div className="w-48 border-b border-[#22352B] mx-auto mb-1.5" />
            <p className="font-bold text-xs text-[#22352B] truncate max-w-[200px] mx-auto">
              {student.parent_name || "Salman W."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
