"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback, useMemo } from "react";
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

  // Print orientation setting: default to portrait A4
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  // Editable institution & signature state
  const [foundationName, setFoundationName] = useState(
    "Yayasan Nurun Najah"
  );
  const [schoolName, setSchoolName] = useState("SD Islam An Najah");
  const [coordinatorName, setCoordinatorName] = useState("Tim Asesor PPDB Fase A");
  const [schoolUnit, setSchoolUnit] = useState("SD Islam An Najah");
  const [principalName, setPrincipalName] = useState("Wida Mawaddah, S. Pd., Gr.");
  const [principalNip, setPrincipalNip] = useState("-");
  const [showSettings, setShowSettings] = useState(false);

  const loadBatchReport = useCallback(async () => {
    try {
      const [res, schRes] = await Promise.all([
        fetch(`/api/reports/batch/${batchId}`),
        fetch("/api/school"),
      ]);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
      if (schRes.ok) {
        const schJson = await schRes.json();
        const p = schJson.data;
        if (p) {
          if (p.foundation_name) setFoundationName(p.foundation_name);
          if (p.school_name) {
            setSchoolName(p.school_name);
            setSchoolUnit(p.school_name);
          }
          if (p.principal_name) setPrincipalName(p.principal_name);
          if (p.principal_nip) setPrincipalNip(p.principal_nip);
        }
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

  const allProfiles = useMemo(() => {
    if (!data) return [];
    if (data.profiles && data.profiles.length > 0) return data.profiles;
    const pkg = data.recommendationPackage;
    return [
      ...pkg.tarl.groupA.students,
      ...pkg.tarl.groupB.students,
      ...pkg.tarl.unassessed,
    ];
  }, [data]);

  // Dynamically verify if Pos 5 has any data
  const hasPos5 = useMemo(() => {
    if (!data) return false;
    if (data.posAverages[5] && data.posAverages[5] > 0) return true;
    return allProfiles.some(
      (p) => p.pos_scores[5] !== null && p.pos_scores[5] !== undefined
    );
  }, [data, allProfiles]);

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

  const formattedDate = batch.batch_date
    ? new Date(batch.batch_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tahun Ajaran 2026/2027";

  const posAverageItems = [
    { pos: 1, label: "Sosio-Emosi & Adab", score: posAverages[1] },
    { pos: 2, label: "Motorik Kasar & Halus", score: posAverages[2] },
    { pos: 3, label: "Kognitif & Logika", score: posAverages[3] },
    { pos: 4, label: "Bahasa & Literasi", score: posAverages[4] },
    ...(hasPos5 ? [{ pos: 5, label: "Sosial & Kolaborasi", score: posAverages[5] }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#EDECE8] py-6 px-3 sm:px-6 print:min-h-0 print:bg-white print:p-0">
      {/* ─── Embedded Print Isolation & Exact Margins ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 8mm 8mm 10mm 8mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #FFFFFF !important;
            color: #1E2E24 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden on Print) */}
      <div className="max-w-5xl mx-auto mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => router.back()}
          className="px-3.5 py-2 rounded-xl bg-white text-stone-800 text-xs font-bold shadow-xs hover:bg-stone-50 transition-colors flex items-center gap-1.5 ring-1 ring-stone-200/80 self-start cursor-pointer"
        >
          <ArrowLeft weight="light" size={15} />
          <span>Kembali ke Portal Guru</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Orientation Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl ring-1 ring-stone-200/80 text-xs font-bold text-stone-700">
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] ${
                orientation === "portrait"
                  ? "bg-[#1E2E24] text-white shadow-2xs"
                  : "hover:bg-stone-100 text-stone-700"
              }`}
              title="Cetak format A4 Potrait (Tegak)"
            >
              Potrait A4
            </button>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[11px] ${
                orientation === "landscape"
                  ? "bg-[#1E2E24] text-white shadow-2xs"
                  : "hover:bg-stone-100 text-stone-700"
              }`}
              title="Cetak format A4 Lanskap (Lebar / Ledger)"
            >
              Lanskap A4
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 rounded-xl bg-white text-stone-800 text-xs font-bold shadow-xs hover:bg-stone-50 transition-colors flex items-center gap-1.5 ring-1 ring-stone-200/80 cursor-pointer"
          >
            <NotePencil weight="light" size={14} className="text-stone-600" />
            <span>{showSettings ? "Tutup Form KOP" : "Kustom KOP & TTD"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#1E2E24] hover:bg-[#152219] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
              <NotePencil weight="light" size={17} className="text-stone-700" />
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
                placeholder="Contoh: Yayasan Nurun Najah"
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 ring-1 ring-stone-200/80 font-medium"
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
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  setSchoolUnit(e.target.value);
                }}
                placeholder="Contoh: SD Islam An Najah"
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 ring-1 ring-stone-200/80 font-medium"
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
                placeholder="Contoh: Wida Mawaddah, S. Pd., Gr."
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 ring-1 ring-stone-200/80 font-medium"
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
                className="w-full h-9 px-3 rounded-xl text-xs bg-[#FAF9F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 ring-1 ring-stone-200/80 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Printable Sheet */}
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-7 md:p-8 rounded-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] print:shadow-none print:ring-0 print:p-0 print:max-w-none print:rounded-none">
        {/* Kop Surat Resmi */}
        <header className="border-b-2 border-stone-800 pb-3.5 mb-4 print:block print:pb-2.5 print:mb-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 print:flex-row print:items-start">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl bg-[#1E2E24] text-white flex items-center justify-center flex-shrink-0 shadow-xs print:w-10 print:h-10 print:rounded-xl"
                style={{ backgroundColor: "#1E2E24", color: "#FFFFFF" }}
              >
                <Leaf weight="fill" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {foundationName} · {schoolName}
                </p>
                <h1 className="text-base sm:text-lg print:text-base font-black text-stone-900 uppercase tracking-tight">
                  Rekapitulasi Observasi Kesiapan Belajar Calon Siswa
                </h1>
                <p className="text-xs print:text-[10px] text-stone-600 font-medium">
                  Asesmen Diagnostik &amp; Diferensiasi Pembelajaran Deep Learning SD · kalamula: Memandu Pembelajaran, Memetakan Potensi
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0 print:text-right">
              <span
                className="inline-block px-3 py-1 bg-stone-100 text-stone-900 text-xs print:text-[11px] font-black rounded-lg shadow-2xs mb-1 print:shadow-none print:border print:border-stone-300"
                style={{ backgroundColor: "#F5F5F4", color: "#1C1917" }}
              >
                {batch.batch_name}
              </span>
              <p className="text-[11px] print:text-[10px] text-stone-500 font-medium">{formattedDate}</p>
            </div>
          </div>
        </header>

        {/* Ringkasan Eksekutif Gelombang */}
        <section className="mb-4 print-break-inside-avoid">
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 mb-3">
            <div
              className="bg-stone-50 p-3 rounded-xl ring-1 ring-stone-200/80 print:p-2 print:rounded-lg"
              style={{ backgroundColor: "#F9F9F8" }}
            >
              <div className="flex items-center justify-between text-stone-700 mb-0.5">
                <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider">Total Siswa</span>
                <Users weight="bold" size={14} />
              </div>
              <p className="text-lg print:text-base font-black text-stone-950">{totalStudents} Siswa</p>
              <p className="text-[10px] print:text-[9px] text-stone-600 mt-0.5">{evaluatedCount} Selesai Diobservasi</p>
            </div>

            <div
              className="bg-[#FAF4F0] p-3 rounded-xl ring-1 ring-orange-200/70 print:p-2 print:rounded-lg"
              style={{ backgroundColor: "#FAF4F0" }}
            >
              <div className="flex items-center justify-between text-[#B85627] mb-0.5">
                <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider">Kategori Literasi A</span>
                <BookOpen weight="bold" size={14} />
              </div>
              <p className="text-lg print:text-base font-black text-stone-950">
                {recommendationPackage.tarl.groupA.students.length} Siswa
              </p>
              <p className="text-[10px] print:text-[9px] text-stone-600 mt-0.5">Pra-Literasi (L1 / L2)</p>
            </div>

            <div
              className="bg-[#F0F5F2] p-3 rounded-xl ring-1 ring-emerald-200/70 print:p-2 print:rounded-lg"
              style={{ backgroundColor: "#F0F5F2" }}
            >
              <div className="flex items-center justify-between text-[#2E6B4D] mb-0.5">
                <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider">Kategori Literasi B</span>
                <Books weight="bold" size={14} />
              </div>
              <p className="text-lg print:text-base font-black text-stone-950">
                {recommendationPackage.tarl.groupB.students.length} Siswa
              </p>
              <p className="text-[10px] print:text-[9px] text-stone-600 mt-0.5">Penguatan Membaca (L3 / L4)</p>
            </div>

            <div
              className="bg-[#FAF0E8] p-3 rounded-xl ring-1 ring-amber-200/80 print:p-2 print:rounded-lg"
              style={{ backgroundColor: "#FAF0E8" }}
            >
              <div className="flex items-center justify-between text-[#B85627] mb-0.5">
                <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider">Sinyal Pendampingan</span>
                <Warning weight="bold" size={14} />
              </div>
              <p className="text-lg print:text-base font-black text-stone-950">
                {recommendationPackage.redFlagIntervention.students.length} Siswa
              </p>
              <p className="text-[10px] print:text-[9px] text-stone-600 mt-0.5">Pendampingan Afektif Transisi</p>
            </div>
          </div>

          {/* Rerata Skor Capaian Gelombang */}
          <div className="bg-stone-50/90 p-3 rounded-xl ring-1 ring-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 print:p-2 print:rounded-lg print:shadow-none">
            <div className="flex items-center gap-2">
              <ChartBar weight="bold" size={16} className="text-stone-700" />
              <span className="text-xs print:text-[10px] font-bold text-stone-900 uppercase tracking-wide">
                Rerata Skor Capaian Gelombang (Skala 1.0 s.d. 3.0):
              </span>
            </div>
            <div
              className={`grid grid-cols-2 ${
                hasPos5 ? "sm:grid-cols-5 print:grid-cols-5" : "sm:grid-cols-4 print:grid-cols-4"
              } gap-2 text-center text-xs print:text-[10px] flex-1 max-w-2xl`}
            >
              {posAverageItems.map((p) => (
                <div
                  key={p.pos}
                  className="bg-white px-2 py-1 rounded-lg shadow-2xs ring-1 ring-stone-200/60 print:shadow-none print:ring-stone-300"
                >
                  <span className="text-[9px] print:text-[8.5px] text-stone-500 block truncate">{p.label}</span>
                  <span className="font-black text-stone-900 text-xs print:text-[11px]">
                    {p.score > 0 ? p.score.toFixed(2) : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabel Lengkap Rekapitulasi Siswa */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs print:text-[10.5px] font-bold uppercase tracking-wider text-stone-900">
              Daftar Rinci Skor Observasi Calon Siswa ({allProfiles.length} Anak)
            </h2>
            <span className="text-[10px] print:text-[9px] text-stone-500 italic">
              Skala: 1.0 = Perlu Bimbingan · 2.0 = Mulai Terbiasa · 3.0 = Mandiri
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Tabel Rekapitulasi Skor Siswa"
            className="overflow-x-auto print:overflow-visible rounded-xl ring-1 ring-stone-200/80 shadow-xs print:ring-1 print:ring-stone-300 print:shadow-none"
          >
            <table className="w-full text-left border-collapse text-xs print:text-[9.5px]">
              <thead className="print:table-header-group">
                <tr className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[11px] print:text-[9.5px]">
                  <th className="py-2 px-1.5 text-center w-7 print:w-6">No</th>
                  <th className="py-2 px-2 w-28 print:w-24 whitespace-nowrap">No. Reg</th>
                  <th className="py-2 px-2 min-w-[140px] print:min-w-0">Nama Lengkap</th>
                  <th className="py-2 px-1 text-center w-9 print:w-7">JK</th>
                  <th className="py-2 px-1.5 text-center w-18 print:w-16 whitespace-nowrap">Usia</th>
                  <th className="py-2 px-1 text-center w-10 print:w-8" title="Pos 1: Sosio-Emosi & Adab">P1</th>
                  <th className="py-2 px-1 text-center w-10 print:w-8" title="Pos 2: Motorik Kasar & Halus">P2</th>
                  <th className="py-2 px-1 text-center w-10 print:w-8" title="Pos 3: Kognitif & Logika">P3</th>
                  <th className="py-2 px-1 text-center w-10 print:w-8" title="Pos 4: Bahasa & Literasi">P4</th>
                  {hasPos5 && (
                    <th className="py-2 px-1 text-center w-10 print:w-8" title="Pos 5: Sosial & Kolaborasi">P5</th>
                  )}
                  <th className="py-2 px-1.5 text-center w-12 print:w-10 font-black">Rerata</th>
                  <th className="py-2 px-1.5 text-center w-16 print:w-12 whitespace-nowrap">Literasi</th>
                  <th className="py-2 px-2 text-center w-24 print:w-20 whitespace-nowrap">Catatan</th>
                  <th className="py-2 px-1.5 text-center w-14 print:w-11">Kelas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 bg-white">
                {allProfiles.map((p, idx) => {
                  const s = p.student;
                  const isRedFlag = p.has_any_red_flag;
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-stone-50/70 transition-colors print:break-inside-avoid ${
                        isRedFlag ? "bg-rose-50/40" : idx % 2 === 1 ? "bg-stone-50/40" : ""
                      }`}
                    >
                      <td className="py-1.5 px-1.5 text-center text-stone-500 font-mono text-[11px] print:text-[9.5px]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2 font-mono text-stone-700 font-semibold text-[11px] print:text-[9.5px] whitespace-nowrap">
                        {s.registration_no}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-stone-900 print:text-[9.5px]">
                        <span>{s.full_name}</span>
                        {s.nickname && (
                          <span className="text-stone-500 font-normal ml-1 text-[11px] print:text-[9px]">
                            ({s.nickname})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-center text-stone-600 font-medium text-[11px] print:text-[9.5px]">
                        {s.gender}
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-stone-600 text-[11px] print:text-[9.5px] whitespace-nowrap">
                        {calculateAge(s.birth_date)}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-stone-700 text-[11px] print:text-[9.5px]">
                        {p.pos_scores[1] !== null && p.pos_scores[1] !== undefined ? p.pos_scores[1].toFixed(1) : "-"}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-stone-700 text-[11px] print:text-[9.5px]">
                        {p.pos_scores[2] !== null && p.pos_scores[2] !== undefined ? p.pos_scores[2].toFixed(1) : "-"}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-stone-700 text-[11px] print:text-[9.5px]">
                        {p.pos_scores[3] !== null && p.pos_scores[3] !== undefined ? p.pos_scores[3].toFixed(1) : "-"}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-stone-700 text-[11px] print:text-[9.5px]">
                        {p.pos_scores[4] !== null && p.pos_scores[4] !== undefined ? p.pos_scores[4].toFixed(1) : "-"}
                      </td>
                      {hasPos5 && (
                        <td className="py-1.5 px-1 text-center font-mono text-stone-700 text-[11px] print:text-[9.5px]">
                          {p.pos_scores[5] !== null && p.pos_scores[5] !== undefined ? p.pos_scores[5].toFixed(1) : "-"}
                        </td>
                      )}
                      <td className="py-1.5 px-1.5 text-center font-mono font-black text-stone-900 text-[11px] print:text-[9.5px]">
                        {p.overall_score !== null && p.overall_score !== undefined ? p.overall_score.toFixed(1) : "-"}
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-[10px] print:text-[9px] whitespace-nowrap">
                        {p.reading_level ? (
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] print:text-[9px] ${
                              p.reading_level === "L1" || p.reading_level === "L2"
                                ? "bg-[#F9E6DC] text-[#B85627]"
                                : "bg-[#E4EFE9] text-[#2E5442]"
                            }`}
                            style={{
                              backgroundColor: p.reading_level === "L1" || p.reading_level === "L2" ? "#F9E6DC" : "#E4EFE9",
                              color: p.reading_level === "L1" || p.reading_level === "L2" ? "#B85627" : "#2E5442",
                            }}
                          >
                            {p.reading_level}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[10px] print:text-[9px] whitespace-nowrap">
                        {isRedFlag ? (
                          <span
                            className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] print:text-[9px]"
                            style={{ backgroundColor: "#FEF3C7", color: "#78350F" }}
                          >
                            Pendampingan
                          </span>
                        ) : (
                          <span
                            className="font-semibold text-emerald-700 text-[10px] print:text-[9px]"
                            style={{ color: "#047857" }}
                          >
                            Sesuai Harapan
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-bold text-stone-900 text-[11px] print:text-[9.5px]">
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
        <section className="mb-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3.5 print:gap-3 print-break-inside-avoid items-stretch">
          {/* Card Literasi (Warm Clay Theme) */}
          <div
            className="bg-[#FAF4F0] p-3.5 rounded-xl ring-1 ring-orange-200/70 shadow-xs flex flex-col justify-between space-y-2 h-full print:p-2.5 print:rounded-lg print:shadow-none"
            style={{ backgroundColor: "#FAF4F0" }}
          >
            <h3 className="text-xs print:text-[10px] font-bold text-[#B85627] uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen weight="bold" size={15} className="text-[#B85627]" />
              <span>Pembagian Kategori Belajar Membaca</span>
            </h3>
            <div className="space-y-1 flex-1 text-[11px] print:text-[9.5px] text-stone-800 leading-snug">
              <p>
                <strong>Kategori A ({recommendationPackage.tarl.groupA.students.length} anak):</strong> Fokus pada pengenalan bentuk huruf dan bunyinya (fonik dasar), kartu bergambar konkret, dan latihan motorik halus jemari.
              </p>
              <p>
                <strong>Kategori B ({recommendationPackage.tarl.groupB.students.length} anak):</strong> Pojok baca mandiri dengan buku cerita bertingkat dan pembiasaan menyusun kata-kata sederhana.
              </p>
            </div>
          </div>

          {/* Card MPLS (Muted Sage Theme) */}
          <div
            className="bg-[#F0F5F2] p-3.5 rounded-xl ring-1 ring-emerald-200/70 shadow-xs flex flex-col justify-between space-y-2 h-full print:p-2.5 print:rounded-lg print:shadow-none"
            style={{ backgroundColor: "#F0F5F2" }}
          >
            <h3 className="text-xs print:text-[10px] font-bold text-[#2E6B4D] uppercase tracking-wide flex items-center gap-1.5">
              <GraduationCap weight="bold" size={15} className="text-[#2E6B4D]" />
              <span>Masa Pengenalan Lingkungan Sekolah (MPLS)</span>
            </h3>
            <div className="space-y-1 flex-1 text-[11px] print:text-[9.5px] text-stone-800 leading-snug">
              <p>
                <strong>Minggu 1:</strong> Adaptasi emosional, orientasi tata letak kelas &amp; toilet, pembiasaan adab antre, dan kemandirian meletakkan barang pribadi di loker.
              </p>
              <p>
                <strong>Minggu 2:</strong> Permainan eksplorasi gerak dasar di halaman, penyepakatan kesepakatan kelas ramah anak, dan kolaborasi kelompok tanpa tes tertulis.
              </p>
            </div>
          </div>
        </section>

        {/* Lembar Tanda Tangan Pengesahan (Editable Sebelum Cetak) */}
        <footer className="pt-4 border-t border-stone-300 mt-4 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-0 text-center text-xs print:text-[10.5px] print-break-inside-avoid print:grid print:pt-3 print:mt-3">
          <div>
            <p className="text-stone-600 font-medium">Koordinator Tim Asesor Observasi</p>
            <div className="h-14 flex items-end justify-center">
              <div className="group flex items-center justify-center gap-0.5">
                <span className="font-bold text-stone-900">(</span>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  className="font-bold text-stone-900 underline text-center bg-transparent border-b border-dashed border-stone-300 hover:border-stone-500 focus:border-stone-600 focus:bg-amber-50/50 rounded px-1.5 transition-colors outline-none print:hidden min-w-[180px]"
                  title="Klik untuk mengubah nama koordinator tim asesor"
                  placeholder="Nama Koordinator"
                />
                <span className="hidden print:inline-block font-bold text-stone-900 underline min-w-[160px] text-center">
                  {coordinatorName || "Koordinator Tim Asesor"}
                </span>
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
                className="text-[10px] text-stone-500 text-center bg-transparent border-b border-dashed border-transparent hover:border-stone-300 focus:border-stone-600 focus:bg-amber-50/50 rounded px-1 transition-colors outline-none print:hidden"
                title="Klik untuk mengubah nama unit/sekolah"
                placeholder="Unit Sekolah"
              />
              <span className="hidden print:block text-[10px] text-stone-600 text-center">
                {schoolUnit || "SD Islam An Najah"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-stone-600 font-medium">Mengetahui, Kepala Sekolah</p>
            <div className="h-14 flex items-end justify-center">
              <div className="group flex items-center justify-center gap-0.5">
                <span className="font-bold text-stone-900">(</span>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="font-bold text-stone-900 underline text-center bg-transparent border-b border-dashed border-stone-300 hover:border-stone-500 focus:border-stone-600 focus:bg-amber-50/50 rounded px-1.5 transition-colors outline-none print:hidden min-w-[200px]"
                  title="Klik untuk mengubah nama kepala sekolah"
                  placeholder="Nama Kepala Sekolah"
                />
                <span className="hidden print:inline-block font-bold text-stone-900 underline min-w-[180px] text-center">
                  {principalName || "Kepala Sekolah"}
                </span>
                <span className="font-bold text-stone-900">)</span>
                <NotePencil
                  weight="light"
                  size={12}
                  className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex-shrink-0"
                />
              </div>
            </div>
            <div className="group flex items-center justify-center gap-1 mt-0.5">
              <span className="text-[10px] text-stone-500">NIP.</span>
              <input
                type="text"
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                className="text-[10px] text-stone-500 text-left bg-transparent border-b border-dashed border-transparent hover:border-stone-300 focus:border-stone-600 focus:bg-amber-50/50 rounded px-1 transition-colors outline-none print:hidden w-36"
                title="Klik untuk mengubah NIP kepala sekolah"
                placeholder="Nomor NIP"
              />
              <span className="hidden print:inline-block text-[10px] text-stone-600 text-left">
                {principalNip || "-"}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
