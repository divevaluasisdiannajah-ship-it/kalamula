"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StoryTimeline } from "@/components/aetrium/StoryTimeline";
import type { Batch, StudentProfile } from "@/types";

interface BatchReportData {
  batch: Batch;
  totalStudents: number;
  evaluatedCount: number;
  posAverages: Record<number, number>;
  recommendationPackage: {
    tarl: {
      groupA: {
        title: string;
        description: string;
        students: StudentProfile[];
        strategies: string[];
      };
      groupB: {
        title: string;
        description: string;
        students: StudentProfile[];
        strategies: string[];
      };
      unassessed: StudentProfile[];
    };
    mpls: {
      title: string;
      guidelines: { day: string; focus: string; activity: string }[];
    };
    kurikulumMerdeka: {
      title: string;
      points: string[];
    };
    redFlagIntervention: {
      title: string;
      students: StudentProfile[];
      guidelines: string[];
    };
  };
}

export default function TeacherPortalPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [report, setReport] = useState<BatchReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tarl" | "mpls">("tarl");
  const [showAllA, setShowAllA] = useState(false);
  const [showAllB, setShowAllB] = useState(false);

  // Selected student for Story Timeline modal
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentProfile | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        const json = await res.json();
        const list: Batch[] = json.data || [];
        setBatches(list);
        if (list.length > 0) {
          const active = list.find((b) => b.status === "active") || list[0];
          setSelectedBatchId(active.id);
        }
      }
    } catch {
      // offline handling
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/batch/${batchId}`);
      if (res.ok) {
        const json = await res.json();
        setReport(json.data);
      }
    } catch {
      // offline handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatchId) {
      loadReport(selectedBatchId);
    }
  }, [selectedBatchId, loadReport]);

  // Escape key handler for Story Timeline modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedStudentProfile) {
        setSelectedStudentProfile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStudentProfile]);

  const groupAStudents = report?.recommendationPackage.tarl.groupA.students || [];
  const groupBStudents = report?.recommendationPackage.tarl.groupB.students || [];
  const redFlagStudents = report?.recommendationPackage.redFlagIntervention.students || [];

  const completionPct =
    report && report.totalStudents > 0
      ? Math.round((report.evaluatedCount / report.totalStudents) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-24 font-sans">
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D67443] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="mdi mdi-leaf text-2xl" />
            </div>
            <span className="font-brand lowercase text-xl font-extrabold text-[#22352B] tracking-tight">
              kalamula
            </span>
            <span className="bg-[#E4EFE9] text-[#486B5A] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ml-1">
              DIFERENSIASI
            </span>
          </div>

          <Link
            href="/"
            className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-xs"
          >
            <i className="mdi mdi-chevron-left text-base" />
            <span>Beranda</span>
          </Link>
        </div>

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#22352B] tracking-tight leading-snug">
            Asesmen Kualitatif untuk Diferensiasi Pembelajaran
          </h1>
          <p className="text-xs text-[#565C58] mt-1">
            Kelas 1 (Fase A) • Morning Briefing, Peta Tumbuh & Jurnal Harian
          </p>
        </div>

        {/* Dropdown Gelombang */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A] block">
            GELOMBANG
          </label>
          <div className="relative">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-white rounded-2xl border border-[#DDD7CE] font-bold text-xs px-4 py-3 text-[#22352B] shadow-xs cursor-pointer appearance-none pr-10 focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#787F7A]">
              <i className="mdi mdi-chevron-down text-lg" />
            </div>
          </div>
        </div>

        {/* Banner Utama: PROGRES OBSERVASI (Solid Green #486B5A) */}
        <div className="bg-[#486B5A] rounded-3xl p-5 shadow-sm text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider">
              PROGRES OBSERVASI
            </span>
            <span className="bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-full text-xs">
              {completionPct}%
            </span>
          </div>

          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold text-white leading-none">
              {report ? `${report.evaluatedCount}/${report.totalStudents}` : "..."}
            </span>
            <span className="text-xs font-bold text-white/80 ml-2">Siswa</span>
          </div>

          {/* Progress bar putih */}
          <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* 2 Pills di bawah */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="bg-[#F9E6DC] text-[#8C3713] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <i className="mdi mdi-alert-circle-outline text-sm" />
              <span>{redFlagStudents.length} Perlu Pendampingan</span>
            </div>
            <div className="bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <i className="mdi mdi-book-open-page-variant-outline text-sm" />
              <span>TaRL: {groupAStudents.length}A / {groupBStudents.length}B</span>
            </div>
          </div>
        </div>

        {/* Grid 2x2 Kartu Metrik */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* 1. Total Calon Siswa (Card Putih) */}
          <div className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm flex flex-col justify-between min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider">
                TOTAL CALON SISWA
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-account-multiple-outline text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#22352B] tracking-tight leading-none">
                {report?.totalStudents || 0}{" "}
                <span className="text-xs font-bold text-[#565C58]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#787F7A] mt-1.5 leading-tight">
                Kapasitas 2 Kelas (1A & 1B)
              </p>
            </div>
          </div>

          {/* 2. Sinyal Pendampingan (Soft Peach #F9E6DC) */}
          <div className="bg-[#F9E6DC] rounded-3xl p-4 sm:p-4.5 border border-[#F1CFC0] shadow-sm flex flex-col justify-between min-h-[125px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#8C3713] uppercase tracking-wider">
                SINYAL PENDAMPINGAN
              </span>
              <div className="w-8 h-8 rounded-full bg-[#F1CFC0] text-[#8C3713] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-alert-outline text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#8C3713] tracking-tight leading-none">
                {redFlagStudents.length}{" "}
                <span className="text-xs font-bold text-[#8C3713]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#8C3713]/80 mt-1.5 leading-tight">
                Pendampingan afektif transisi
              </p>
            </div>
          </div>

          {/* 3. Kategori A Pra-Literasi (Warm Sand #EFE7D6) */}
          <div className="bg-[#EFE7D6] rounded-3xl p-4 sm:p-4.5 border border-[#E8DFC8] shadow-sm flex flex-col justify-between min-h-[125px] text-[#7D5327]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#7D5327] uppercase tracking-wider">
                KATEGORI A (PRA-LITERASI)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E8DFC8] text-[#7D5327] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-book-open-variant text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#7D5327] tracking-tight leading-none">
                {groupAStudents.length}{" "}
                <span className="text-xs font-bold text-[#7D5327]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#7D5327]/80 mt-1.5 leading-tight">
                Tingkat 1 & 2 (Simbol & Bunyi)
              </p>
            </div>
          </div>

          {/* 4. Kategori B Penguatan (Mint Sage #E4EFE9) */}
          <div className="bg-[#E4EFE9] rounded-3xl p-4 sm:p-4.5 border border-[#CBE0D4] shadow-sm flex flex-col justify-between min-h-[125px] text-[#486B5A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#486B5A] uppercase tracking-wider">
                KATEGORI B (PENGUATAN)
              </span>
              <div className="w-8 h-8 rounded-full bg-[#CBE0D4] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-book-open-page-variant-outline text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#486B5A] tracking-tight leading-none">
                {groupBStudents.length}{" "}
                <span className="text-xs font-bold text-[#486B5A]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#486B5A]/80 mt-1.5 leading-tight">
                Tingkat 3 & 4 (Suku Kata & Lancar)
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Tabs: Kategori Literasi / Masa Pengenalan (MPLS) */}
        <div className="bg-[#EFECE4] p-1.5 rounded-2xl flex items-center gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("tarl")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "tarl"
                ? "bg-[#486B5A] text-white shadow-xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            Kategori Literasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mpls")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "mpls"
                ? "bg-[#486B5A] text-white shadow-xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
          >
            Masa Pengenalan (MPLS)
          </button>
        </div>

        {/* Tab 1: Kategori Literasi A & B */}
        {activeTab === "tarl" && (
          <div className="space-y-4">
            {/* Card Kategori Literasi A */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8]/60 shadow-sm space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <i className="mdi mdi-book-open-variant text-2xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-[#22352B] leading-snug">
                    Kategori Literasi A
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Intervensi Pra-Literasi / L1-L2
                  </p>
                  <span className="bg-[#EFE7D6] text-[#7D5327] px-2.5 py-0.5 rounded-full text-xs font-bold inline-block mt-1">
                    {groupAStudents.length} Siswa
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#565C58] leading-relaxed">
                Fokus pada pengenalan bentuk visual, bunyi huruf/fonik dasar, dan motorik halus jemari.
              </p>

              {/* Strategi Pendampingan di Kelas */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A]">
                  STRATEGI PENDAMPINGAN DI KELAS:
                </p>

                <div className="space-y-1.5">
                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#EFE7D6] text-[#7D5327] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Gunakan kartu bergambar (flashcard) dengan asosiasi bunyi konkret (misal &apos;A - Apel&apos;).
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#EFE7D6] text-[#7D5327] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Aktivitas sensorik menulis huruf di pasir atau membentuk huruf dari plastisin.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#EFE7D6] text-[#7D5327] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Latihan cengkeraman pensil fungsional (tripod grasp) dengan krayon segitiga.
                    </p>
                  </div>
                </div>
              </div>

              {/* Daftar Calon Siswa (24) */}
              <div className="space-y-2 pt-1 border-t border-[#FAF8F5]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#787F7A]">
                    DAFTAR CALON SISWA ({groupAStudents.length}):
                  </p>
                  <span className="text-[10px] text-[#787F7A] italic">
                    Klik nama untuk melihat catatan
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(showAllA ? groupAStudents : groupAStudents.slice(0, 9)).map((sp) => (
                    <button
                      key={sp.student.id}
                      type="button"
                      onClick={() => setSelectedStudentProfile(sp)}
                      className="bg-white border border-[#E8E2D8] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[#22352B] shadow-2xs hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      <span>{sp.student.nickname || sp.student.full_name}</span>
                      <span className="bg-[#EFE7D6] text-[#7D5327] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {sp.reading_level || "L1"}
                      </span>
                    </button>
                  ))}

                  {groupAStudents.length > 9 && (
                    <button
                      type="button"
                      onClick={() => setShowAllA(!showAllA)}
                      className="bg-[#EFE7D6] text-[#7D5327] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#E5DAC4] transition cursor-pointer"
                    >
                      {showAllA ? "Tutup" : `+${groupAStudents.length - 9} lainnya`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card Kategori Literasi B */}
            <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8]/60 shadow-sm space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <i className="mdi mdi-book-open-page-variant-outline text-2xl" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-[#22352B] leading-snug">
                    Kategori Literasi B
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Penguatan Membaca / L3-L4
                  </p>
                  <span className="bg-[#E4EFE9] text-[#486B5A] px-2.5 py-0.5 rounded-full text-xs font-bold inline-block mt-1">
                    {groupBStudents.length} Siswa
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#565C58] leading-relaxed">
                Fokus pada kelancaran membaca suku kata KV, kata bermakna, dan pemahaman cerita.
              </p>

              {/* Strategi Pengayaan di Kelas */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A]">
                  STRATEGI PENGAYAAN DI KELAS:
                </p>

                <div className="space-y-1.5">
                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#E4EFE9] text-[#486B5A] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Pojok baca mandiri dengan buku cerita bergambar bertingkat (graded readers).
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#E4EFE9] text-[#486B5A] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Permainan menyusun kartu kata menjadi kalimat sederhana yang utuh.
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-start gap-2.5 border border-[#E8E2D8]">
                    <span className="w-6 h-6 rounded-full bg-[#E4EFE9] text-[#486B5A] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-[#22352B] leading-snug font-medium">
                      Tanya jawab inferensial ringan: &ldquo;Mengapa tokoh di cerita bersedih?&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Daftar Calon Siswa (32) */}
              <div className="space-y-2 pt-1 border-t border-[#FAF8F5]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#787F7A]">
                    DAFTAR CALON SISWA ({groupBStudents.length}):
                  </p>
                  <span className="text-[10px] text-[#787F7A] italic">
                    Klik nama untuk melihat catatan
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(showAllB ? groupBStudents : groupBStudents.slice(0, 12)).map((sp) => (
                    <button
                      key={sp.student.id}
                      type="button"
                      onClick={() => setSelectedStudentProfile(sp)}
                      className="bg-white border border-[#E8E2D8] px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-[#22352B] shadow-2xs hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      <span>{sp.student.nickname || sp.student.full_name}</span>
                      <span className="bg-[#E4EFE9] text-[#486B5A] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {sp.reading_level || "L3"}
                      </span>
                    </button>
                  ))}

                  {groupBStudents.length > 12 && (
                    <button
                      type="button"
                      onClick={() => setShowAllB(!showAllB)}
                      className="bg-[#E4EFE9] text-[#486B5A] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#D5E6DC] transition cursor-pointer"
                    >
                      {showAllB ? "Tutup" : `+${groupBStudents.length - 12} lainnya`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Masa Pengenalan (MPLS) */}
        {activeTab === "mpls" && (
          <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8]/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#22352B]">
                Panduan MPLS &amp; Adaptasi Fondasi Belajar SD
              </h3>
              <p className="text-xs text-[#565C58] mt-0.5">
                Fokus adaptasi sosio-emosional 2 minggu pertama sekolah
              </p>
            </div>

            <div className="space-y-3">
              {(report?.recommendationPackage.mpls.guidelines || [
                {
                  day: "Hari 1 - 3",
                  focus: "Mengenal Lingkungan & Rasa Nyaman",
                  activity: "Tur sekolah santai, mengenalkan toilet, kantin, dan permainan nama ceria.",
                },
                {
                  day: "Hari 4 - 6",
                  focus: "Membangun Kesepakatan Kelas",
                  activity: "Menyusun aturan positif bersama melalui gambar dan komitmen ramah.",
                },
                {
                  day: "Hari 7 - 10",
                  focus: "Eksplorasi Minat & Belajar Bersama",
                  activity: "Bermain peran, lingkaran cerita, dan pengenalan sudut pojok belajar interaktif.",
                },
              ]).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#B85627]">
                      {item.day}
                    </span>
                    <span className="text-xs font-bold text-[#486B5A]">
                      {item.focus}
                    </span>
                  </div>
                  <p className="text-xs text-[#565C58] leading-relaxed pt-1">
                    {item.activity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Story Timeline Modal */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#22352B]/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedStudentProfile(null)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#E8E2D8] gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center flex-shrink-0">
                  <i className="mdi mdi-account text-2xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#486B5A]">
                    Riwayat Observasi Siswa
                  </p>
                  <h3 className="text-base font-extrabold text-[#22352B] truncate">
                    {selectedStudentProfile.student.full_name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentProfile(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            {/* Timeline */}
            <StoryTimeline evaluations={selectedStudentProfile.evaluations} />

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setSelectedStudentProfile(null)}
                className="px-4 py-2 bg-[#F3EFE6] text-[#22352B] text-xs font-bold rounded-xl cursor-pointer hover:bg-[#EAE4D8] transition"
              >
                Tutup
              </button>
              <Link
                href={`/reports/student/${selectedStudentProfile.student.id}`}
                target="_blank"
                className="px-4 py-2 bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <i className="mdi mdi-printer text-base" />
                <span>Buka Lembar PDF</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
