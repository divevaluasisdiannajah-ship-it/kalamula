export const runtime = 'edge';
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Leaf,
  GraduationCap,
  Users,
  BookOpen,
  Books,
  Warning,
  CheckCircle,
  FileText,
  ChartBar,
  NotePencil,
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
  profiles?: StudentProfile[];
}

function calculateAge(birthDateStr?: string): string {
  if (!birthDateStr) return "-";
  const birth = new Date(birthDateStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return "-";
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}th ${months}bl`;
}

export default function BatchReportPDFPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [data, setData] = useState<BatchReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable institution & signature state
  const [foundationName, setFoundationName] = useState(
    "Yayasan Perguruan Islam An-Najah"
  );
  const [schoolName, setSchoolName] = useState("SD Islam Terpadu An-Najah");
  const [coordinatorName, setCoordinatorName] = useState("Tim Asesor PPDB Fase A");
  const [schoolUnit, setSchoolUnit] = useState("SDIT An-Najah");
  const [principalName, setPrincipalName] = useState("Hj. Dra. Masitoh, M.Pd.");
  const [principalNip, setPrincipalNip] = useState("........................................");
  const [showSettings, setShowSettings] = useState(true);

  const loadBatchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/batch/${batchId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // offline/error handling
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadBatchReport();
  }, [loadBatchReport]);

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
      <div className="min-h-screen bg-[#EDECE8] flex items-center justify-center text-stone-600 font-medium">
        Menyiapkan dokumen rekapitulasi gelombang...
      </div>
    );
  }

  if (!data || !data.batch) {
    return (
      <div className="min-h-screen bg-[#EDECE8] flex flex-col items-center justify-center p-6 text-center">
        <FileText weight="light" size={44} className="text-stone-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-stone-900">Data Gelombang Tidak Ditemukan</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#1E2E24] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#152219] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft weight="light" size={14} />
          <span>Kembali</span>
        </button>
      </div>
    );
  }

  const { batch, totalStudents, evaluatedCount, posAverages, recommendationPackage } = data;
  const allProfiles = data.profiles || [
    ...recommendationPackage.tarl.groupA.students,
    ...recommendationPackage.tarl.groupB.students,
    ...recommendationPackage.tarl.unassessed,
  ];

  const formattedDate = batch.batch_date
    ? new Date(batch.batch_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tahun Ajaran 2026/2027";

  return (
    <div className="min-h-screen bg-[#EDECE8] py-8 px-3 md:px-6 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="px-3.5 py-2 rounded-xl bg-white text-stone-800 text-xs font-bold shadow-xs hover:bg-stone-50 transition-colors flex items-center gap-1.5 ring-1 ring-stone-200/80 self-start"
        >
          <ArrowLeft weight="light" size={15} />
          <span>Kembali ke Portal Guru</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 rounded-xl bg-white text-stone-800 text-xs font-bold shadow-xs hover:bg-stone-50 transition-colors flex items-center gap-1.5 ring-1 ring-stone-200/80"
          >
            <NotePencil weight="light" size={14} className="text-sage-700" />
            <span>{showSettings ? "Sembunyikan Form KOP" : "Kustomisasi KOP & Tanda Tangan"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#1E2E24] hover:bg-[#152219] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#1E2E24", color: "#FFFFFF" }}
          >
            <Printer weight="bold" size={16} />
            <span>Cetak / Simpan PDF Rekap</span>
          </button>
        </div>
      </div>

      {/* Formulir Pengaturan KOP & Tanda Tangan (Hidden on Print) */}
      {showSettings && (
        <div className="max-w-5xl mx-auto mb-5 bg-white p-4.5 sm:p-5 rounded-2xl shadow-[0_4px_20px_-3px_rgba(30,35,32,0.06)] ring-1 ring-stone-200/70 print:hidden space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <NotePencil weight="light" size={17} className="text-sage-700" />
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Formulir Kustomisasi KOP Surat & Tanda Tangan
              </h2>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">
              Data yang diketik otomatis tampil pada lembar cetak di bawah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Input KOP Yayasan */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                KOP Yayasan / Instansi
              </label>
              <input
                type="text"
                value={foundationName}
                onChange={(e) => setFoundationName(e.target.value)}
                placeholder="Contoh: Yayasan Perguruan Islam An-Najah"
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 ring-1 ring-stone-200/80 font-medium"
              />
            </div>

            {/* Input Nama Sekolah */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Nama Sekolah / Unit
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Contoh: SD Islam Terpadu An-Najah"
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 ring-1 ring-stone-200/80 font-medium"
              />
            </div>

            {/* Input Nama Kepala Sekolah */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="Contoh: Hj. Dra. Masitoh, M.Pd."
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 ring-1 ring-stone-200/80 font-medium"
              />
            </div>

            {/* Input NIP Kepala Sekolah */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                placeholder="Nomor NIP..."
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 ring-1 ring-stone-200/80 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Printable Sheet */}
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-7 md:p-10 rounded-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] print:shadow-none print:ring-0 print:p-4 print:max-w-none print:rounded-none">
        {/* Kop Surat Resmi */}
        <header className="border-b-2 border-stone-800 pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 print:flex-row">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-13 h-13 rounded-2xl bg-[#1E2E24] text-white flex items-center justify-center flex-shrink-0 shadow-xs print:bg-stone-900">
                <Leaf weight="light" size={30} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  {foundationName} · {schoolName}
                </p>
                <h1 className="text-base sm:text-lg font-black text-stone-900 uppercase tracking-tight">
                  Rekapitulasi Observasi Kesiapan Belajar Calon Siswa
                </h1>
                <p className="text-xs text-stone-600 font-medium">
                  Asesmen Diagnostik Awal Transisi PAUD ke SD (Fase A) · kalamula: Memandu Transisi, Memetakan Fondasi
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0 print:text-right">
              <span className="inline-block px-3 py-1 bg-stone-100 text-stone-900 text-xs font-black rounded-lg shadow-2xs mb-1">
                {batch.batch_name}
              </span>
              <p className="text-[11px] text-stone-500">{formattedDate}</p>
            </div>
          </div>
        </header>

        {/* Ringkasan Eksekutif Gelombang */}
        <section className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-dusk-50/70 p-3.5 rounded-xl shadow-xs ring-1 ring-dusk-200/60">
              <div className="flex items-center justify-between text-dusk-700 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Siswa</span>
                <Users weight="light" size={15} />
              </div>
              <p className="text-xl font-black text-dusk-950">{totalStudents} Siswa</p>
              <p className="text-[10px] text-dusk-800/80 mt-0.5">{evaluatedCount} Selesai Diobservasi</p>
            </div>

            <div className="bg-[#FAF4F0] p-3.5 rounded-xl shadow-xs ring-1 ring-clay-200/60">
              <div className="flex items-center justify-between text-clay-700 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Kategori Literasi A</span>
                <BookOpen weight="light" size={15} />
              </div>
              <p className="text-xl font-black text-clay-950">
                {recommendationPackage.tarl.groupA.students.length} Siswa
              </p>
              <p className="text-[10px] text-clay-800/80 mt-0.5">Pra-Literasi (L1 / L2)</p>
            </div>

            <div className="bg-sage-50/70 p-3.5 rounded-xl shadow-xs ring-1 ring-sage-200/60">
              <div className="flex items-center justify-between text-sage-700 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Kategori Literasi B</span>
                <Books weight="light" size={15} />
              </div>
              <p className="text-xl font-black text-sage-950">
                {recommendationPackage.tarl.groupB.students.length} Siswa
              </p>
              <p className="text-[10px] text-sage-800/80 mt-0.5">Penguatan Membaca (L3 / L4)</p>
            </div>

            <div className="bg-[#FAF0E8] p-3.5 rounded-xl shadow-xs ring-1 ring-clay-200/80">
              <div className="flex items-center justify-between text-clay-700 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Sinyal Pendampingan</span>
                <Warning weight="light" size={15} />
              </div>
              <p className="text-xl font-black text-clay-950">
                {recommendationPackage.redFlagIntervention.students.length} Siswa
              </p>
              <p className="text-[10px] text-clay-800/80 mt-0.5">Pendampingan Afektif Transisi</p>
            </div>
          </div>

          {/* Rerata Skor Pos 1-5 */}
          <div className="bg-stone-50/80 p-3.5 rounded-xl ring-1 ring-stone-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ChartBar weight="light" size={18} className="text-stone-700" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Rerata Skor Capaian Gelombang (Skala 1.0 s.d. 4.0):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-2 text-center text-xs">
              {[
                { pos: 1, label: "Emosi & Mandiri", score: posAverages[1] },
                { pos: 2, label: "Motorik Kasar", score: posAverages[2] },
                { pos: 3, label: "Kognitif & Logika", score: posAverages[3] },
                { pos: 4, label: "Bahasa & Literasi", score: posAverages[4] },
                { pos: 5, label: "Sosial & Kolaborasi", score: posAverages[5] },
              ].map((p, idx) => (
                <div
                  key={p.pos}
                  className={`bg-white px-2.5 py-1.5 rounded-lg shadow-2xs ring-1 ring-stone-200/50 ${
                    idx === 4 ? "col-span-2 sm:col-span-1 print:col-span-1" : ""
                  }`}
                >
                  <span className="text-[9px] text-stone-500 block truncate">{p.label}</span>
                  <span className="font-black text-stone-900 text-xs">{p.score > 0 ? p.score.toFixed(2) : "-"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabel Lengkap Rekapitulasi Siswa */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Daftar Rinci Skor Observasi Calon Siswa ({allProfiles.length} Anak)
            </h2>
            <span className="text-[10px] text-stone-500 italic">
              Kriteria Capaian: 1 = Perlu Bimbingan, 2 = Mulai Terbiasa, 3 = Mandiri, 4 = Sangat Mandiri
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl ring-1 ring-stone-200/80 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100/90 text-stone-800 font-bold border-b border-stone-200 text-[11px]">
                  <th className="py-2.5 px-2 text-center w-8">No</th>
                  <th className="py-2.5 px-2.5 w-24">No. Reg</th>
                  <th className="py-2.5 px-2.5 min-w-[150px]">Nama Lengkap</th>
                  <th className="py-2.5 px-1.5 text-center w-12">JK</th>
                  <th className="py-2.5 px-1.5 text-center w-16">Usia</th>
                  <th className="py-2.5 px-1.5 text-center w-11">P1</th>
                  <th className="py-2.5 px-1.5 text-center w-11">P2</th>
                  <th className="py-2.5 px-1.5 text-center w-11">P3</th>
                  <th className="py-2.5 px-1.5 text-center w-11">P4</th>
                  <th className="py-2.5 px-1.5 text-center w-11">P5</th>
                  <th className="py-2.5 px-1.5 text-center w-14 font-black">Rerata</th>
                  <th className="py-2.5 px-2 text-center w-16">Literasi</th>
                  <th className="py-2.5 px-2 text-center w-16">Catatan</th>
                  <th className="py-2.5 px-2 text-center w-14">Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 bg-white">
                {allProfiles.map((p, idx) => {
                  const s = p.student;
                  const isRedFlag = p.has_any_red_flag;
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isRedFlag ? "bg-rose-50/30" : idx % 2 === 1 ? "bg-stone-50/30" : ""
                      }`}
                    >
                      <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-stone-700 font-semibold text-[11px]">
                        {s.registration_no}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-stone-900">
                        <span>{s.full_name}</span>
                        {s.nickname && (
                          <span className="text-stone-500 font-normal ml-1 text-[11px]">
                            ({s.nickname})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-1.5 text-center text-stone-600 font-medium text-[11px]">
                        {s.gender}
                      </td>
                      <td className="py-2 px-1.5 text-center text-stone-600 text-[11px]">
                        {calculateAge(s.birth_date)}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-stone-700 text-[11px]">
                        {p.pos_scores[1] !== null ? p.pos_scores[1].toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-stone-700 text-[11px]">
                        {p.pos_scores[2] !== null ? p.pos_scores[2].toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-stone-700 text-[11px]">
                        {p.pos_scores[3] !== null ? p.pos_scores[3].toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-stone-700 text-[11px]">
                        {p.pos_scores[4] !== null ? p.pos_scores[4].toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono text-stone-700 text-[11px]">
                        {p.pos_scores[5] !== null ? p.pos_scores[5].toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-1.5 text-center font-mono font-black text-stone-900 text-[11px]">
                        {p.overall_score !== null ? p.overall_score.toFixed(1) : "-"}
                      </td>
                      <td className="py-2 px-2 text-center text-[10px]">
                        {p.reading_level ? (
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              p.reading_level === "L1" || p.reading_level === "L2"
                                ? "bg-clay-100 text-clay-900"
                                : "bg-sage-100 text-sage-900"
                            }`}
                          >
                            {p.reading_level}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-[10px]">
                        {isRedFlag ? (
                          <span className="font-bold px-1.5 py-0.5 rounded bg-clay-100 text-clay-900">
                            Pendampingan
                          </span>
                        ) : (
                          <span className="text-sage-700 font-semibold">Sesuai Harapan</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-stone-900 text-[11px]">
                        {p.placement?.assigned_class || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ringkasan Rekomendasi Pedagogis Guru */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 break-inside-avoid items-stretch">
          {/* Card Literasi (Warm Clay Theme) */}
          <div className="bg-[#FAF4F0] p-4.5 rounded-2xl ring-1 ring-clay-200/70 shadow-xs flex flex-col justify-between space-y-2.5 h-full">
            <h3 className="text-xs font-bold text-clay-950 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen weight="light" size={16} className="text-clay-700" />
              <span>Pembagian Kategori Belajar Membaca</span>
            </h3>
            <div className="space-y-1.5 flex-1">
              <p className="text-[11px] text-clay-900/90 leading-relaxed">
                <strong>Kategori A ({recommendationPackage.tarl.groupA.students.length} anak):</strong> Fokus pada pengenalan bentuk huruf dan bunyinya, kartu bergambar konkret, dan latihan memegang pensil.
              </p>
              <p className="text-[11px] text-clay-900/90 leading-relaxed">
                <strong>Kategori B ({recommendationPackage.tarl.groupB.students.length} anak):</strong> Pojok baca mandiri dengan buku cerita bertingkat dan penyusunan kata sederhana.
              </p>
            </div>
          </div>

          {/* Card MPLS (Muted Sage Theme) */}
          <div className="bg-sage-50/70 p-4.5 rounded-2xl ring-1 ring-sage-200/70 shadow-xs flex flex-col justify-between space-y-2.5 h-full">
            <h3 className="text-xs font-bold text-sage-950 uppercase tracking-wide flex items-center gap-1.5">
              <GraduationCap weight="light" size={16} className="text-sage-700" />
              <span>Masa Pengenalan Lingkungan Sekolah (MPLS)</span>
            </h3>
            <div className="space-y-1.5 flex-1">
              <p className="text-[11px] text-sage-900/90 leading-relaxed">
                <strong>Minggu 1:</strong> Adaptasi emosional, pengenalan lingkungan fisik kelas & toilet, serta pembiasaan adab antre dan kemandirian diri.
              </p>
              <p className="text-[11px] text-sage-900/90 leading-relaxed">
                <strong>Minggu 2:</strong> Permainan eksplorasi fisik di halaman, penyepakatan aturan kelas ramah anak, dan bermain bersama tanpa tes tertulis.
              </p>
            </div>
          </div>
        </section>

        {/* Lembar Tanda Tangan Pengesahan (Editable Sebelum Cetak) */}
        <footer className="pt-6 border-t border-stone-300 mt-6 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-0 text-center text-xs break-inside-avoid">
          <div>
            <p className="text-stone-500 font-medium">Koordinator Tim Asesor Observasi</p>
            <div className="h-16 flex items-end justify-center">
              <div className="group flex items-center justify-center gap-0.5">
                <span className="font-bold text-stone-900">(</span>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  className="font-bold text-stone-900 underline text-center bg-transparent border-b border-dashed border-stone-300 hover:border-stone-500 focus:border-sage-600 focus:bg-amber-50/50 rounded px-1.5 transition-colors outline-none print:border-none print:p-0 min-w-[180px]"
                  title="Klik untuk mengubah nama koordinator tim asesor"
                  placeholder="Nama Koordinator"
                />
                <span className="font-bold text-stone-900">)</span>
                <NotePencil
                  weight="light"
                  size={12}
                  className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0"
                />
              </div>
            </div>
            <div className="group flex items-center justify-center gap-1 mt-0.5">
              <input
                type="text"
                value={schoolUnit}
                onChange={(e) => setSchoolUnit(e.target.value)}
                className="text-[10px] text-stone-400 text-center bg-transparent border-b border-dashed border-transparent hover:border-stone-300 focus:border-sage-600 focus:bg-amber-50/50 rounded px-1 transition-colors outline-none print:border-none print:p-0"
                title="Klik untuk mengubah nama unit/sekolah"
                placeholder="Unit Sekolah"
              />
            </div>
          </div>

          <div>
            <p className="text-stone-500 font-medium">Mengetahui, Kepala Sekolah</p>
            <div className="h-16 flex items-end justify-center">
              <div className="group flex items-center justify-center gap-0.5">
                <span className="font-bold text-stone-900">(</span>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="font-bold text-stone-900 underline text-center bg-transparent border-b border-dashed border-stone-300 hover:border-stone-500 focus:border-sage-600 focus:bg-amber-50/50 rounded px-1.5 transition-colors outline-none print:border-none print:p-0 min-w-[200px]"
                  title="Klik untuk mengubah nama kepala sekolah"
                  placeholder="Nama Kepala Sekolah"
                />
                <span className="font-bold text-stone-900">)</span>
                <NotePencil
                  weight="light"
                  size={12}
                  className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0"
                />
              </div>
            </div>
            <div className="group flex items-center justify-center gap-1 mt-0.5">
              <span className="text-[10px] text-stone-400">NIP.</span>
              <input
                type="text"
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                className="text-[10px] text-stone-400 text-left bg-transparent border-b border-dashed border-transparent hover:border-stone-300 focus:border-sage-600 focus:bg-amber-50/50 rounded px-1 transition-colors outline-none print:border-none print:p-0 w-36"
                title="Klik untuk mengubah NIP kepala sekolah"
                placeholder="Nomor NIP"
              />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

