"use client";
export const runtime = 'edge';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FOUNDATION_LABELS } from "@/types";
import type { FoundationNumber } from "@/types";

export default function CompleteAssessmentGuidePage() {
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>("all");
  const [configs, setConfigs] = useState<Record<number, any>>({});
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cfgRes, schRes, tchRes] = await Promise.all([
          fetch("/api/configs"),
          fetch("/api/school"),
          fetch("/api/teachers"),
        ]);

        if (cfgRes.ok) {
          const json = await cfgRes.json();
          const list = json.data || [];
          const map: Record<number, any> = {};
          list.forEach((c: any) => {
            if (c.pos_number && c.is_active) {
              map[c.pos_number] = {
                ...c,
                indicators:
                  typeof c.indicators_json === "string"
                    ? JSON.parse(c.indicators_json)
                    : c.indicators_json || [],
                red_flags:
                  typeof c.red_flags_json === "string"
                    ? JSON.parse(c.red_flags_json)
                    : c.red_flags_json || [],
              };
            }
          });
          setConfigs(map);
          setIsSynced(true);
        }

        if (schRes.ok) {
          const schJson = await schRes.json();
          setSchoolProfile(schJson.data);
        }

        if (tchRes.ok) {
          const tchJson = await tchRes.json();
          setTeachers(tchJson.data || []);
        }
      } catch {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Helper to get evaluators for a specific pos
  const getEvaluatorNames = (pos: number, fallback: string) => {
    const evList = teachers.filter((t) => t.is_evaluator && t.evaluator_pos === pos);
    if (evList.length > 0) {
      return evList.map((t) => t.name).join(" & ");
    }
    return fallback;
  };

  // Helper to format foundation badge
  const getFoundationLabel = (fNum: number | undefined) => {
    if (!fNum) return "Fondasi PAUD-SD";
    const meta = FOUNDATION_LABELS[fNum as FoundationNumber];
    if (meta) {
      return `Fondasi ${fNum} • ${meta.short}`;
    }
    return `Fondasi ${fNum}`;
  };

  // Static meta for each pos
  const posMetaList = [
    {
      pos: 1,
      code: "SO",
      badgeTitle: "SO • SUPER OBSERVER",
      badgeBg: "bg-[#284034] text-white",
      defaultName: "Karakter dan Dinamika Sosial",
      defaultDesc: "Observasi longitudinal mendampingi kedatangan, adab barang, ketertiban transisi rotasi 3 pos, regulasi diri saat kesulitan, berbagi alat main, hingga snack & bermain bebas.",
      defaultEvaluator: "Ahmad Furqoni, S. Pd (SO 1) & Novia Permatasari, S. Pd (SO 2)",
      taskModel: "Pengamat Longitudinal (Mengikuti Rotasi Siswa)",
      duration: "Sepanjang Sesi Observasi (08.00 – 09.00)",
      sopSteps: [
        "SO 1 mendampingi kelompok dari Titik Awal (kedatangan, adab sepatu) menuju pos observasi dan mengawal transisi rotasi.",
        "SO 2 mengamati adab antrean, kemandirian menaruh barang di loker, dan regulasi emosi saat berpisah dari orang tua.",
        "Mengamati reaksi anak saat menghadapi tantangan atau kesulitan di pos, serta dinamika bermain bersama dan berbagi saat snack.",
        "Jika anak mengalami kecemasan perpisahan, berikan waktu adaptasi 5–10 menit sebelum mencatat skor final. Catat keunikan perilaku pada catatan anekdot.",
      ],
    },
    {
      pos: 2,
      code: "POS A",
      badgeTitle: "POS A • MOTORIK KASAR",
      badgeBg: "bg-[#7D5327] text-white",
      defaultName: "Pos Motorik Kasar & Koordinasi Fisik",
      defaultDesc: "Observasi ketangkasan fisik, keseimbangan meniti papan titian, melompat 2 kaki bersamaan, dan koordinasi mata-tangan tangkap-lempar bola.",
      defaultEvaluator: "Rifky Delsandi Rifai, S. Pd",
      taskModel: "Penguji Motorik Ruangan + Escort (Jemput & Antar Siswa)",
      duration: "12 Menit per Rotasi Kelompok",
      sopSteps: [
        "Evaluator menyambut kelompok siswa di area terbuka/ruang motorik dengan senyum ramah dan mengajak pemanasan gerak ringan 1–2 menit.",
        "Mengamati ketangkasan anak meniti papan titian kayu serta mendarat seimbang saat melompat 2 kaki.",
        "Menguji koordinasi mata-tangan melalui lempar-tangkap bola berjarak 1,5 meter secara bergantian dan bertahap.",
        "Perhatikan tanda-tanda kelemahan tonus otot (hipotonia) atau kecemasan vestibular ekstrem untuk dicatat sebagai red flag jika ditemukan.",
      ],
    },
    {
      pos: 3,
      code: "POS B",
      badgeTitle: "POS B • KOGNITIF & BERHITUNG",
      badgeBg: "bg-[#2E6B4D] text-white",
      defaultName: "Kognitif & Berhitung",
      defaultDesc: "Observasi pemilahan atribut objek, pola deret berulang (patterning), number sense & subitasi kuantitas konkret, serta pemetaan hafalan surat pendek / doa.",
      defaultEvaluator: "Shalma Ruhail Maldova, S. Pd",
      taskModel: "Penguji Stasioner (Tetap di Dalam Ruangan)",
      duration: "12 Menit per Rotasi Kelompok",
      sopSteps: [
        "Siswa duduk melingkar di meja aktivitas; evaluator memperagakan kartu bentuk/warna dan deret balok secara menyenangkan.",
        "Minta anak mengelompokkan benda berdasarkan atribut (warna/bentuk) dan melanjutkan pola berurutan (AB-AB / AABB).",
        "Amati kepekaan bilangan (subitasi kuantitas konkret 1–10) menggunakan benda nyata tanpa menuntut berhitung matematis formal.",
        "Ajak anak melafalkan surat pendek Al-Qur'an atau doa harian yang dihafal dengan santai tanpa paksaan.",
      ],
    },
    {
      pos: 4,
      code: "POS C",
      badgeTitle: "POS C • BAHASA & PRA-LITERASI",
      badgeBg: "bg-[#36506C] text-white",
      defaultName: "Bahasa, Pra-Literasi & Motorik Halus",
      defaultDesc: "Observasi menyimak read-aloud buku cerita, keberanian komunikasi lisan mengutarakan ide, pemetaan tingkat membaca awal (L1–L4), dan pengenalan huruf hijaiyah / Iqra.",
      defaultEvaluator: "Susmurtiningsih, S. Pd",
      taskModel: "Penguji Stasioner (Tetap di Dalam Ruangan)",
      duration: "12 Menit per Rotasi Kelompok",
      sopSteps: [
        "Evaluator membacakan buku cerita bergambar (read-aloud) selama 3–4 menit dengan intonasi hidup dan ekspresif.",
        "Ajukan 2–3 pertanyaan pemahaman sederhana mengenai isi cerita untuk melihat respons menyimak dan keberanian bicara anak.",
        "Gunakan kartu kata bergambar / kartu tingkat membaca untuk memetakan level pra-literasi (L1: Simbol, L2: Huruf, L3: Suku Kata, L4: Kalimat).",
        "Tunjukkan jilid/kartu Iqra untuk mengamati pengenalan huruf hijaiyah dasar secara rileks.",
        "Amati genggaman pensil saat anak memegang alat tulis (dynamic tripod grasp vs palmar grasp tinju).",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] font-sans print:bg-white print:text-black py-4 sm:py-6 px-2 sm:px-4">
      {/* ─── EMBEDDED PRINT STYLESHEET (ADAPTIVE NON-CUTTING PRINT ENGINE) ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 8.5pt !important;
            line-height: 1.25 !important;
            color: #22352B !important;
            width: 100% !important;
          }
          .print-hidden-toolbar {
            display: none !important;
          }
          .guide-print-section {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .guide-print-section:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Anti-cutting rules: forbid breaking atomic elements in half across pages */
          tr, .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          .guide-card-shadow {
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ─── FLOATING ACTION TOOLBAR (SCREEN ONLY) ─── */}
      <aside
        aria-label="Aksi Panduan Cetak"
        className="print-hidden-toolbar sticky top-2 z-50 max-w-4xl mx-auto bg-white/95 backdrop-blur-md border border-[#E8E2D8] rounded-2xl shadow-md p-3 mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/evaluator"
            className="bg-[#FAF8F5] border border-[#DDD7CE] text-[#22352B] hover:bg-[#EFECE4] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <i className="mdi mdi-arrow-left text-base" />
            <span>Portal Evaluator</span>
          </Link>
          <span className="hidden sm:inline-block w-px h-5 bg-[#E8E2D8]" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E5442]" />
            <span className="text-xs font-extrabold text-[#22352B]">
              Buku Panduan &amp; Rubrik Observasi
            </span>
            {isSynced && (
              <span className="hidden md:inline-flex items-center gap-1 bg-[#E4EFE9] text-[#2E6B4D] px-2 py-0.5 rounded-full text-[10px] font-bold">
                <i className="mdi mdi-check-decagram text-xs" />
                <span>Otomatis Sinkron Admin</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Tampilan per Pos di Layar */}
          <div className="flex items-center bg-[#FAF8F5] border border-[#E8E2D8] p-1 rounded-xl text-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveSectionFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeSectionFilter === "all"
                  ? "bg-[#9B3F18] text-white shadow-2xs"
                  : "text-[#565C58] hover:text-[#22352B]"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveSectionFilter("overview")}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeSectionFilter === "overview"
                  ? "bg-[#9B3F18] text-white shadow-2xs"
                  : "text-[#565C58] hover:text-[#22352B]"
              }`}
            >
              Umum
            </button>
            {[1, 2, 3, 4].map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setActiveSectionFilter(`pos-${pNum}`)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeSectionFilter === `pos-${pNum}`
                    ? "bg-[#9B3F18] text-white shadow-2xs"
                    : "text-[#565C58] hover:text-[#22352B]"
                }`}
              >
                Pos {pNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-[#2E6B4D] hover:bg-[#24543D] text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <i className="mdi mdi-printer text-base" />
            <span>Cetak Dokumen Panduan</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── BAGIAN 1: KETENTUAN UMUM, SKALA PENILAIAN, & TIM EVALUATOR ───── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(activeSectionFilter === "all" || activeSectionFilter === "overview") && (
        <section className="guide-print-section max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug space-y-4">
          {/* Kop Surat Yayasan & Sekolah */}
          <div className="flex items-start gap-3.5 pb-2.5 border-b border-[#22352B]/20">
            <div className="w-11 h-11 rounded-xl bg-[#9B3F18] text-white flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              <i className="mdi mdi-sprout" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#787F7A] leading-tight">
                {schoolProfile?.foundation_name || "YAYASAN NURUN NAJAH"}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight leading-tight">
                {schoolProfile?.school_name || "SD Islam An Najah"}
              </h1>
              <p className="text-[10.5px] sm:text-xs text-[#565C58] mt-0.5 leading-tight">
                NPSN: <span className="font-mono font-bold">{schoolProfile?.npsn || "20109914"}</span> &bull; {schoolProfile?.address || "Jl. SMA 64 RT 008 RW 02, Cipayung, Jakarta Timur, DKI Jakarta 13840"}
              </p>
              <p className="text-[10px] sm:text-[10.5px] text-[#787F7A] mt-0.5 font-mono leading-tight">
                Telp: {schoolProfile?.phone || "085864464420"} &bull; Email: {schoolProfile?.email || "sdislamannajah.cpy@gmail.com"} &bull; Web: observasi.sdiannajah.ai.id
              </p>
            </div>
          </div>

          {/* Dokumen Title */}
          <div className="text-center py-1 space-y-0.5">
            <span className="inline-block bg-[#E4EFE9] text-[#284034] text-[9.5px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
              DOKUMEN RESMI SPMB &bull; TAHUN AJARAN {schoolProfile?.academic_year || "2026/2027"}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#22352B] tracking-tight leading-tight">
              Panduan Operasional &amp; Matriks Rubrik Observasi
            </h2>
            <p className="text-[10.5px] sm:text-xs text-[#565C58] font-normal leading-snug max-w-2xl mx-auto">
              Pedoman Standar Evaluator SPMB SD Islam An Najah Berbasis Transisi PAUD–SD Menyenangkan (6 Fondasi Kemendikbudristek) dengan Skala Capaian 3 Tingkat
            </p>
          </div>

          {/* Section I: Ketentuan Umum & Skala Penilaian */}
          <div className="space-y-2.5 print-avoid-break">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
              <span className="w-5 h-5 rounded-md bg-[#284034] text-white font-black text-[11px] flex items-center justify-center">
                I
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                KETENTUAN UMUM &amp; SKALA PENILAIAN 3 TINGKAT
              </h3>
            </div>

            {/* 3 Skala Capaian */}
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2.5">
              {/* Skor 1 */}
              <div className="bg-[#FAF5F0] border border-[#F1D8C9] rounded-xl p-3 space-y-1 print-avoid-break">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#9B3F18] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    1
                  </span>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-[#9B3F18]">
                    SKOR 1
                  </span>
                </div>
                <h4 className="font-black text-xs text-[#9B3F18] leading-tight">
                  PERLU BIMBINGAN (PB)
                </h4>
                <p className="text-[10px] text-[#565C58] leading-snug">
                  Anak belum menunjukkan indikator yang diharapkan atau membutuhkan bantuan fisik/arahan penuh dari evaluator untuk melakukan aktivitas.
                </p>
              </div>

              {/* Skor 2 */}
              <div className="bg-[#FAF8F2] border border-[#EDE3D0] rounded-xl p-3 space-y-1 print-avoid-break">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#8A641A] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    2
                  </span>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8A641A]">
                    SKOR 2
                  </span>
                </div>
                <h4 className="font-black text-xs text-[#8A641A] leading-tight">
                  BERKEMBANG SESUAI HARAPAN (BSH)
                </h4>
                <p className="text-[10px] text-[#565C58] leading-snug">
                  Anak mampu menampilkan perilaku/tugas dengan bantuan minimal, petunjuk arahan verbal sesekali, atau pembiasaan bertahap.
                </p>
              </div>

              {/* Skor 3 */}
              <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1 print-avoid-break">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2E6B4D] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    3
                  </span>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-[#2E6B4D]">
                    SKOR 3
                  </span>
                </div>
                <h4 className="font-black text-xs text-[#2E6B4D] leading-tight">
                  MANDIRI (M)
                </h4>
                <p className="text-[10px] text-[#565C58] leading-snug">
                  Anak mampu menampilkan perilaku secara konsisten, spontan, percaya diri, dan mandiri tanpa memerlukan bantuan evaluator.
                </p>
              </div>
            </div>

            {/* Box Red Flag Pedoman */}
            <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1 print-avoid-break">
              <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs">
                <i className="mdi mdi-alert-outline text-base" />
                <span>Pedoman Catatan Anekdot &amp; Indikator Peringatan Khusus (Red Flag)</span>
              </div>
              <p className="text-[10.5px] text-[#565C58] leading-relaxed">
                Red Flag bukan vonis ketidaklulusan, melainkan tanda peringatan dini perilaku/fisik yang memerlukan penanganan khusus (individual education plan/IEP), konfirmasi orang tua, atau rujukan psikolog/terapis anak. Evaluator wajib mendokumentasikan konteks pemicu pada kolom Catatan Anekdot Lapangan.
              </p>
            </div>
          </div>

          {/* Section II: Tim Evaluator SPMB Resmi */}
          <div className="space-y-2 print-avoid-break">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E8E2D8]">
              <span className="w-5 h-5 rounded-md bg-[#284034] text-white font-black text-[11px] flex items-center justify-center">
                II
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                TIM EVALUATOR SPMB RESMI &amp; STRUKTUR PENUGASAN
              </h3>
            </div>

            {/* Tabel Tim Evaluator Dinamis */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-[#2E5442] text-white font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">Pos</th>
                    <th className="py-2 px-3 w-1/4">Ruang &amp; Domain Observasi</th>
                    <th className="py-2 px-3 w-1/3">Petugas Evaluator</th>
                    <th className="py-2 px-3">Karakteristik &amp; Model Penugasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[10.5px] leading-snug">
                  {posMetaList.map((meta) => {
                    const cfg = configs[meta.pos];
                    const posTitle = cfg?.pos_name || meta.defaultName;
                    const evalNames = getEvaluatorNames(meta.pos, meta.defaultEvaluator);

                    return (
                      <tr key={meta.pos} className="hover:bg-[#FAF8F5]">
                        <td className="py-2 px-3 font-black text-center text-[#9B3F18]">
                          {meta.pos === 1 ? "SO" : meta.pos}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#22352B]">
                          {posTitle}
                        </td>
                        <td className="py-2 px-3 text-[#565C58]">
                          {evalNames}
                        </td>
                        <td className="py-2 px-3 text-[#565C58]">
                          <strong className="text-[#22352B]">{meta.taskModel}:</strong> {meta.duration}.
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Dokumen Bagian 1 */}
          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A]">
            <span>Dokumen Resmi Panduan Observasi &bull; {schoolProfile?.school_name || "SD Islam An Najah"}</span>
            <span className="font-bold text-[#22352B]">Bagian I &bull; Ketentuan Umum</span>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── BAGIAN 2: MATRIKS RUBRIK PER POS OBSERVASI (DINAMIS 100%) ──── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {posMetaList.map((meta) => {
        const pNum = meta.pos;
        if (activeSectionFilter !== "all" && activeSectionFilter !== `pos-${pNum}`) {
          return null;
        }

        const cfg = configs[pNum];
        const posTitle = cfg?.pos_name || meta.defaultName;
        const posDesc = cfg?.pos_description || meta.defaultDesc;
        const indicators = cfg?.indicators && cfg.indicators.length > 0 ? cfg.indicators : [];
        const redFlags = cfg?.red_flags && cfg.red_flags.length > 0 ? cfg.red_flags : [];
        const evalNames = getEvaluatorNames(pNum, meta.defaultEvaluator);

        return (
          <section
            key={pNum}
            className="guide-print-section max-w-[820px] mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 my-6 print:m-0 print:p-0 print:rounded-none text-[#22352B] leading-snug space-y-4"
          >
            {/* Header Halaman Berulang */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D8] print-avoid-break">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#9B3F18] text-white flex items-center justify-center text-xs shadow-2xs">
                  <i className="mdi mdi-sprout" />
                </div>
                <span className="font-bold text-xs text-[#22352B]">
                  kalamula <span className="text-[#787F7A] font-normal">&bull; {schoolProfile?.school_name || "SD Islam An Najah"}</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#787F7A]">
                Panduan Operasional &amp; Matriks Rubrik Observasi
              </span>
            </div>

            {/* Subheader Banner Pos */}
            <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-3.5 space-y-2 print-avoid-break">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#E8E2D8]">
                <span className="font-black text-xs text-[#9B3F18] uppercase tracking-wide">
                  {meta.badgeTitle}
                </span>
                <span className="text-[11px] font-bold text-[#486B5A]">
                  Durasi: {meta.duration}
                </span>
              </div>
              <h3 className="text-base font-black text-[#22352B] leading-tight">
                {posTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#565C58]">
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">
                    PETUGAS EVALUATOR
                  </span>
                  <span className="font-semibold text-[#22352B]">{evalNames}</span>
                </div>
                <div>
                  <span className="font-bold text-[#22352B] block text-[10.5px] uppercase text-[#787F7A]">
                    MODEL PENUGASAN
                  </span>
                  <span>{meta.taskModel}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565C58] pt-1.5 border-t border-[#E8E2D8]/80 leading-relaxed">
                <strong className="text-[#22352B]">Fokus Domain:</strong> {posDesc}
              </p>
            </div>

            {/* SOP & Alur Teknis di Lapangan */}
            <div className="bg-[#F4F8F5] border border-[#D5E5DB] rounded-xl p-3 space-y-1.5 text-xs text-[#22352B] print-avoid-break">
              <div className="flex items-center gap-1.5 font-black text-xs text-[#284034] uppercase tracking-wide">
                <i className="mdi mdi-clipboard-text-outline text-sm" />
                <span>SOP &amp; ALUR TEKNIS EVALUATOR DI LAPANGAN</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#565C58] leading-snug">
                {meta.sopSteps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#2E5442] text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabel Rubrik Indikator Dinamis */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#E4EFE9] text-[#284034] font-black uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-[34%]">Kode &amp; Indikator dan Fondasi PAUD-SD</th>
                    <th className="py-2.5 px-3 w-[22%]">
                      Perlu Bimbingan<br />
                      <span className="text-[#9B3F18]">Skor 1 (PB)</span>
                    </th>
                    <th className="py-2.5 px-3 w-[22%]">
                      Berkembang Sesuai Harapan<br />
                      <span className="text-[#8A641A]">Skor 2 (BSH)</span>
                    </th>
                    <th className="py-2.5 px-3 w-[22%]">
                      Mandiri<br />
                      <span className="text-[#2E6B4D]">Skor 3 (M)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8] text-[11px] leading-snug">
                  {indicators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#787F7A] italic">
                        Belum ada indikator terkonfigurasi untuk pos ini di Portal Admin.
                      </td>
                    </tr>
                  ) : (
                    indicators.map((ind: any, indIdx: number) => {
                      const desc1 = ind.score_descriptors?.[1] || ind.score_descriptors?.["1"] || "-";
                      const desc2 = ind.score_descriptors?.[2] || ind.score_descriptors?.["2"] || "-";
                      const desc3 = ind.score_descriptors?.[3] || ind.score_descriptors?.["3"] || "-";
                      const foundationText = getFoundationLabel(ind.foundation);

                      return (
                        <tr key={ind.id || indIdx} className="print-avoid-break hover:bg-[#FAF8F5]">
                          <td className="py-2.5 px-3 align-top space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-black text-[#9B3F18] text-[10.5px]">
                                {ind.id || `P${pNum}-${indIdx + 1}`}
                              </span>
                              <span className="text-[9.5px] font-bold text-[#486B5A]">
                                {foundationText}
                              </span>
                            </div>
                            <p className="font-bold text-[#22352B] leading-snug">
                              {ind.label}
                            </p>
                            {ind.description && (
                              <p className="text-[10px] text-[#787F7A] leading-tight">
                                {ind.description}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 align-top text-[#565C58]">
                            {desc1}
                          </td>
                          <td className="py-2.5 px-3 align-top text-[#565C58]">
                            {desc2}
                          </td>
                          <td className="py-2.5 px-3 align-top text-[#565C58]">
                            {desc3}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Tambahan Khusus Pos 4: Rubrik 4 Tingkat Literasi Membaca Awal */}
            {pNum === 4 && (
              <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4 space-y-3 print-avoid-break">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#E8E2D8]">
                  <i className="mdi mdi-book-open-outline text-base text-[#22352B]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#22352B]">
                    RUBRIK 4 TINGKAT LITERASI MEMBACA AWAL (READING LEVEL)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      L1
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-black text-xs text-[#22352B] leading-tight">
                        Tingkat 1: Gambar &amp; Simbol Visual
                      </h5>
                      <p className="text-[10.5px] text-[#565C58] leading-snug">
                        Mampu memaknai gambar konkret dan simbol visual benda sehari-hari, belum mengenal bunyi huruf fonik.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      L2
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-black text-xs text-[#22352B] leading-tight">
                        Tingkat 2: Huruf &amp; Bunyi Fonik
                      </h5>
                      <p className="text-[10.5px] text-[#565C58] leading-snug">
                        Mengenal bentuk huruf kapital/kecil serta bunyi vokal dan konsonan dasar (a-i-u-e-o, b, m, p, s).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      L3
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-black text-xs text-[#22352B] leading-tight">
                        Tingkat 3: Membaca Suku Kata
                      </h5>
                      <p className="text-[10.5px] text-[#565C58] leading-snug">
                        Mampu menggabungkan huruf menjadi suku kata terbuka sederhana (ba-ba, bu-ku, bo-la, ma-ma).
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E2D8] rounded-xl p-3 flex items-start gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-[#2E5442] text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      L4
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-black text-xs text-[#22352B] leading-tight">
                        Tingkat 4: Membaca Kalimat Lancar
                      </h5>
                      <p className="text-[10.5px] text-[#565C58] leading-snug">
                        Mampu membaca kalimat pendek secara lancar dan memahami maksud bacaan tanpa mengeja per huruf.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Kotak Peringatan Khusus (Red Flags) Dinamis */}
            {redFlags.length > 0 && (
              <div className="border border-[#F2C9B8] bg-[#FAF5F2] rounded-xl p-3 space-y-1.5 print-avoid-break">
                <div className="flex items-center gap-1.5 text-[#9B3F18] font-black text-xs uppercase tracking-wider">
                  <i className="mdi mdi-alert-outline text-base" />
                  <span>INDIKATOR PERHATIAN KHUSUS (RED FLAG) {posTitle.toUpperCase()}</span>
                </div>
                <ul className="space-y-1 text-[11px] text-[#565C58] pl-2">
                  {redFlags.map((rf: any, rfIdx: number) => {
                    const rfLabel = typeof rf === "string" ? rf : rf.label || rf.name || "";
                    return (
                      <li key={rfIdx} className="flex items-start gap-1.5">
                        <span className="text-[#9B3F18] font-black">&bull;</span>
                        <span>{rfLabel}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Khusus Pos 4: Pengesahan Tanda Tangan Resmi */}
            {pNum === 4 && (
              <div className="pt-3 space-y-3 print-avoid-break">
                <p className="text-right text-xs text-[#565C58] font-medium pr-4">
                  Jakarta Timur, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="grid grid-cols-2 text-center text-xs pt-2">
                  <div>
                    <p className="text-xs font-semibold text-[#565C58]">Koordinator Tim Evaluator SPMB,</p>
                    <div className="h-12" />
                    <div className="w-56 border-b border-[#22352B] mx-auto mb-1.5" />
                    <p className="font-bold text-xs text-[#22352B]">Ahmad Furqoni, S. Pd</p>
                    <p className="text-[10.5px] text-[#787F7A]">Super Observer 1 &bull; {schoolProfile?.school_name || "SD Islam An Najah"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#565C58]">
                      Mengetahui,<br />Kepala {schoolProfile?.school_name || "SD Islam An Najah"},
                    </p>
                    <div className="h-10" />
                    <div className="w-56 border-b border-[#22352B] mx-auto mb-1.5" />
                    <p className="font-bold text-xs text-[#22352B]">{schoolProfile?.principal_name || "Wida Mawaddah, S. Pd., Gr."}</p>
                    <p className="text-[10.5px] text-[#787F7A]">NIP: {schoolProfile?.principal_nip || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Dinamis per Pos */}
            <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-[10.5px] text-[#787F7A] print-avoid-break">
              <span>Dokumen Resmi Panduan Observasi &bull; {schoolProfile?.school_name || "SD Islam An Najah"}</span>
              <span className="font-bold text-[#22352B]">{posTitle}</span>
            </div>
          </section>
        );
      })}
    </div>
  );
}
