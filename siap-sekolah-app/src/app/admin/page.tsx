"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import Link from "next/link";
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
          const completedStudents = new Set(
            evals.filter((e: { is_complete: boolean }) => e.is_complete).map((e: { student_id: string }) => e.student_id)
          );
          const redFlagStudents = new Set(
            evals.filter((e: { has_red_flag: boolean }) => e.has_red_flag).map((e: { student_id: string }) => e.student_id)
          );

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

  const progressPercent =
    stats.totalStudents > 0
      ? Math.round((stats.evaluatedCount / stats.totalStudents) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-28 font-sans">
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
            <span className="bg-[#E4EAF2] text-[#36506C] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ml-1">
              ADMIN
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
          <h1 className="text-2xl font-extrabold text-[#22352B] tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-xs text-[#565C58] mt-1">
            Ringkasan status asesmen diagnostik kesiapan belajar calon siswa Fase A
          </p>
        </div>

        {/* Grid 2x2 Statistik */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
          {/* 1. Total Calon Siswa (Card Putih) */}
          <div className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm flex flex-col justify-between min-h-[132px]">
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
                {loading ? "..." : stats.totalStudents}{" "}
                <span className="text-xs font-bold text-[#565C58]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#787F7A] mt-1.5 leading-tight">
                {loading ? "Memuat..." : `${stats.genderBreakdown.L} Laki-laki / ${stats.genderBreakdown.P} Perempuan`}
              </p>
            </div>
          </div>

          {/* 2. Gelombang Aktif (Card Putih) */}
          <div className="bg-white rounded-3xl p-4 sm:p-4.5 border border-[#E8E2D8]/60 shadow-sm flex flex-col justify-between min-h-[132px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider">
                GELOMBANG AKTIF
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-calendar-blank-outline text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#22352B] tracking-tight leading-none">
                {loading ? "..." : stats.activeBatches}{" "}
                <span className="text-xs font-bold text-[#36506C]">Gelombang</span>
              </p>
              <p className="text-[11px] font-medium text-[#787F7A] mt-1.5 leading-tight">
                dari {batches.length} total gelombang
              </p>
            </div>
          </div>

          {/* 3. Selesai Diobservasi (Solid Green #486B5A) */}
          <div className="bg-[#486B5A] rounded-3xl p-4 sm:p-4.5 shadow-sm flex flex-col justify-between min-h-[132px] text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider">
                SELESAI DIOBSERVASI
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                <i className="mdi mdi-check-circle-outline text-lg" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                {loading ? "..." : stats.evaluatedCount}{" "}
                <span className="text-xs font-bold text-white/80">Anak</span>
              </p>
              {/* Progress bar putih */}
              <div className="w-full h-1.5 bg-white/30 rounded-full my-1.5 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-white/80 leading-tight">
                dari {stats.totalStudents} siswa terdaftar
              </p>
            </div>
          </div>

          {/* 4. Sinyal Pendampingan (Soft Peach #F9E6DC) */}
          <div className="bg-[#F9E6DC] rounded-3xl p-4 sm:p-4.5 border border-[#F1CFC0] shadow-sm flex flex-col justify-between min-h-[132px]">
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
                {loading ? "..." : stats.redFlagCount}{" "}
                <span className="text-xs font-bold text-[#8C3713]">Anak</span>
              </p>
              <p className="text-[11px] font-medium text-[#8C3713]/80 mt-1.5 leading-tight">
                perlu pendekatan afektif bertahap
              </p>
            </div>
          </div>
        </div>

        {/* Card Aksi Cepat Koordinator */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D67443]" />
            <h2 className="text-xs font-extrabold text-[#787F7A] uppercase tracking-wider">
              AKSI CEPAT KOORDINATOR
            </h2>
          </div>

          {/* Tombol Penuh: + Buat Gelombang Baru (#B85627) */}
          <Link
            href="/admin/batches"
            className="w-full bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            <i className="mdi mdi-plus text-xl" />
            <span className="text-sm font-bold">Buat Gelombang Baru</span>
          </Link>

          {/* 3 Tombol Kotak Sejajar */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Import Data Siswa */}
            <Link
              href="/admin/students"
              className="bg-[#E4EFE9] text-[#486B5A] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-tray-arrow-up text-2xl mb-1" />
              <span className="text-xs leading-snug">Import Data Siswa</span>
            </Link>

            {/* Rubrik & Indikator */}
            <Link
              href="/admin/configs"
              className="bg-[#E4EAF2] text-[#36506C] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-tune-vertical text-2xl mb-1" />
              <span className="text-xs leading-snug">Rubrik & Indikator</span>
            </Link>

            {/* Pembagian Kelas */}
            <Link
              href="/admin/classes"
              className="bg-[#EFE7D6] text-[#7D5327] rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <i className="mdi mdi-scale-balance text-2xl mb-1" />
              <span className="text-xs leading-snug">Pembagian Kelas</span>
            </Link>
          </div>

          {/* Tombol Bawah Putus-Putus (Seed Uji Coba) */}
          <button
            type="button"
            onClick={async () => {
              if (
                confirm(
                  "Isi data uji coba 56 calon siswa lengkap dengan hasil observasi 5 Pos?"
                )
              ) {
                try {
                  const res = await fetch("/api/seed", { method: "POST" });
                  const json = await res.json();
                  if (json.success) {
                    alert("Sukses: 56 siswa (28 L / 28 P) berhasil dimuat.");
                    window.location.reload();
                  } else {
                    alert("Gagal melakukan seed dataset.");
                  }
                } catch {
                  alert("Koneksi gagal.");
                }
              }
            }}
            className="w-full border border-dashed border-[#DDD7CE] bg-[#FAF8F5] rounded-2xl p-3 flex items-center justify-between text-xs text-[#565C58] hover:bg-[#F3EFE6] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <i className="mdi mdi-flask-outline text-lg text-[#787F7A]" />
              <span className="font-semibold text-[#22352B]">
                Isi data uji coba (56 calon siswa)
              </span>
            </div>
            <span className="bg-white border border-[#DDD7CE] text-[#787F7A] text-[10px] font-extrabold px-2 py-0.5 rounded shadow-2xs">
              DEV
            </span>
          </button>
        </div>

        {/* Gelombang Observasi Terbaru */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#22352B]">
              Gelombang Observasi Terbaru
            </h3>
            <Link
              href="/admin/batches"
              className="text-xs font-bold text-[#B85627] hover:underline flex items-center gap-0.5"
            >
              <span>Kelola Semua</span>
              <i className="mdi mdi-chevron-right text-sm" />
            </Link>
          </div>

          {batches.length === 0 && !loading ? (
            <p className="text-xs text-[#787F7A] py-4 text-center italic">
              Belum ada gelombang observasi.
            </p>
          ) : (
            <div className="space-y-2">
              {batches.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8E2D8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0">
                      <i className="mdi mdi-calendar-blank-outline text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#22352B]">
                        {b.batch_name}
                      </p>
                      <p className="text-[11px] text-[#787F7A] mt-0.5">
                        Tanggal: {b.batch_date}
                      </p>
                    </div>
                  </div>
                  {b.status === "active" && (
                    <span className="bg-[#E4EFE9] text-[#22352B] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#4F936F]" />
                      <span>Aktif</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calon Siswa Baru Terdaftar */}
        <div className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#22352B]">
              Calon Siswa Baru Terdaftar
            </h3>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-[#B85627] hover:underline flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <i className="mdi mdi-chevron-right text-sm" />
            </Link>
          </div>

          {recentStudents.length === 0 && !loading ? (
            <p className="text-xs text-[#787F7A] py-4 text-center italic">
              Belum ada data calon siswa.
            </p>
          ) : (
            <div className="space-y-2">
              {recentStudents.slice(0, 3).map((s, idx) => (
                <div
                  key={s.id}
                  className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#E8E2D8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-2xs ${
                        idx % 2 === 0 ? "bg-[#D67443]" : "bg-[#486B5A]"
                      }`}
                    >
                      {s.nickname ? s.nickname.charAt(0).toUpperCase() : s.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#22352B] truncate">
                        {s.full_name}
                      </p>
                      <p className="text-[11px] text-[#787F7A] truncate mt-0.5">
                        {s.registration_no} &bull; {s.gender === "L" ? "Laki-laki" : "Perempuan"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/reports/student/${s.id}`}
                    className="bg-[#E4EFE9] hover:bg-[#D5E6DC] text-[#486B5A] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition flex-shrink-0 ml-2"
                  >
                    <i className="mdi mdi-file-document-outline text-sm" />
                    <span>Laporan</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
