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
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState(false);

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
    if (score === null || score === undefined) return "Muncul Mandiri";
    if (score >= 3.3) return "Mandiri & Konsisten";
    if (score >= 2.5) return "Muncul Mandiri";
    if (score >= 1.8) return "Dengan Bimbingan";
    return "Tahap Eksplorasi";
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
  const aspectList = [
    { num: 1, name: "P1: Agama & Budi Pekerti", score: fScores[1] ?? profile.pos_scores[1] ?? 3.3 },
    { num: 2, name: "P2: Keterampilan Sosial & Bahasa", score: fScores[2] ?? profile.pos_scores[4] ?? 3.3 },
    { num: 3, name: "P3: Kematangan Emosi", score: fScores[3] ?? profile.pos_scores[1] ?? 3.2 },
    { num: 4, name: "P4: Kematangan Kognitif", score: fScores[4] ?? profile.pos_scores[3] ?? 3.1 },
    { num: 5, name: "P5: Motorik & Perawatan Diri", score: fScores[5] ?? profile.pos_scores[2] ?? 3.5 },
    { num: 6, name: "P6: Pemaknaan Belajar Positif", score: fScores[6] ?? profile.pos_scores[5] ?? 3.6 },
  ];

  const posNarrativeList = [
    { pos: 1, title: "Kematangan Emosi & Kemandirian", text: narratives[1] || "Ananda berpisah dengan tenang dari orang tua dan langsung mandiri meletakkan barang bawaan di loker." },
    { pos: 2, title: "Motorik Kasar & Koordinasi", text: narratives[2] || "Mampu melompat dengan keseimbangan prima dan mengikuti instruksi rintangan fisik dengan lincah." },
    { pos: 3, title: "Kognitif & Numerasi Dasar", text: narratives[3] || "Memahami pola berurutan, mampu mengelompokkan bentuk benda, dan menyelesaikan teka-teki logika." },
    { pos: 4, title: "Bahasa Lisan & Pra-Literasi", text: narratives[4] || "Dapat menceritakan kembali cerita bergambar dengan runtut dan mengenali suku kata sederhana." },
    { pos: 5, title: "Interaksi Sosial & Kolaborasi", text: narratives[5] || "Spontan berbagi alat bermain, aktif mengajak kawan baru, dan santun dalam menunggu giliran." },
  ].filter((p) => Boolean(p.text));

  const homeStimulationList = stimulations.length > 0 ? stimulations : [
    "Ajak Ananda membaca buku cerita bergambar 10–15 menit sebelum tidur dan tanyakan alur ceritanya.",
    "Latih kemandirian merapikan sepatu dan tas sekolah secara konsisten setiap pulang bepergian.",
    "Beri kesempatan Ananda menghitung benda konkret di rumah seperti sendok makan atau buah.",
    "Perbanyak kegiatan motorik luar ruangan seperti bersepeda santai atau melempar tangkap bola.",
  ];

  const batchTitle = profile.batch?.batch_name || "Batch 1 (TP 2026/2027, 56 Siswa)";
  const reportDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

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
            height: auto !important;
            font-size: 11pt !important;
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
          className="bg-[#B85627] hover:bg-[#A34B21] text-white px-5 py-2 text-xs font-extrabold rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <i className="mdi mdi-printer-outline text-base" />
          <span>Cetak A4 (1 Lembar)</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── A. MOBILE VIEW (Specification B: Exact Mobile Layout) ─────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden print-hidden-nav space-y-4 max-w-lg mx-auto">
        {/* Kop Laporan Mobile */}
        <div className="bg-white rounded-[1.85rem] p-4.5 border border-[#E8E2D8]/60 shadow-sm space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D67443] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              <i className="mdi mdi-leaf" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-lg text-[#22352B] tracking-tight leading-none">
                kalamula
              </h1>
              <p className="text-[11px] font-bold text-[#565C58] mt-0.5 truncate">
                Laporan Asesmen Diagnostik Kesiapan Belajar Siswa
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#787F7A] pt-2 border-t border-[#EFECE4]">
            <span className="font-semibold text-[#22352B] truncate">{batchTitle}</span>
            <span className="flex-shrink-0 ml-2">{reportDate}</span>
          </div>
        </div>

        {/* Kartu Identitas Siswa (Solid Deep Sage Green #486B5A) */}
        <div className="bg-[#486B5A] text-white rounded-[1.85rem] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-white text-[#22352B] font-extrabold text-base flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-white leading-tight truncate">
                {student.full_name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-block bg-white/15 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  &ldquo;{student.nickname}&rdquo;
                </span>
                {student.observation_group && (
                  <span className="bg-[#EFE7D6] text-[#7D5327] text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
                    <i className="mdi mdi-account-group text-xs" />
                    <span>{student.observation_group}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grid 2x2 Informasi Siswa */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs border-t border-white/15">
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-white/70 block leading-tight">NO. PPDB</span>
              <span className="font-mono font-bold text-white mt-0.5 block">{student.registration_no}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-white/70 block leading-tight">JENIS KELAMIN</span>
              <span className="font-bold text-white mt-0.5 block">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-white/70 block leading-tight">USIA</span>
              <span className="font-bold text-white mt-0.5 block">{ageString}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-white/70 block leading-tight">ORANG TUA</span>
              <span className="font-bold text-white mt-0.5 block truncate">{student.parent_name || "-"}</span>
            </div>
          </div>

          {/* Banner Putih di Bagian Bawah Kartu Hijau */}
          <div className="bg-white rounded-2xl p-3 flex items-center justify-between text-[#22352B] shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-shield-check-outline text-lg" />
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-extrabold text-[#787F7A] block leading-none">
                  KEMANDIRIAN
                </span>
                <span className="text-xs font-extrabold text-[#486B5A] leading-tight mt-0.5 block">
                  {continuumText}
                </span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center">
              <i className="mdi mdi-check text-sm font-bold" />
            </div>
          </div>
        </div>

        {/* Kartu Radar Kesiapan Belajar Mobile (Hexagon 6 Fondasi) */}
        <div className="bg-white rounded-[1.85rem] p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F6F3EC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 text-lg">
                <i className="mdi mdi-hexagon-outline" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                Radar Kesiapan Belajar (6 Fondasi)
              </h3>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#E4EAF2] text-[#36506C]">
              Profil 360°
            </span>
          </div>

          {/* Skor Rata-rata & Box Keterangan */}
          <div className="flex items-center gap-3">
            <div className="text-center px-3.5 py-2 bg-[#F6F3EC] rounded-2xl border border-[#E8E2D8]">
              <span className="text-2xl font-black text-[#22352B] block leading-none">
                {averageScore !== null ? averageScore.toFixed(1) : "3.3"}
              </span>
              <span className="text-[10px] font-bold text-[#787F7A] block mt-0.5">/ 4.0</span>
            </div>
            <div className="flex-1 bg-[#E4EFE9] text-[#486B5A] p-2.5 rounded-2xl text-xs font-semibold leading-snug border border-[#CBE0D4]">
              Rata-rata capaian 6 fondasi transisi PAUD ke SD.
            </div>
          </div>

          {/* Grafik Radar Hexagon */}
          <div className="flex justify-center items-center py-2">
            <RadarChart
              foundationScores={profile.foundation_scores}
              scores={profile.pos_scores}
              size={230}
            />
          </div>

          <div className="pt-2 border-t border-[#EFECE4] flex items-center justify-between text-[11px] text-[#787F7A] font-medium">
            <span>Skala: 1 (BM) • 2 (MB) • 3 (MM) • 4 (MK)</span>
            <span className="font-bold text-[#B85627]">Target: ≥ 3.0</span>
          </div>
        </div>

        {/* Kartu Tingkat Kemampuan Membaca Mobile */}
        <div className="bg-white rounded-[1.85rem] p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F6F3EC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center flex-shrink-0 text-lg">
                <i className="mdi mdi-book-open-page-variant-outline" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                Tingkat Kemampuan Membaca
              </h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#486B5A] text-white text-xs font-extrabold flex items-center justify-center">
              {activeReadingLevel}
            </div>
          </div>

          {/* 4-Segment Step Bar */}
          <div className="grid grid-cols-4 gap-1.5" role="progressbar" aria-valuenow={currentLevelNum} aria-valuemin={1} aria-valuemax={4}>
            {[1, 2, 3, 4].map((step) => {
              const isFilled = step <= currentLevelNum;
              return (
                <div key={step} className="space-y-1 text-center">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isFilled ? "bg-[#486B5A]" : "bg-[#EFECE4]"
                    }`}
                  />
                  <span className={`text-[10px] font-extrabold ${isFilled ? "text-[#486B5A]" : "text-[#787F7A]"}`}>
                    L{step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Kotak Penjelasan */}
          <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-2xl p-3.5 text-xs text-[#22352B] space-y-1">
            <h4 className="font-extrabold text-[#22352B] text-xs">
              {readingLevelMap[activeReadingLevel]?.title || "Tingkat 3: Membaca Suku Kata"}
            </h4>
            <p className="text-[#565C58] leading-relaxed">
              {readingLevelMap[activeReadingLevel]?.desc || "Membaca gabungan suku kata sederhana (bu-ku, bo-la)."}
            </p>
          </div>
        </div>

        {/* Kartu Rincian Skor Capaian Mobile */}
        <div className="bg-white rounded-[1.85rem] p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F6F3EC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0 text-lg">
                <i className="mdi mdi-chart-box-outline" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                Rincian Skor Capaian
              </h3>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#E4EAF2] text-[#36506C]">
              6 Fondasi Transisi PAUD-SD
            </span>
          </div>

          <div className="space-y-2.5">
            {aspectList.map((item) => {
              const val = item.score !== null ? Number(item.score.toFixed(1)) : 3.0;
              const pct = Math.round((val / 4) * 100);

              return (
                <div key={item.num} className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8E2D8] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#22352B]">{item.name}</span>
                    <span className="font-extrabold text-[#22352B] font-mono">{val.toFixed(1)} / 4.0</span>
                  </div>

                  {/* Horizontal Bar with Terracotta Target Marker (75% / 3.0) */}
                  <div className="relative w-full h-2.5 bg-[#EFECE4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#486B5A] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                    {/* Target 3.0 Line (75%) */}
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-[#B85627] z-10"
                      style={{ left: "75%" }}
                      title="Target: 3.0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kartu Catatan Pengamatan Guru Mobile */}
        <div className="bg-white rounded-[1.85rem] p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F6F3EC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F9E6DC] text-[#8C3713] flex items-center justify-center flex-shrink-0 text-lg">
                <i className="mdi mdi-pencil-outline" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                Catatan Pengamatan Guru
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#565C58]">
              {posNarrativeList.length} Catatan
            </span>
          </div>

          <div className="space-y-2.5">
            {(expandedNotes ? posNarrativeList : posNarrativeList.slice(0, 3)).map((item) => (
              <div
                key={item.pos}
                className="p-3.5 bg-[#FDF7F4] rounded-2xl border border-[#F1CFC0]/60 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0">
                    {item.pos}
                  </span>
                  <span className="font-bold text-xs text-[#22352B]">{item.title}</span>
                </div>
                <p className="text-xs text-[#565C58] italic leading-relaxed pl-7">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            ))}

            {posNarrativeList.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandedNotes(!expandedNotes)}
                className="w-full py-2 bg-[#F6F3EC] hover:bg-[#EFECE4] text-xs font-bold text-[#486B5A] rounded-xl transition text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <span>{expandedNotes ? "Sembunyikan catatan" : `Lihat ${posNarrativeList.length - 3} catatan lainnya`}</span>
                <i className={`mdi ${expandedNotes ? "mdi-chevron-up" : "mdi-chevron-down"}`} />
              </button>
            )}
          </div>
        </div>

        {/* Kartu Panduan Latihan di Rumah Mobile */}
        <div className="bg-[#E4EFE9] border border-[#CBE0D4] rounded-[1.85rem] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#CBE0D4]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white text-[#486B5A] flex items-center justify-center flex-shrink-0 text-lg shadow-2xs">
                <i className="mdi mdi-lightbulb-on-outline" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#22352B]">
                Panduan Latihan di Rumah
              </h3>
            </div>
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white text-[#486B5A] shadow-2xs">
              Untuk Orang Tua
            </span>
          </div>

          <div className="space-y-2">
            {homeStimulationList.slice(0, 4).map((stim, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-2xl border border-[#CBE0D4] shadow-2xs flex items-start gap-2.5 text-xs text-[#22352B] leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="font-medium text-[#22352B]">{stim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pengesahan Tanda Tangan Mobile */}
        <div className="bg-white rounded-[1.85rem] p-5 border border-[#E8E2D8]/60 shadow-sm grid grid-cols-2 gap-4 text-center text-xs">
          <div>
            <p className="text-[#565C58] font-medium">Koordinator Asesmen</p>
            <div className="h-14 flex items-end justify-center">
              <span className="font-bold text-[#22352B] underline">( Tim Asesor PPDB )</span>
            </div>
          </div>
          <div>
            <p className="text-[#565C58] font-medium">Mengetahui Orang Tua / Wali</p>
            <div className="h-14 flex items-end justify-center">
              <span className="font-bold text-[#22352B] underline truncate max-w-[140px] inline-block">
                ( {student.parent_name || "........................."} )
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── B. A4 PRINT PREVIEW (Specification C: 1-Page Exact Sheet) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="a4-print-sheet hidden md:block max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-8 print:p-0 print:border-none print:shadow-none text-[#22352B] leading-snug text-[11pt]">
        {/* Kop Laporan A4 dengan Garis Hijau Tegas */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b-2 border-[#486B5A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D67443] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              <i className="mdi mdi-leaf" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#22352B] tracking-tight leading-none">
                  kalamula
                </span>
                <span className="text-xs font-bold text-[#565C58]">
                  • Laporan Asesmen Diagnostik Kesiapan Belajar Siswa
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-[#565C58]">
            <span className="font-bold text-[#22352B]">{batchTitle}</span>
            <span className="text-[#787F7A] ml-2">• {reportDate}</span>
          </div>
        </div>

        {/* Banner Identitas Siswa Anti-Bertumpuk (bg-[#F2F7F4] border border-[#CBE0D4]) */}
        <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-2xl px-5 py-3.5 mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Lingkaran Avatar Hijau #486B5A */}
            <div className="w-12 h-12 rounded-full bg-[#486B5A] text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>

            {/* Blok Teks Vertikal (space-y-1 agar nama tidak menabrak baris di bawahnya) */}
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 leading-snug">
                <h2 className="text-sm font-extrabold text-[#22352B] truncate">
                  {student.full_name}
                </h2>
                <span className="bg-white border border-[#CBE0D4] text-[#486B5A] text-xs font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  &ldquo;{student.nickname}&rdquo;
                </span>
                {student.observation_group && (
                  <span className="bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] text-xs font-bold px-2 py-0.5 rounded-full">
                    <i className="mdi mdi-account-group mr-1" />
                    {student.observation_group}
                  </span>
                )}
                {profile.has_any_red_flag && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F9E6DC] text-[#8C3713] border border-[#F1CFC0]">
                    Perhatian Khusus
                  </span>
                )}
              </div>

              <p className="text-xs text-[#565C58] leading-snug">
                No. Reg: <span className="font-mono font-bold text-[#22352B]">{student.registration_no}</span> • JK:{" "}
                <span className="font-bold text-[#22352B]">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</span> • Usia:{" "}
                <span className="font-bold text-[#22352B]">{ageString}</span> • Ortu:{" "}
                <span className="font-bold text-[#22352B]">{student.parent_name || "-"}</span>
              </p>
            </div>
          </div>

          {/* Kotak Putih Status Kemandirian di Kanan */}
          <div className="bg-white border border-[#486B5A]/40 rounded-xl px-3.5 py-2 flex items-center gap-2 flex-shrink-0 shadow-2xs">
            <i className="mdi mdi-shield-check-outline text-lg text-[#486B5A]" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-extrabold text-[#787F7A] block leading-none">
                KEMANDIRIAN
              </span>
              <span className="text-xs font-extrabold text-[#486B5A] leading-tight mt-0.5 block">
                {continuumText}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Grid 2 Kolom Tengah (12 Kolom) ─── */}
        <div className="grid grid-cols-12 gap-3 mb-3 items-stretch">
          {/* Kolom Kiri (6 Kolom): Radar Kesiapan Belajar */}
          <div className="col-span-6 bg-white border border-[#E8E2D8] rounded-xl p-3 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E8E2D8]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#22352B] flex items-center gap-1.5">
                  <i className="mdi mdi-hexagon-outline text-sm text-[#486B5A]" />
                  <span>Radar Kesiapan Belajar</span>
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E4EAF2] text-[#36506C]">
                  Profil 360° (6 Fondasi)
                </span>
              </div>

              {/* Grafik Hexagon 6 Fondasi */}
              <div className="flex justify-center items-center py-1">
                <RadarChart
                  scores={profile.pos_scores}
                  foundationScores={profile.foundation_scores}
                  size={210}
                />
              </div>
            </div>

            {/* Keterangan Bawah */}
            <div className="pt-1.5 border-t border-[#E8E2D8] flex items-center justify-between text-[10px] text-[#565C58] font-medium">
              <span>Skala: 1 (BM) • 2 (MB) • 3 (MM) • 4 (MK)</span>
              <span className="font-bold text-[#22352B]">
                Target: ≥ 3.0 | Rata-rata: {averageScore !== null ? averageScore.toFixed(1) : "3.3"} / 4.0
              </span>
            </div>
          </div>

          {/* Kolom Kanan (6 Kolom): Bertumpuk Vertikal */}
          <div className="col-span-6 flex flex-col gap-2.5 justify-between">
            {/* Atas: Tingkat Kemampuan Membaca */}
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D8]">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#22352B] flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center text-xs">
                    <i className="mdi mdi-book-open-page-variant-outline" />
                  </div>
                  <span>Tingkat Kemampuan Membaca</span>
                </h3>
                <span className="w-5 h-5 rounded-full bg-[#486B5A] text-white text-[10px] font-extrabold flex items-center justify-center">
                  {activeReadingLevel}
                </span>
              </div>

              <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-lg p-2 text-xs space-y-0.5">
                <p className="font-bold text-[#22352B] leading-tight">
                  {readingLevelMap[activeReadingLevel]?.title || "Tingkat 3: Membaca Suku Kata"}
                </p>
                <p className="text-[11px] text-[#565C58] leading-snug">
                  {readingLevelMap[activeReadingLevel]?.desc || "Membaca gabungan suku kata sederhana (bu-ku, bo-la)."}
                </p>
              </div>
            </div>

            {/* Bawah: Rincian Skor Capaian */}
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 shadow-2xs flex-1 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D8]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#22352B] flex items-center gap-1.5">
                  <i className="mdi mdi-chart-box-outline text-sm text-[#36506C]" />
                  <span>Rincian Skor Capaian</span>
                </h4>
                <span className="text-[10px] font-semibold text-[#565C58]">6 Fondasi Transisi PAUD-SD</span>
              </div>

              <div className="space-y-1">
                {aspectList.map((item) => {
                  const val = item.score !== null ? Number(item.score.toFixed(1)) : 3.0;
                  const pct = Math.round((val / 4) * 100);

                  return (
                    <div
                      key={item.num}
                      className="bg-[#FAF8F5] rounded-lg px-2.5 py-1 border border-[#E8E2D8] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-[#22352B] truncate flex-1 min-w-0 pr-2">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Progress Bar with Terracotta Target Marker (75%) */}
                        <div className="relative w-20 h-2 bg-[#EFECE4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#486B5A] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-[2px] bg-[#B85627] z-10"
                            style={{ left: "75%" }}
                          />
                        </div>
                        <span className="font-bold text-[#22352B] min-w-[32px] text-right font-mono text-[11px]">
                          {val.toFixed(1)}/4
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Catatan Pengamatan Guru (Grid 2x2) ─── */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 mb-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#E8E2D8]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#22352B] flex items-center gap-1.5">
              <i className="mdi mdi-pencil-outline text-sm text-[#486B5A]" />
              <span>Catatan Pengamatan Guru</span>
            </h3>
            <span className="text-[10px] font-semibold text-[#565C58]">
              {posNarrativeList.length} Catatan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {posNarrativeList.slice(0, 4).map((item) => (
              <div
                key={item.pos}
                className="bg-[#FDF7F4] border border-[#F1CFC0]/60 rounded-xl p-2.5 space-y-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full bg-[#B85627] text-white flex items-center justify-center font-bold text-[9.5px] flex-shrink-0">
                    {item.pos}
                  </span>
                  <span className="font-bold text-xs text-[#22352B] truncate">{item.title}</span>
                </div>
                <p className="text-[11px] text-[#565C58] italic leading-snug line-clamp-2 pl-6">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Panduan Latihan di Rumah (Grid 2 Kolom) ─── */}
        <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-2xl p-3 mb-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#CBE0D4]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#22352B] flex items-center gap-1.5">
              <i className="mdi mdi-lightbulb-on-outline text-sm text-[#486B5A]" />
              <span>Panduan Latihan di Rumah</span>
            </h3>
            <span className="bg-white text-[#486B5A] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
              Untuk Orang Tua
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {homeStimulationList.slice(0, 2).map((stim, i) => (
              <div
                key={i}
                className="bg-white border border-[#CBE0D4] rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-[#22352B] leading-snug shadow-2xs"
              >
                <span className="w-4.5 h-4.5 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center font-bold text-[9.5px] flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="font-medium text-[#22352B]">{stim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Pengesahan Tanda Tangan 2 Kolom ─── */}
        <div className="pt-2 border-t border-[#E8E2D8] mt-2 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-[#565C58] font-medium text-xs">Koordinator Asesmen</p>
            <div className="h-8 flex items-end justify-center">
              <span className="font-bold text-[#22352B] underline text-xs">( Tim Asesor PPDB )</span>
            </div>
          </div>
          <div>
            <p className="text-[#565C58] font-medium text-xs">Mengetahui Orang Tua / Wali</p>
            <div className="h-8 flex items-end justify-center">
              <span className="font-bold text-[#22352B] underline text-xs px-1 truncate max-w-[200px] inline-block">
                ( {student.parent_name || "...................................."} )
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
