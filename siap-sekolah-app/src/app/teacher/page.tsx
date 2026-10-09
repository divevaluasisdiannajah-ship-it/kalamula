"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StudentHeroCard } from "@/components/aetrium/StudentHeroCard";
import { StoryTimeline } from "@/components/aetrium/StoryTimeline";
import { MorningBrief } from "@/components/aetrium/MorningBrief";
import {
  ChalkboardTeacher,
  Books,
  Plant,
  Leaf,
  SlidersHorizontal,
  Warning,
  Users,
  BookOpen,
  Printer,
  X,
  CaretRight,
  MagnifyingGlass,
  CheckCircle,
  FileText,
  User,
  ArrowSquareOut,
} from "@phosphor-icons/react";
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
  const [activeTab, setActiveTab] = useState<"tarl" | "mpls" | "atp" | "redflags" | "roster">("tarl");
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [rosterClassFilter, setRosterClassFilter] = useState<"all" | "1A" | "1B" | "redflag">("all");

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

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1E2320] pb-24">
      {/* Teacher Portal Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 bg-[#F0F4F1] text-[#3D7A5A] rounded-xl flex items-center justify-center shadow-xs hover:bg-[#E4EDE7] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none flex-shrink-0"
              title="Kembali ke Beranda"
            >
              <Leaf weight="light" size={24} className="text-[#3D7A5A]" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <span className="font-brand lowercase text-xl sm:text-[23px] text-[#1E2320] font-black tracking-tight">kalamula</span>
                <span className="text-xs text-[#DDD7CE] font-light hidden sm:inline">|</span>
                <h1 className="font-brand text-sm sm:text-[17px] md:text-[18px] font-bold text-[#1E2320] tracking-tight truncate">
                  Portal Guru Kelas 1 (Fase A)
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-[#565C58] font-medium mt-0.5">
                Memandu Transisi, Memetakan Fondasi
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t border-[#F5F2EC] sm:border-t-0">
            <label className="text-xs font-bold text-[#565C58]">Gelombang:</label>
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full sm:w-auto h-10 rounded-xl shadow-xs pl-3.5 pr-8 text-xs bg-white text-[#1E2320] font-bold border border-[#DDD7CE] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all cursor-pointer appearance-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#787F7A]">
                <CaretRight weight="bold" size={12} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Editorial Skeleton Loading adhering to UI_UX_PRO_MAX & DESIGN.md */}
        {loading && !report && (
          <div className="space-y-6 animate-pulse" aria-label="Memuat data kesiapan belajar...">
            {/* Morning Brief Skeleton */}
            <div className="h-36 bg-white rounded-2xl border border-[#E8E2D8] p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="h-4 w-48 bg-[#EBE6DF] rounded-full" />
                <div className="h-6 w-96 max-w-full bg-[#EBE6DF] rounded-lg" />
                <div className="h-3.5 w-72 max-w-full bg-[#F4F3EE] rounded-md" />
              </div>
              <div className="h-8 w-60 bg-[#F4F3EE] rounded-xl self-end" />
            </div>

            {/* Metric Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-24 bg-[#EBE6DF] rounded-full" />
                    <div className="w-7 h-7 bg-[#EBE6DF] rounded-full" />
                  </div>
                  <div className="h-7 w-20 bg-[#EBE6DF] rounded-md" />
                  <div className="h-3 w-28 bg-[#F4F3EE] rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Morning Brief Contextual Panel (Aetrium Signature Component) */}
        {report && (
          <MorningBrief
            batch={report.batch}
            totalStudents={report.totalStudents}
            evaluatedCount={report.evaluatedCount}
            groupACount={report.recommendationPackage.tarl.groupA.students.length}
            groupBCount={report.recommendationPackage.tarl.groupB.students.length}
            redFlagCount={report.recommendationPackage.redFlagIntervention.students.length}
          />
        )}

        {/* Themed Metric Cards Row (Aetrium System: Semantic Palette & Natural Elevation) */}
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Total Calon Siswa (Anchor Card) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(30,35,32,0.09)]">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#565C58] uppercase tracking-wider">
                  Total Calon Siswa
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Users weight="light" size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
                {report.totalStudents} <span className="text-xs sm:text-sm font-bold text-[#565C58]">Anak</span>
              </p>
              <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
                Kapasitas 2 Kelas (1A & 1B)
              </p>
            </div>

            {/* Card 2: Kategori A Pra-Literasi (Warm Foundational Tint) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#F2D8C7] shadow-[0_4px_20px_-2px_rgba(201,115,59,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(201,115,59,0.12)]">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#C9733B] uppercase tracking-wider">
                  Kategori A (Pra-Literasi)
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center shadow-xs flex-shrink-0">
                  <BookOpen weight="light" size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
                {report.recommendationPackage.tarl.groupA.students.length} <span className="text-xs sm:text-sm font-bold text-[#C9733B]">Anak</span>
              </p>
              <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
                Tingkat 1 & 2 (Simbol & Bunyi)
              </p>
            </div>

            {/* Card 3: Kategori B Pengayaan (Sage Growth Tint) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#C9DBD0] shadow-[0_4px_20px_-2px_rgba(92,124,104,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(92,124,104,0.12)]">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#3D7A5A] uppercase tracking-wider">
                  Kategori B (Penguatan)
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Books weight="light" size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
                {report.recommendationPackage.tarl.groupB.students.length} <span className="text-xs sm:text-sm font-bold text-[#3D7A5A]">Anak</span>
              </p>
              <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
                Tingkat 3 & 4 (Suku Kata & Lancar)
              </p>
            </div>

            {/* Card 4: Sinyal Pendampingan (Dignified Terracotta Alert) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#F2D8C7] shadow-[0_4px_20px_-2px_rgba(201,115,59,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(201,115,59,0.12)]">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#C9733B] uppercase tracking-wider">
                  Sinyal Pendampingan
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Warning weight="light" size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
                {report.recommendationPackage.redFlagIntervention.students.length} <span className="text-xs sm:text-sm font-bold text-[#C9733B]">Anak</span>
              </p>
              <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
                Pendampingan Afektif Transisi
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation & Action Bar (Crafted Segmented Control with Depth) */}
        {report && (
          <div className="w-full max-w-6xl mx-auto p-1.5 bg-[#EBE6DF]/90 border border-[#DDD7CE] rounded-2xl shadow-xs overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("tarl")}
              className={`flex-1 min-w-[145px] h-11 sm:h-12 px-3.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "tarl"
                  ? "bg-white text-[#1E2320] shadow-xs border border-[#E8E2D8] font-bold ring-1 ring-black/[0.04]"
                  : "text-[#565C58] hover:text-[#1E2320] hover:bg-white/60 font-medium"
              }`}
            >
              <Books weight="light" size={17} className={activeTab === "tarl" ? "text-[#5C7C68]" : ""} />
              <span>Kategori Literasi</span>
            </button>
            <button
              onClick={() => setActiveTab("mpls")}
              className={`flex-1 min-w-[145px] h-11 sm:h-12 px-3.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "mpls"
                  ? "bg-white text-[#1E2320] shadow-xs border border-[#E8E2D8] font-bold ring-1 ring-black/[0.04]"
                  : "text-[#565C58] hover:text-[#1E2320] hover:bg-white/60 font-medium"
              }`}
            >
              <Plant weight="light" size={17} className={activeTab === "mpls" ? "text-[#5C7C68]" : ""} />
              <span>Masa Pengenalan (MPLS)</span>
            </button>
            <button
              onClick={() => setActiveTab("atp")}
              className={`flex-1 min-w-[155px] h-11 sm:h-12 px-3.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "atp"
                  ? "bg-white text-[#1E2320] shadow-xs border border-[#E8E2D8] font-bold ring-1 ring-black/[0.04]"
                  : "text-[#565C58] hover:text-[#1E2320] hover:bg-white/60 font-medium"
              }`}
            >
              <SlidersHorizontal weight="light" size={17} className={activeTab === "atp" ? "text-[#5C7C68]" : ""} />
              <span>Rencana Pembelajaran Kelas</span>
            </button>
            <button
              onClick={() => setActiveTab("redflags")}
              className={`flex-1 min-w-[160px] h-11 sm:h-12 px-3.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "redflags"
                  ? "bg-white text-[#1E2320] shadow-xs border border-[#E8E2D8] font-bold ring-1 ring-black/[0.04]"
                  : "text-[#565C58] hover:text-[#1E2320] hover:bg-white/60 font-medium"
              }`}
            >
              <Warning weight="light" size={17} className={activeTab === "redflags" ? "text-[#C9733B]" : ""} />
              <span>Sinyal Pendampingan</span>
              {(report.recommendationPackage.redFlagIntervention.students.length || 0) > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#C9733B] text-white">
                  {report.recommendationPackage.redFlagIntervention.students.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("roster")}
              className={`flex-1 min-w-[165px] h-11 sm:h-12 px-3.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                activeTab === "roster"
                  ? "bg-white text-[#1E2320] shadow-xs border border-[#E8E2D8] font-bold ring-1 ring-black/[0.04]"
                  : "text-[#565C58] hover:text-[#1E2320] hover:bg-white/60 font-medium"
              }`}
            >
              <Users weight="light" size={17} className={activeTab === "roster" ? "text-[#5C7C68]" : ""} />
              <span>Daftar Siswa & Riwayat</span>
            </button>

            {/* Tombol Print Rekap Observasi Batch */}
            {selectedBatchId && (
              <Link
                href={`/reports/batch/${selectedBatchId}`}
                target="_blank"
                className="flex-1 min-w-[165px] h-11 sm:h-12 px-4 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 bg-[#1E2320] hover:bg-[#152219] text-white shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.99] whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                title="Buka Lembar Rekapitulasi Observasi Gelombang Siap Cetak"
              >
                <Printer weight="light" size={16} />
                <span>Cetak Rekap Gelombang</span>
              </Link>
            )}
          </div>
        )}

        {/* Tab 1: Kategori Literasi TaRL */}
        {activeTab === "tarl" && report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Group A: Pra-Literasi */}
            <div className="bg-white rounded-2xl p-4.5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] flex flex-col justify-between space-y-4 sm:space-y-5 h-full">
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <h3 className="font-bold text-sm text-[#1E2320] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center flex-shrink-0">
                      <BookOpen weight="light" size={16} />
                    </div>
                    <span>{report.recommendationPackage.tarl.groupA.title}</span>
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#C9733B] self-start sm:self-auto border border-[#F2D8C7]">
                    {report.recommendationPackage.tarl.groupA.students.length} Siswa
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#565C58] leading-relaxed min-h-[36px]">
                  {report.recommendationPackage.tarl.groupA.description}
                </p>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider">
                    Strategi Pendampingan di Kelas:
                  </p>
                  <div className="space-y-2">
                    {report.recommendationPackage.tarl.groupA.strategies.map((s, idx) => (
                      <div key={idx} className="bg-[#F4F3EE] p-3 rounded-xl border border-[#E8E2D8] flex items-start gap-2.5 text-xs text-[#1E2320] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#C9733B] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#FAF7F2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider">
                    Daftar Calon Siswa ({report.recommendationPackage.tarl.groupA.students.length}):
                  </p>
                  <span className="text-[11px] text-[#787F7A] font-medium">Klik nama untuk melihat catatan</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto no-scrollbar p-2.5 bg-[#F4F3EE] rounded-xl border border-[#E8E2D8] content-start">
                  {report.recommendationPackage.tarl.groupA.students.map((p) => (
                    <button
                      key={p.student.id}
                      onClick={() => setSelectedStudentProfile(p)}
                      className="text-xs bg-white text-[#1E2320] border border-[#DDD7CE] shadow-xs px-3 py-2 rounded-xl hover:bg-[#F0F4F1] hover:border-[#5C7C68] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none font-semibold transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                    >
                      <span>{p.student.nickname}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EBE6DF] text-[#565C58]">
                        {p.reading_level}
                      </span>
                    </button>
                  ))}
                  {report.recommendationPackage.tarl.groupA.students.length === 0 && (
                    <span className="text-xs text-[#787F7A] italic p-2">Tidak ada siswa pada kelompok ini</span>
                  )}
                </div>
              </div>
            </div>

            {/* Group B: Penguatan & Pengayaan */}
            <div className="bg-white rounded-2xl p-4.5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] flex flex-col justify-between space-y-4 sm:space-y-5 h-full">
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#FAF7F2]">
                  <h3 className="font-bold text-sm text-[#1E2320] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                      <Books weight="light" size={16} />
                    </div>
                    <span>{report.recommendationPackage.tarl.groupB.title}</span>
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F1] text-[#3D7A5A] self-start sm:self-auto border border-[#C9DBD0]">
                    {report.recommendationPackage.tarl.groupB.students.length} Siswa
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#565C58] leading-relaxed min-h-[36px]">
                  {report.recommendationPackage.tarl.groupB.description}
                </p>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider">
                    Strategi Pengayaan di Kelas:
                  </p>
                  <div className="space-y-2">
                    {report.recommendationPackage.tarl.groupB.strategies.map((s, idx) => (
                      <div key={idx} className="bg-[#F4F3EE] p-3 rounded-xl border border-[#E8E2D8] flex items-start gap-2.5 text-xs text-[#1E2320] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#5C7C68] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#FAF7F2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider">
                    Daftar Calon Siswa ({report.recommendationPackage.tarl.groupB.students.length}):
                  </p>
                  <span className="text-[11px] text-[#787F7A] font-medium">Klik nama untuk melihat catatan</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto no-scrollbar p-2.5 bg-[#F4F3EE] rounded-xl border border-[#E8E2D8] content-start">
                  {report.recommendationPackage.tarl.groupB.students.map((p) => (
                    <button
                      key={p.student.id}
                      onClick={() => setSelectedStudentProfile(p)}
                      className="text-xs bg-white text-[#1E2320] border border-[#DDD7CE] shadow-xs px-3 py-2 rounded-xl hover:bg-[#F0F4F1] hover:border-[#5C7C68] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none font-semibold transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                    >
                      <span>{p.student.nickname}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EBE6DF] text-[#565C58]">
                        {p.reading_level}
                      </span>
                    </button>
                  ))}
                  {report.recommendationPackage.tarl.groupB.students.length === 0 && (
                    <span className="text-xs text-[#787F7A] italic p-2">Tidak ada siswa pada kelompok ini</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MPLS 2 Minggu Awal */}
        {activeTab === "mpls" && report && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <Plant weight="light" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2320]">
                    {report.recommendationPackage.mpls.title}
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Fase orientasi ramah anak tanpa tekanan tes calistung
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0] self-start sm:self-auto flex-shrink-0">
                2 Minggu Pertama
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#565C58] leading-relaxed">
              Masa Pengenalan Lingkungan Sekolah (MPLS) dirancang menyenangkan untuk menumbuhkan rasa aman, mengenalkan budaya dan teman sebaya, serta membiasakan adab sekolah tanpa tes formal.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {report.recommendationPackage.mpls.guidelines.map((g, idx) => (
                <div key={idx} className="bg-[#F4F3EE] p-4.5 rounded-2xl border border-[#E8E2D8] flex flex-col justify-between space-y-3 hover:border-[#5C7C68]/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#C9733B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#EBE6DF] text-[#1E2320] px-2.5 py-0.5 rounded-full">
                        {g.day}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#1E2320] mb-1.5">{g.focus}</p>
                    <p className="text-xs text-[#565C58] leading-relaxed font-medium">{g.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Rencana Pembelajaran Kelas (Kurikulum Merdeka) */}
        {activeTab === "atp" && report && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <SlidersHorizontal weight="light" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2320]">
                    {report.recommendationPackage.kurikulumMerdeka.title}
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Penyesuaian capaian pembelajaran Fase A diselaraskan dengan hasil pemetaan awal
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F0F4F1] text-[#3D7A5A] border border-[#C9DBD0] self-start sm:self-auto flex-shrink-0">
                Fase A (Kelas 1 SD)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {report.recommendationPackage.kurikulumMerdeka.points.map((pt, idx) => (
                <div key={idx} className="p-4.5 bg-[#F4F3EE] rounded-2xl border border-[#E8E2D8] flex flex-col justify-between space-y-3 hover:border-[#5C7C68]/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#5C7C68] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-[#1E2320] uppercase tracking-wide">
                      {idx === 0 ? "Fokus Fonik & Lisan" : idx === 1 ? "Diferensiasi Pembelajaran" : "Penilaian Formatif Berkala"}
                    </h4>
                  </div>
                  <p className="text-xs text-[#565C58] leading-relaxed font-medium flex-1">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Sinyal Pendampingan (Afektif) */}
        {activeTab === "redflags" && report && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#FAF7F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center flex-shrink-0">
                  <Warning weight="light" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E2320]">
                    Rekomendasi Sinyal Pendampingan Afektif
                  </h3>
                  <p className="text-xs text-[#565C58] mt-0.5">
                    Menyambut kebutuhan adaptasi anak secara hangat dan bermartabat tanpa label negatif
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] self-start sm:self-auto flex-shrink-0">
                {report.recommendationPackage.redFlagIntervention.students.length} Siswa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
              {report.recommendationPackage.redFlagIntervention.students.map((p) => (
                <div
                  key={p.student.id}
                  onClick={() => setSelectedStudentProfile(p)}
                  className="p-3.5 bg-[#F4F3EE] rounded-2xl border border-[#E8E2D8] flex items-center justify-between cursor-pointer hover:border-[#C9733B]/50 hover:bg-[#FAF0E8]/40 hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedStudentProfile(p);
                    }
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#1E2320] truncate">{p.student.full_name}</p>
                    <p className="text-[11px] text-[#565C58] font-semibold truncate mt-0.5">
                      &ldquo;{p.student.nickname}&rdquo; · {p.student.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#C9733B] flex items-center gap-1 bg-white border border-[#F2D8C7] px-2.5 py-1 rounded-lg flex-shrink-0 shadow-2xs">
                    <span>Lihat Jejak</span>
                    <CaretRight weight="bold" size={12} />
                  </span>
                </div>
              ))}
              {report.recommendationPackage.redFlagIntervention.students.length === 0 && (
                <div className="col-span-full p-8 bg-[#F4F3EE] rounded-2xl border border-[#E8E2D8] text-center">
                  <p className="text-sm text-[#3D7A5A] font-semibold flex items-center justify-center gap-2">
                    <CheckCircle weight="light" size={22} className="text-[#3D7A5A]" />
                    <span>Semua calon siswa menunjukkan kesiapan adaptif yang baik pada gelombang ini.</span>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider mb-2.5">
                Protokol Pendampingan di Kelas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {report.recommendationPackage.redFlagIntervention.guidelines.map((g, idx) => (
                  <div key={idx} className="bg-[#F4F3EE] p-3.5 rounded-2xl border border-[#E8E2D8] flex items-start gap-2.5 text-xs text-[#1E2320] leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-[#C9733B] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium text-[#565C58]">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Complete Roster & Story Timeline Access */}
        {activeTab === "roster" && report && (() => {
          const allStudents = [
            ...report.recommendationPackage.tarl.groupA.students,
            ...report.recommendationPackage.tarl.groupB.students,
            ...report.recommendationPackage.tarl.unassessed,
          ];

          const filteredRoster = allStudents.filter((p) => {
            const matchesSearch =
              !rosterSearch ||
              p.student.full_name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
              p.student.nickname.toLowerCase().includes(rosterSearch.toLowerCase()) ||
              p.student.registration_no.toLowerCase().includes(rosterSearch.toLowerCase());

            const matchesClass =
              rosterClassFilter === "all" ||
              (rosterClassFilter === "1A" && p.placement?.assigned_class === "1A") ||
              (rosterClassFilter === "1B" && p.placement?.assigned_class === "1B") ||
              (rosterClassFilter === "redflag" && p.has_any_red_flag);

            return matchesSearch && matchesClass;
          });

          return (
            <div className="space-y-4">
              {/* Search and Class Filter Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(30,35,32,0.06)] border border-[#E8E2D8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlass
                    weight="light"
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#787F7A]"
                  />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Cari nama, panggilan, atau no. registrasi..."
                    className="w-full h-11 pl-9 pr-4 rounded-xl text-xs sm:text-sm bg-[#F4F3EE] text-[#1E2320] placeholder:text-[#A8A09A] border border-[#DDD7CE] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#787F7A] hover:text-[#1E2320] p-1.5"
                      aria-label="Hapus kata kunci"
                    >
                      <X weight="light" size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
                  {[
                    { id: "all", label: `Semua (${allStudents.length})` },
                    { id: "1A", label: "Kelas 1A" },
                    { id: "1B", label: "Kelas 1B" },
                    { id: "redflag", label: "Perlu Pendampingan" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRosterClassFilter(tab.id as any)}
                      className={`h-11 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none ${
                        rosterClassFilter === tab.id
                          ? "bg-[#C9733B] text-white shadow-xs font-bold"
                          : "bg-[#F4F3EE] text-[#565C58] hover:bg-[#EBE6DF] border border-[#DDD7CE]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Header and Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
                <h3 className="font-bold text-sm text-[#1E2320]">
                  Daftar Calon Siswa ({filteredRoster.length} dari {report.totalStudents} Anak)
                </h3>
                <span className="text-[11px] sm:text-xs text-[#565C58]">
                  Klik kartu calon siswa untuk melihat riwayat observasi evaluator
                </span>
              </div>

              {/* Student Cards List */}
              {filteredRoster.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-[#E8E2D8] text-center shadow-xs">
                  <p className="text-sm font-bold text-[#1E2320]">Tidak ada data siswa yang cocok</p>
                  <p className="text-xs text-[#565C58] mt-1">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRoster.map((p) => (
                    <StudentHeroCard
                      key={p.student.id}
                      student={p.student}
                      completionRate={p.completion_rate}
                      overallScore={p.overall_score}
                      readingLevel={p.reading_level}
                      hasRedFlag={p.has_any_red_flag}
                      assignedClass={p.placement?.assigned_class}
                      onClick={() => setSelectedStudentProfile(p)}
                      actionSlot={
                        <a
                          href={`/reports/student/${p.student.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold px-3.5 py-2 min-h-[38px] rounded-xl bg-[#1E2320] text-white shadow-xs hover:bg-[#152219] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                          title="Buka Lembar PDF Siap Cetak"
                        >
                          <Printer weight="light" size={14} />
                          <span>PDF</span>
                        </a>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* ─── Story Timeline Modal / Dialog ───────────────── */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-[#1E2320]/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedStudentProfile(null)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-modal-title"
            className="relative w-full max-w-2xl bg-white rounded-2xl p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(30,35,32,0.3)] border border-[#E8E2D8] max-h-[90vh] overflow-y-auto z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#E8E2D8] gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0">
                  <User weight="light" size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#3D7A5A]">
                    Riwayat Observasi Siswa
                  </p>
                  <h3 id="timeline-modal-title" className="text-sm sm:text-base font-bold text-[#1E2320] truncate">
                    {selectedStudentProfile.student.full_name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#565C58] mt-0.5 line-clamp-1">
                    Catatan pengamatan langsung evaluator di Pos 1 s.d. Pos 5
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentProfile(null)}
                className="w-8 h-8 rounded-full bg-[#F4F3EE] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#DDD7CE] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none flex-shrink-0 cursor-pointer"
                aria-label="Tutup Riwayat Pengamatan"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            {/* Timeline Component */}
            <div className="py-1">
              <StoryTimeline evaluations={selectedStudentProfile.evaluations} />
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setSelectedStudentProfile(null)}
                className="w-full sm:w-auto h-11 bg-[#F4F3EE] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold px-4 rounded-xl border border-[#DDD7CE] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none text-center cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={`/reports/student/${selectedStudentProfile.student.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-11 bg-[#1E2320] hover:bg-[#152219] text-white text-xs font-bold px-5 rounded-xl shadow-xs flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-all text-center focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Printer weight="light" size={15} />
                <span>Buka Laporan Lengkap PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
