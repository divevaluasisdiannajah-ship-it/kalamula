export const runtime = 'edge';
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { StudentHeroCard } from "@/components/aetrium/StudentHeroCard";
import { Printer, MagnifyingGlass } from "@phosphor-icons/react";
import type { Batch, StudentProfile } from "@/types";

export default function AdminReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const loadStudents = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/batch/${batchId}`);
      if (res.ok) {
        const json = await res.json();
        const pkg = json.data?.recommendationPackage;
        if (pkg) {
          const all: StudentProfile[] = [
            ...pkg.tarl.groupA.students,
            ...pkg.tarl.groupB.students,
            ...pkg.tarl.unassessed,
          ];
          setStudents(all);
        }
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
      loadStudents(selectedBatchId);
    }
  }, [selectedBatchId, loadStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (p) =>
        p.student.full_name.toLowerCase().includes(q) ||
        p.student.nickname.toLowerCase().includes(q) ||
        p.student.registration_no.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Page Heading */}
      <div>
        <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Pusat Dokumen & Laporan Siswa</h1>
        <p className="text-xs sm:text-sm text-[#565C58] mt-0.5">
          Format 1 Halaman PDF Siap Cetak untuk Guru Kelas & Orang Tua, bebas jargon teknis.
        </p>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="batch-select" className="text-xs font-bold text-[#565C58] uppercase tracking-wider flex-shrink-0">
              Gelombang:
            </label>
            <select
              id="batch-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="flex-1 sm:flex-initial h-11 rounded-xl px-3.5 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] font-bold border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name} ({b.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {selectedBatchId && (
            <Link
              href={`/reports/batch/${selectedBatchId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white px-4 text-xs rounded-xl font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-[0.98] w-full sm:w-auto flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
              title="Buka Lembar Rekapitulasi Gelombang Siap Cetak"
            >
              <Printer weight="light" size={16} />
              <span>Cetak Rekap Gelombang</span>
            </Link>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#787F7A]">
            <MagnifyingGlass weight="light" size={17} />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau No. Reg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm bg-[#FAF8F5] rounded-xl text-[#1E2320] placeholder:text-[#A8A09A] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <section aria-label="Daftar Siswa">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs p-16 text-center text-xs text-[#565C58] font-medium animate-pulse">
            Memuat daftar calon siswa dan laporan...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs p-12 text-center text-xs text-[#565C58]">
            {searchQuery
              ? "Tidak ada siswa yang cocok dengan kata kunci pencarian."
              : "Belum ada data siswa pada gelombang yang dipilih."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((p) => {
              const completedPos = [1, 2, 3, 4, 5].filter(
                (pos) => p.pos_scores[pos] !== null
              ).length;
              const rate = Math.round((completedPos / 5) * 100);

              return (
                <StudentHeroCard
                  key={p.student.id}
                  student={p.student}
                  completionRate={rate}
                  overallScore={p.overall_score}
                  readingLevel={p.reading_level}
                  hasRedFlag={p.has_any_red_flag}
                  assignedClass={p.placement?.assigned_class}
                  actionSlot={
                    <Link
                      href={`/reports/student/${p.student.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3.5 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs rounded-xl font-bold shadow-xs inline-flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                    >
                      <Printer weight="light" size={15} />
                      <span>Cetak PDF</span>
                    </Link>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

