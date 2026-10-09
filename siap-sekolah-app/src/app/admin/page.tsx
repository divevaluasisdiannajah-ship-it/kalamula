export const runtime = 'edge';
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarBlank,
  CheckCircle,
  Warning,
  Lightning,
  Plus,
  UploadSimple,
  SlidersHorizontal,
  Scales,
  User,
  CaretRight,
} from "@phosphor-icons/react";
import type { Batch, Student } from "@/types";

interface DashboardStats {
  totalStudents: number;
  activeBatches: number;
  evaluatedCount: number;
  redFlagCount: number;
  genderBreakdown: { L: number; P: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeBatches: 0,
    evaluatedCount: 0,
    redFlagCount: 0,
    genderBreakdown: { L: 0, P: 0 },
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [batchRes, studentRes, evalRes] = await Promise.all([
          fetch("/api/batches"),
          fetch("/api/students"),
          fetch("/api/evaluations"),
        ]);

        if (batchRes.ok) {
          const batchData = await batchRes.json();
          const batchList: Batch[] = batchData.data || [];
          setBatches(batchList);
          setStats((prev) => ({
            ...prev,
            activeBatches: batchList.filter((b) => b.status === "active").length,
          }));
        }

        if (studentRes.ok) {
          const studentData = await studentRes.json();
          const students: Student[] = studentData.data || [];
          setRecentStudents(students.slice(0, 5));
          setStats((prev) => ({
            ...prev,
            totalStudents: students.length,
            genderBreakdown: {
              L: students.filter((s) => s.gender === "L").length,
              P: students.filter((s) => s.gender === "P").length,
            },
          }));
        }

        if (evalRes.ok) {
          const evalData = await evalRes.json();
          const evals = evalData.data || [];
          const completedStudents = new Set(evals.filter((e: { is_complete: boolean }) => e.is_complete).map((e: { student_id: string }) => e.student_id));
          const redFlagStudents = new Set(evals.filter((e: { has_red_flag: boolean }) => e.has_red_flag).map((e: { student_id: string }) => e.student_id));

          setStats((prev) => ({
            ...prev,
            evaluatedCount: completedStudents.size,
            redFlagCount: redFlagStudents.size,
          }));
        }
      } catch {
        // offline fallback
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Dashboard Admin</h1>
        <p className="text-xs sm:text-sm text-[#565C58] mt-1">
          Ringkasan status asesmen diagnostik kesiapan belajar calon siswa Fase A
        </p>
      </div>

      {/* Stats Cards (Aetrium System: Semantic Palette & Pure Crisp White Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Calon Siswa */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(30,35,32,0.08)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#565C58] uppercase tracking-wider">
              Total Calon Siswa
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
              <Users weight="light" size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
            {loading ? "..." : stats.totalStudents} <span className="text-xs sm:text-sm font-bold text-[#565C58]">Anak</span>
          </p>
          <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
            {loading ? "Memuat..." : `${stats.genderBreakdown.L} Laki-laki / ${stats.genderBreakdown.P} Perempuan`}
          </p>
        </div>

        {/* Card 2: Gelombang Aktif */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#D4E2D8] shadow-[0_4px_20px_-2px_rgba(92,124,104,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(92,124,104,0.12)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#3D7A5A] uppercase tracking-wider">
              Gelombang Aktif
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
              <CalendarBlank weight="light" size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
            {loading ? "..." : stats.activeBatches} <span className="text-xs sm:text-sm font-bold text-[#3D7A5A]">Gelombang</span>
          </p>
          <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
            dari {batches.length} total gelombang
          </p>
        </div>

        {/* Card 3: Selesai Diobservasi */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#D4E2D8] shadow-[0_4px_20px_-2px_rgba(92,124,104,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(92,124,104,0.12)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#3D7A5A] uppercase tracking-wider">
              Selesai Diobservasi
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle weight="light" size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
            {loading ? "..." : stats.evaluatedCount} <span className="text-xs sm:text-sm font-bold text-[#3D7A5A]">Anak</span>
          </p>
          <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
            dari {stats.totalStudents} siswa terdaftar
          </p>
        </div>

        {/* Card 4: Sinyal Pendampingan */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#F2D8C7] shadow-[0_4px_20px_-2px_rgba(201,115,59,0.08)] flex flex-col justify-between min-h-[125px] sm:min-h-[136px] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-2px_rgba(201,115,59,0.12)]">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#C9733B] uppercase tracking-wider">
              Sinyal Pendampingan
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center shadow-xs flex-shrink-0">
              <Warning weight="light" size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#1E2320] tracking-tight leading-none">
            {loading ? "..." : stats.redFlagCount} <span className="text-xs sm:text-sm font-bold text-[#C9733B]">Anak</span>
          </p>
          <p className="text-[10.5px] sm:text-[11px] font-medium text-[#787F7A] mt-1.5 sm:mt-2 leading-tight">
            perlu pendekatan afektif bertahap
          </p>
        </div>
      </div>

      {/* Quick Actions (Crisp White Container) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C9733B]" />
            <h2 className="text-xs font-bold text-[#1E2320] uppercase tracking-wider">
              Aksi Cepat Koordinator
            </h2>
          </div>
          <button
            onClick={async () => {
              if (confirm("Buat 56 dataset calon siswa realistis lengkap dengan evaluasi 5 Pos untuk uji coba end-to-end?")) {
                try {
                  const res = await fetch("/api/seed", { method: "POST" });
                  const json = await res.json();
                  if (json.success) {
                    alert("Sukses: 56 siswa (28 L / 28 P) dengan evaluasi 5 Pos berhasil dimuat.");
                    window.location.reload();
                  } else {
                    alert("Gagal melakukan seed dataset.");
                  }
                } catch {
                  alert("Koneksi gagal.");
                }
              }
            }}
            className="text-xs bg-[#1E2320] hover:bg-[#2C332E] text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-1.5 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            <Lightning weight="light" size={16} />
            <span>Generate 56 Calon Siswa (Uji Coba)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/batches" Icon={Plus} label="Buat Gelombang Baru" />
          <QuickAction href="/admin/students" Icon={UploadSimple} label="Import Data Siswa" />
          <QuickAction href="/admin/configs" Icon={SlidersHorizontal} label="Rubrik & Indikator" />
          <QuickAction href="/admin/classes" Icon={Scales} label="Pembagian Kelas" />
        </div>
      </div>

      {/* Two Column Layout (Pure Crisp White Containers) */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent Batches */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#FAF8F5] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
                  <CalendarBlank weight="light" size={17} />
                </div>
                <h3 className="font-bold text-sm text-[#1E2320]">
                  Gelombang Observasi Terbaru
                </h3>
              </div>
              <Link
                href="/admin/batches"
                className="text-xs font-bold text-[#3D7A5A] hover:text-[#1E2320] flex items-center gap-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] rounded-md px-1.5 py-0.5"
              >
                <span>Kelola Semua</span>
                <CaretRight weight="bold" size={12} />
              </Link>
            </div>

            {batches.length === 0 && !loading ? (
              <p className="text-xs text-[#787F7A] py-8 text-center italic">
                Belum ada gelombang observasi. Buat gelombang pertama untuk memulai asesmen.
              </p>
            ) : (
              <div className="space-y-2.5">
                {batches.slice(0, 4).map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E8E2D8] flex items-center justify-between hover:border-[#5C7C68]/60 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1E2320]">
                        {batch.batch_name}
                      </p>
                      <p className="text-[11px] text-[#565C58] mt-0.5">
                        Tanggal: {batch.batch_date}
                      </p>
                    </div>
                    <BatchStatusBadge status={batch.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#FAF8F5] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
                  <Users weight="light" size={17} />
                </div>
                <h3 className="font-bold text-sm text-[#1E2320]">
                  Calon Siswa Baru Terdaftar
                </h3>
              </div>
              <Link
                href="/admin/students"
                className="text-xs font-bold text-[#3D7A5A] hover:text-[#1E2320] flex items-center gap-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] rounded-md px-1.5 py-0.5"
              >
                <span>Lihat Semua</span>
                <CaretRight weight="bold" size={12} />
              </Link>
            </div>

            {recentStudents.length === 0 && !loading ? (
              <p className="text-xs text-[#787F7A] py-8 text-center italic">
                Belum ada data siswa. Gunakan tombol Import Data Siswa di atas.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E8E2D8] flex items-center gap-3 hover:border-[#5C7C68]/60 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 shadow-xs font-bold ${
                      student.gender === "L" ? "bg-[#E8EDF2] text-[#283747]" : "bg-[#FAF0E8] text-[#8C4620] border border-[#F2D8C7]"
                    }`}>
                      <User weight="light" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1E2320] truncate">
                        {student.full_name}
                      </p>
                      <p className="text-[11px] text-[#565C58]">
                        No. Reg: {student.registration_no} &bull; Panggilan: {student.nickname}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        student.gender === "L"
                          ? "bg-[#E8EDF2] text-[#283747]"
                          : "bg-[#FAF0E8] text-[#8C4620]"
                      }`}
                    >
                      {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function QuickAction({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ weight?: "light"; size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[#FAF8F5] hover:bg-[#F3EFE8] rounded-xl p-3 sm:p-3.5 border border-[#E5E0D8] shadow-2xs hover:shadow-xs transition-all flex items-center gap-3 group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 min-h-[48px]"
    >
      <div className="w-8 h-8 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform border border-[#D4E2D8]">
        <Icon weight="light" size={16} className="text-[#3D7A5A]" />
      </div>
      <span className="text-xs font-bold text-[#1E2320] group-hover:text-black transition-colors">
        {label}
      </span>
    </Link>
  );
}

function BatchStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    draft: "bg-[#EBE6DF] text-[#565C58] border border-[#DDD7CE]",
    active: "bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8]",
    locked: "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]",
  };
  const labels: Record<string, string> = {
    draft: "Draft",
    active: "Aktif",
    locked: "Terkunci",
  };

  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

