"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Student, AssessmentConfigParsed, ScoreValue, ReadingLevel, Evaluation, FoundationNumber } from "@/types";
import { FOUNDATION_LABELS } from "@/types";

// Default configs lengkap 5 Pos dengan 6 Fondasi Kemendikbudristek
const DEFAULT_CONFIGS: Record<number, {
  pos_name: string;
  pos_description: string;
  focus: string;
  indicators: { id: string; label: string; description: string; foundation?: FoundationNumber; score_descriptors: Record<string, string> }[];
  red_flags: { id: string; label: string; severity?: string }[];
}> = {
  1: {
    pos_name: "Kedatangan, Kemandirian & Kematangan Emosi",
    pos_description: "Observasi saat anak tiba, berpisah dari orang tua, dan interaksi awal",
    focus: "Kedatangan, Kemandirian & Emosi",
    indicators: [
      {
        id: "1.1",
        label: "Berpisah dari orang tua",
        description: "Berpisah dari orang tua dengan tenang tanpa kecemasan ekstrem",
        foundation: 3,
        score_descriptors: {
          "1": "Menangis histeris tidak mau ditinggal",
          "2": "Menangis tapi mau ditinggal setelah dibujuk",
          "3": "Sedikit cemas tapi mandiri masuk kelas",
          "4": "Berpisah dengan tenang dan antusias",
        },
      },
      {
        id: "1.2",
        label: "Kemandirian Menaruh Barang",
        description: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantungkan tas",
        foundation: 5,
        score_descriptors: {
          "1": "Tidak bisa, sepenuhnya butuh bantuan",
          "2": "Bisa dengan banyak bantuan verbal",
          "3": "Bisa dengan sedikit pengingat",
          "4": "Mandiri sempurna dan rapi",
        },
      },
      {
        id: "1.3",
        label: "Kesantunan dan Antrean",
        description: "Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya mengantre",
        foundation: 1,
        score_descriptors: {
          "1": "Tidak menggunakan kata santun dan tidak mau mengantre",
          "2": "Kadang menggunakan kata santun dengan pengingat",
          "3": "Sering menggunakan kata santun secara spontan",
          "4": "Konsisten santun dan sabar mengantre tanpa pengingat",
        },
      },
    ],
    red_flags: [
      { id: "rf-1-1", label: "Tantrum histeris melantai (>10 menit)" },
      { id: "rf-1-2", label: "Panik berlebihan atau serangan panik" },
      { id: "rf-1-3", label: "Perilaku agresif membahayakan (memukul/menggigit)" },
    ],
  },
  2: {
    pos_name: "Motorik Kasar & Koordinasi Fisik",
    pos_description: "Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan",
    focus: "Motorik Kasar & Koordinasi Fisik",
    indicators: [
      {
        id: "2.1",
        label: "Keseimbangan & Koordinasi Tubuh",
        description: "Berjalan lurus, meniti papan titian, dan melompat dengan 2 kaki",
        foundation: 5,
        score_descriptors: {
          "1": "Tidak bisa melakukan salah satu aktivitas",
          "2": "Bisa dengan pegangan/bantuan fisik",
          "3": "Bisa mandiri meski sedikit tidak stabil",
          "4": "Lincah dan koordinasi fisik sangat baik",
        },
      },
      {
        id: "2.2",
        label: "Respons Instruksi & Koordinasi Mata-Tangan",
        description: "Merespons instruksi gerak verbal dan koordinasi tangkap bola",
        foundation: 5,
        score_descriptors: {
          "1": "Tidak merespons instruksi, gagal tangkap bola",
          "2": "Merespons lambat, sering gagal tangkap",
          "3": "Merespons baik, kadang berhasil tangkap",
          "4": "Merespons cepat dan tangkap bola konsisten",
        },
      },
    ],
    red_flags: [
      { id: "rf-2-1", label: "Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)" },
      { id: "rf-2-2", label: "Sering jatuh tanpa sebab yang jelas" },
      { id: "rf-2-3", label: "Tidak bisa melompat dengan 2 kaki" },
    ],
  },
  3: {
    pos_name: "Kematangan Kognitif & Berhitung",
    pos_description: "Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah",
    focus: "Kematangan Kognitif & Berhitung",
    indicators: [
      {
        id: "3.1",
        label: "Klasifikasi & Pola",
        description: "Memilah benda berdasarkan atribut dan melengkapi pola berulang",
        foundation: 4,
        score_descriptors: {
          "1": "Tidak bisa memilah atau mengenali pola",
          "2": "Bisa memilah 1 atribut dengan bantuan",
          "3": "Bisa memilah dan lanjutkan pola sederhana",
          "4": "Mandiri klasifikasi multi-atribut dan pola kompleks",
        },
      },
      {
        id: "3.2",
        label: "Konsep Kuantitas & Problem Solving",
        description: "Memahami banyak/sedikit dan pemecahan masalah (puzzle/balok)",
        foundation: 4,
        score_descriptors: {
          "1": "Belum paham konsep kuantitas",
          "2": "Paham dengan bimbingan konkret",
          "3": "Paham mandiri dan bisa puzzle sederhana",
          "4": "Pemahaman kuat dan selesaikan tantangan mandiri",
        },
      },
    ],
    red_flags: [
      { id: "rf-3-1", label: "Disorientasi spasial berat" },
      { id: "rf-3-2", label: "Tidak memahami hubungan sebab-akibat sederhana" },
      { id: "rf-3-3", label: "Frustrasi ekstrem saat tantangan gagal (meltdown)" },
    ],
  },
  4: {
    pos_name: "Bahasa Lisan, Pra-Literasi & Motorik Halus",
    pos_description: "Observasi kemampuan berbahasa, pra-membaca, dan kontrol motorik halus",
    focus: "Bahasa Lisan & Motorik Halus",
    indicators: [
      {
        id: "4.1",
        label: "Menyimak Cerita Lisan",
        description: "Menyimak dan memahami pesan cerita lisan yang dibacakan (read-aloud)",
        foundation: 2,
        score_descriptors: {
          "1": "Tidak memperhatikan dan tidak bisa jawab pertanyaan",
          "2": "Memperhatikan tapi jawaban tidak relevan",
          "3": "Menyimak baik dan menjawab sebagian besar",
          "4": "Menyimak aktif dan jawab dengan detail",
        },
      },
      {
        id: "4.2",
        label: "Komunikasi Gagasan Lisan",
        description: "Mengomunikasikan gagasan lisan tentang hasil gambarnya",
        foundation: 2,
        score_descriptors: {
          "1": "Tidak bisa menjelaskan gambarnya",
          "2": "Menjelaskan dengan 1-2 kata",
          "3": "Menjelaskan dengan kalimat sederhana",
          "4": "Menjelaskan dengan kalimat lengkap dan rinci",
        },
      },
      {
        id: "4.3",
        label: "Kontrol Motorik Halus",
        description: "Kontrol motorik halus dan genggaman alat tulis fungsional (tripod grasp)",
        foundation: 5,
        score_descriptors: {
          "1": "Genggaman palmar, tidak bisa kontrol",
          "2": "Peralihan ke pincer, kontrol lemah",
          "3": "Pincer/tripod grasp, bisa mewarnai/menulis",
          "4": "Tripod sempurna, presisi dan kontrol tinggi",
        },
      },
    ],
    red_flags: [
      { id: "rf-4-1", label: "Bicara tidak dapat dipahami (speech delay berat)" },
      { id: "rf-4-2", label: "Ekolalia — menirukan kata tanpa makna kontekstual" },
      { id: "rf-4-3", label: "No joint attention — kontak mata absen total" },
      { id: "rf-4-4", label: "Otot tangan sangat lemas, tidak bisa pegang alat tulis" },
    ],
  },
  5: {
    pos_name: "Bermain Bebas, Istirahat & Interaksi Kelompok",
    pos_description: "Observasi interaksi saat bermain bebas, makan snack bersama, dan regulasi emosi kelompok",
    focus: "Bermain Bebas, Istirahat & Interaksi",
    indicators: [
      {
        id: "5.1",
        label: "Bermain Kooperatif & Berbagi",
        description: "Bermain kooperatif, berbagi mainan/makanan, dan berinteraksi sehat",
        foundation: 2,
        score_descriptors: {
          "1": "Menolak bermain bersama, menyendiri total",
          "2": "Bermain paralel (dekat teman tapi tanpa interaksi)",
          "3": "Bermain kooperatif dengan sedikit konflik",
          "4": "Pemimpin alami, mendorong kerjasama tim",
        },
      },
      {
        id: "5.2",
        label: "Regulasi Emosi & Konflik",
        description: "Regulasi emosi saat terjadi perbedaan pendapat atau giliran bermain",
        foundation: 3,
        score_descriptors: {
          "1": "Breakdown total saat ada konflik kecil",
          "2": "Perlu banyak bantuan dewasa untuk regulasi",
          "3": "Bisa regulasi diri dengan sedikit bantuan",
          "4": "Resolusi konflik mandiri dan dewasa",
        },
      },
      {
        id: "5.3",
        label: "Antusiasme & Refleksi Belajar",
        description: "Keceriaan, rasa ingin tahu positif, dan antusiasme menjalani rangkaian kegiatan",
        foundation: 6,
        score_descriptors: {
          "1": "Tampak sangat tertekan atau pasif menolak",
          "2": "Kurang bersemangat, perlu dorongan konstan",
          "3": "Menikmati bermain dan belajar secara wajar",
          "4": "Sangat antusias, ceria, dan bangga",
        },
      },
    ],
    red_flags: [
      { id: "rf-5-1", label: "Extreme social withdrawal — menolak disapa sama sekali" },
      { id: "rf-5-2", label: "Impulsif ekstrem — tidak bisa menunggu giliran" },
      { id: "rf-5-3", label: "Hiperaktif — tidak bisa diam lebih dari 30 detik" },
    ],
  },
};

const READING_LEVEL_OPTIONS: { level: ReadingLevel; name: string; desc: string }[] = [
  { level: "L1", name: "Tingkat 1: Gambar & Simbol", desc: "Mengenal simbol & gambar visual benda konkret sehari-hari." },
  { level: "L2", name: "Tingkat 2: Huruf & Bunyi", desc: "Mengenal bentuk & bunyi huruf vokal serta konsonan dasar." },
  { level: "L3", name: "Tingkat 3: Membaca Suku Kata", desc: "Membaca gabungan suku kata sederhana (bu-ku, bo-la)." },
  { level: "L4", name: "Tingkat 4: Membaca Kalimat Lancar", desc: "Membaca kalimat pendek dengan lancar & memahami arti cerita." },
];

// Sample default students matching the reference mockup
const SAMPLE_STUDENTS = [
  { id: "sample-1", nickname: "Rayyan", full_name: "Rayyan", registration_no: "PPDB-2026-001" },
  { id: "sample-2", nickname: "Rizky", full_name: "Rizky", registration_no: "PPDB-2026-004" },
  { id: "sample-3", nickname: "Alvaro", full_name: "Alvaro", registration_no: "PPDB-2026-007" },
  { id: "sample-4", nickname: "Gibran", full_name: "Gibran", registration_no: "PPDB-2026-010" },
  { id: "sample-5", nickname: "Kenzie", full_name: "Kenzie", registration_no: "PPDB-2026-013" },
];

export default function PosRubricPrintPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route pos slug: '1'..'5' or 'so' (Super Observer)
  const posParam = String(params.pos || "1").toLowerCase();
  const isSuperObserver = posParam === "so" || posParam === "super-observer";
  const posNumber = isSuperObserver ? 1 : Number(posParam) || 1;

  const initialStudentId = searchParams.get("student_id") || "";

  // View modes
  const [printFormat, setPrintFormat] = useState<"matrix" | "single">("matrix");
  const [selectedGroup, setSelectedGroup] = useState<string>("Kelompok 1");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  // Data states
  const [allConfigs, setAllConfigs] = useState<Record<number, AssessmentConfigParsed>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);

  // Fetch configs, students, and evaluations
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch configs
      const cRes = await fetch("/api/configs");
      if (cRes.ok) {
        const cData = await cRes.json();
        const list = cData.data || [];
        const cfgMap: Record<number, AssessmentConfigParsed> = {};
        list.forEach((raw: any) => {
          if (raw.is_active && raw.pos_number) {
            cfgMap[raw.pos_number] = {
              ...raw,
              indicators: typeof raw.indicators_json === "string" ? JSON.parse(raw.indicators_json) : raw.indicators_json,
              red_flags: typeof raw.red_flags_json === "string" ? JSON.parse(raw.red_flags_json) : raw.red_flags_json,
            };
          }
        });
        setAllConfigs(cfgMap);
      }

      // 2. Fetch students
      const sRes = await fetch("/api/students");
      if (sRes.ok) {
        const sData = await sRes.json();
        const stList: Student[] = sData.data || [];
        setStudents(stList);
        if (!selectedStudentId && stList.length > 0) {
          setSelectedStudentId(stList[0].id);
        }
      }

      // 3. Fetch evaluations
      const eRes = await fetch("/api/evaluations");
      if (eRes.ok) {
        const eData = await eRes.json();
        const evList: Evaluation[] = eData.data || [];
        const evMap: Record<string, Evaluation> = {};
        evList.forEach((ev) => {
          evMap[`${ev.student_id}_${ev.pos_number}`] = ev;
        });
        setEvaluations(evMap);
      }
    } catch (err) {
      console.error("Failed to load rubric data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  // Active indicators for current view
  // If Super Observer: Pos 1, 3, 4, 5 combined
  // If Station Evaluator: specific Pos
  const activeIndicators = useMemo(() => {
    if (isSuperObserver) {
      const posList = [1, 3, 4, 5];
      const combined: {
        pos: number;
        id: string;
        label: string;
        description: string;
        foundation?: FoundationNumber;
        score_descriptors: Record<string | number, string>;
      }[] = [];

      posList.forEach((p) => {
        const cfg = allConfigs[p] || DEFAULT_CONFIGS[p];
        if (cfg?.indicators) {
          cfg.indicators.forEach((ind) => {
            combined.push({
              pos: p,
              id: ind.id,
              label: ind.label,
              description: ind.description,
              foundation: ind.foundation,
              score_descriptors: (ind.score_descriptors as unknown as Record<string | number, string>) || {},
            });
          });
        }
      });
      return combined;
    }

    const cfg = allConfigs[posNumber] || DEFAULT_CONFIGS[posNumber] || DEFAULT_CONFIGS[1];
    return (cfg.indicators || []).map((ind) => ({
      pos: posNumber,
      id: ind.id,
      label: ind.label,
      description: ind.description,
      foundation: ind.foundation,
      score_descriptors: (ind.score_descriptors as unknown as Record<string | number, string>) || {},
    }));
  }, [isSuperObserver, posNumber, allConfigs]);

  // Display indicators normalized to exactly 6 slots (matching reference layout 2 cols x 3 rows)
  const displayIndicators = useMemo(() => {
    const list: {
      id: string;
      label: string;
      description: string;
      isPlaceholder?: boolean;
    }[] = [];

    activeIndicators.forEach((ind) => {
      list.push({
        id: ind.id,
        label: ind.label,
        description: ind.description,
        isPlaceholder: false,
      });
    });

    while (list.length < 6) {
      const idx = list.length + 1;
      list.push({
        id: `${idx}`,
        label: `[Indikator ${idx}]`,
        description: `[Deskripsi singkat indikator, maks. 2 baris]`,
        isPlaceholder: true,
      });
    }

    return list.slice(0, 6);
  }, [activeIndicators]);

  // Students for the 5 rows in matrix format
  const displayStudents = useMemo(() => {
    if (selectedGroup === "blank") {
      return [1, 2, 3, 4, 5].map((i) => ({
        id: "",
        nickname: "........................",
        full_name: "................................",
        registration_no: `PPDB-2026-.....`,
      }));
    }

    const filtered = students.filter((s) => s.observation_group === selectedGroup);
    if (filtered.length > 0) {
      const list = [...filtered];
      while (list.length < 5) {
        list.push({
          id: "",
          nickname: "........................",
          full_name: "................................",
          registration_no: `PPDB-2026-00${list.length + 1}`,
        } as Student);
      }
      return list.slice(0, 5);
    }

    // Default sample when group has no students loaded yet (matches reference image)
    return SAMPLE_STUDENTS;
  }, [students, selectedGroup]);

  // Selected student for single format
  const currentSingleStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || (students.length > 0 ? students[0] : null);
  }, [students, selectedStudentId]);

  // Red flags for single format
  const activeRedFlags = useMemo(() => {
    if (isSuperObserver) {
      const posList = [1, 3, 4, 5];
      const combined: { id: string; label: string; pos: number }[] = [];
      posList.forEach((p) => {
        const cfg = allConfigs[p] || DEFAULT_CONFIGS[p];
        if (cfg?.red_flags) {
          cfg.red_flags.forEach((rf) => combined.push({ ...rf, pos: p }));
        }
      });
      return combined;
    }
    const cfg = allConfigs[posNumber] || DEFAULT_CONFIGS[posNumber] || DEFAULT_CONFIGS[1];
    return (cfg.red_flags || []).map((rf) => ({ ...rf, pos: posNumber }));
  }, [isSuperObserver, posNumber, allConfigs]);

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeFocusText = useMemo(() => {
    if (isSuperObserver) {
      return "Super Observer (Pos 1, 3, 4, 5) Terpadu";
    }
    const defaultCfg = DEFAULT_CONFIGS[posNumber];
    const customCfg = allConfigs[posNumber];
    return defaultCfg?.focus || customCfg?.pos_name || "Kedatangan, Kemandirian & Emosi";
  }, [isSuperObserver, posNumber, allConfigs]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] py-4 sm:py-6 px-2 sm:px-6 print:bg-white print:p-0 print:min-h-0 font-sans">
      {/* ─── Embedded Print Stylesheet (Strict A4 Layout) ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${orientation === "landscape" ? "A4 landscape" : "A4 portrait"};
            margin: 6mm 7mm 6mm 7mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            font-size: 8.5pt !important;
            color: #22352B !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden-nav {
            display: none !important;
          }
          .a4-rubric-sheet {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── Top Floating Action Bar (Hidden on Print) ─── */}
      <div className="max-w-[840px] mx-auto mb-4 space-y-2.5 print-hidden-nav">
        {/* Main Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] px-3.5 py-1.5 text-xs font-bold rounded-full border border-[#E8E2D8] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <i className="mdi mdi-chevron-left text-base" />
              <span>Dashboard Admin</span>
            </Link>

            {/* Pos & Super Observer Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[1, 2, 3, 4, 5].map((pos) => {
                const isActive = !isSuperObserver && pos === posNumber;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => router.push(`/reports/rubric/${pos}${selectedStudentId ? `?student_id=${selectedStudentId}` : ""}`)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? "bg-[#B85627] text-white shadow-xs"
                        : "bg-[#FAF8F5] text-[#565C58] hover:bg-[#EFECE4] border border-[#E8E2D8]"
                    }`}
                  >
                    <span>Pos {pos}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => router.push(`/reports/rubric/so`)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  isSuperObserver
                    ? "bg-[#486B5A] text-white shadow-xs"
                    : "bg-[#E4EFE9] text-[#486B5A] hover:bg-[#D4E6DC] border border-[#CBE0D4]"
                }`}
              >
                <i className="mdi mdi-eye-check-outline text-sm" />
                <span>Super Observer</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-[#B85627] hover:bg-[#A34B21] text-white px-5 py-2 text-xs font-extrabold rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <i className="mdi mdi-printer-outline text-base" />
              <span>Cetak Form A4</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Group Filter, Format Mode, Orientation */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown Pemilih Kelompok */}
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#787F7A] text-[11px] uppercase tracking-wider">
                Kelompok:
              </span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-white border border-[#CBE0D4] rounded-xl px-3 py-1.5 text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A] cursor-pointer shadow-2xs"
              >
                <option value="Kelompok 1">Kelompok 1</option>
                <option value="Kelompok 2">Kelompok 2</option>
                <option value="Kelompok 3">Kelompok 3</option>
                <option value="Kelompok 4">Kelompok 4</option>
                <option value="blank">Formulir Kosong</option>
              </select>
            </div>

            {/* Format Mode: Matriks Kelompok vs Detail Siswa */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setPrintFormat("matrix")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printFormat === "matrix"
                    ? "bg-[#486B5A] text-white shadow-2xs"
                    : "text-[#565C58] hover:bg-[#FAF8F5]"
                }`}
              >
                <i className="mdi mdi-table-large" />
                <span>Instrumen Lapangan (5 Siswa)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("single")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printFormat === "single"
                    ? "bg-[#486B5A] text-white shadow-2xs"
                    : "text-[#565C58] hover:bg-[#FAF8F5]"
                }`}
              >
                <i className="mdi mdi-card-account-details-outline" />
                <span>Rubrik Per Siswa</span>
              </button>
            </div>

            {/* Pilih Siswa (Jika Single Mode) */}
            {printFormat === "single" && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#565C58] text-[11px]">Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-white border border-[#CBD5D0] rounded-xl px-2.5 py-1 text-xs font-bold text-[#22352B] outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.nickname}) — {s.observation_group || "Belum ada kelompok"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8E2D8]">
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                orientation === "portrait"
                  ? "bg-[#22352B] text-white"
                  : "text-[#565C58] hover:bg-[#FAF8F5]"
              }`}
            >
              Potret (A4)
            </button>
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                orientation === "landscape"
                  ? "bg-[#22352B] text-white"
                  : "text-[#565C58] hover:bg-[#FAF8F5]"
              }`}
            >
              Lanskap (A4)
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── A4 PRINT SHEET (LEMBAR OBSERVASI FISIK RESMI KALAMULA) ──── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="a4-rubric-sheet max-w-[840px] mx-auto bg-white rounded-3xl shadow-sm border border-[#E8E2D8] p-5 sm:p-7 print:p-0 print:border-none print:shadow-none text-[#22352B] leading-tight text-[8.5pt] font-sans">

        {/* ─── 1. Kop Instrumen Observasi ─── */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#486B5A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D67443] text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-xs print:border print:border-[#D67443]">
              <i className="mdi mdi-leaf" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#22352B] tracking-tight leading-snug">
                Instrumen Observasi Asesmen Diagnostik Kesiapan Belajar
              </h1>
              <p className="text-[10px] text-[#565C58] mt-0.5">
                kalamula &bull; SDIT An-Najah &bull; Pemetaan 6 Fondasi Transisi PAUD–SD Berbasis Standar Kemendikbudristek
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className={`font-extrabold px-3.5 py-1 rounded-full text-[10px] sm:text-xs text-white uppercase tracking-wide inline-block shadow-2xs print:border ${
                isSuperObserver
                  ? "bg-[#486B5A] print:border-[#486B5A]"
                  : "bg-[#B85627] print:border-[#B85627]"
              }`}
            >
              {isSuperObserver ? "SUPER OBSERVER" : `POS OBSERVASI ${posNumber}`}
            </span>
            <p className="text-[9.5px] text-[#787F7A] font-semibold mt-1 text-right">
              {currentDateFormatted}
            </p>
          </div>
        </div>

        {/* ─── 2. Kotak Metadata Observasi (4 Kolom dalam 1 Baris) ─── */}
        <div className="border-[1.5px] border-[#22352B]/75 rounded-2xl grid grid-cols-12 divide-x divide-stone-300 mb-3 bg-white">
          {/* Kolom 1: FOKUS OBSERVASI */}
          <div className="col-span-5 px-3.5 py-2">
            <span className="text-[9px] uppercase font-bold text-[#787F7A] tracking-wider flex items-center gap-1 leading-none">
              <i className="mdi mdi-bullseye-arrow text-xs text-[#787F7A]" />
              <span>FOKUS OBSERVASI</span>
            </span>
            <div className="font-extrabold text-[#22352B] text-xs mt-1 truncate">
              {activeFocusText}
            </div>
          </div>

          {/* Kolom 2: KELOMPOK */}
          <div className="col-span-2 px-3 py-2">
            <span className="text-[9px] uppercase font-bold text-[#787F7A] tracking-wider flex items-center gap-1 leading-none">
              <i className="mdi mdi-account-group-outline text-xs text-[#787F7A]" />
              <span>KELOMPOK</span>
            </span>
            <div className="font-extrabold text-[#22352B] text-xs mt-1 truncate">
              {selectedGroup === "blank" ? "Formulir Kosong" : selectedGroup}
            </div>
          </div>

          {/* Kolom 3: DURASI */}
          <div className="col-span-2 px-3 py-2">
            <span className="text-[9px] uppercase font-bold text-[#787F7A] tracking-wider flex items-center gap-1 leading-none">
              <i className="mdi mdi-timer-outline text-xs text-[#787F7A]" />
              <span>DURASI</span>
            </span>
            <div className="font-extrabold text-[#22352B] text-xs mt-1">
              {isSuperObserver ? "4 x 12 Menit" : "12 Menit"}
            </div>
          </div>

          {/* Kolom 4: NAMA EVALUATOR */}
          <div className="col-span-3 px-3 py-2">
            <span className="text-[9px] uppercase font-bold text-[#787F7A] tracking-wider flex items-center gap-1 leading-none">
              <i className="mdi mdi-account-edit-outline text-xs text-[#787F7A]" />
              <span>NAMA EVALUATOR</span>
            </span>
            <div className="border-b border-stone-400 w-full h-4 mt-1" />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ─── FORMAT A: MATRIKS KELOMPOK (5 Siswa x 6 Indikator) ──────── */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {printFormat === "matrix" && (
          <div className="space-y-3">
            {/* ─── 3. Kotak Panduan Indikator (Grid 2 Kolom x 3 Baris = 6 Indikator) ─── */}
            <div className="border-[1.5px] border-[#22352B]/75 rounded-2xl p-3.5 space-y-2.5 bg-white">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#22352B]">
                <i className="mdi mdi-clipboard-text-outline text-sm text-[#486B5A]" />
                <span>PANDUAN INDIKATOR</span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {/* Kolom Kiri: Indikator 1, 2, 3 */}
                <div className="space-y-2.5">
                  {[1, 2, 3].map((num) => {
                    const ind = displayIndicators[num - 1];
                    const isPlaceholder = !ind || ind.isPlaceholder;
                    return (
                      <div key={num} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#22352B] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 mt-0.5">
                          {num}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-[#22352B] text-[11px] leading-tight">
                            {isPlaceholder ? `[Indikator ${num}]` : ind.label}
                          </div>
                          <div className="text-[9.5px] text-[#565C58] leading-tight mt-0.5">
                            {isPlaceholder ? `[Deskripsi singkat indikator, maks. 2 baris]` : ind.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Kolom Kanan: Indikator 4, 5, 6 */}
                <div className="space-y-2.5">
                  {[4, 5, 6].map((num) => {
                    const ind = displayIndicators[num - 1];
                    const isPlaceholder = !ind || ind.isPlaceholder;
                    return (
                      <div key={num} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#22352B] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 mt-0.5">
                          {num}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-[#22352B] text-[11px] leading-tight">
                            {isPlaceholder ? `[Indikator ${num}]` : ind.label}
                          </div>
                          <div className="text-[9.5px] text-[#565C58] leading-tight mt-0.5">
                            {isPlaceholder ? `[Deskripsi singkat indikator, maks. 2 baris]` : ind.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sinyal Adaptif Notice at bottom of box */}
              <div className="border-t border-stone-200 pt-2 flex items-center gap-1.5 text-[9.5px] text-[#565C58]">
                <i className="mdi mdi-alert-circle-outline text-[#B85627] text-sm flex-shrink-0" />
                <span>
                  <strong>Sinyal adaptif:</strong> centang &ldquo;Perlu perhatian&rdquo; bila teramati cemas berlebih, <em>speech delay</em>, atau agresif.
                </span>
              </div>
            </div>

            {/* ─── 4. Bar Legenda Skor (1 BM – 4 MK) ─── */}
            <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-xl px-4 py-2.5 text-[10px] text-[#22352B] space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="font-extrabold">Skor:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9px]">1</span>
                  <span>Belum Muncul (BM)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9px]">2</span>
                  <span>Mulai Berkembang (MB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9px]">3</span>
                  <span>Mulai Mandiri (MM)</span>
                </span>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9px]">4</span>
                  <span>Membudaya/Konsisten (MK)</span>
                </span>
              </div>
            </div>

            {/* ─── 5. Tabel Utama Observasi (5 Siswa x 6 Kolom Indikator) ─── */}
            <div className="border-[1.5px] border-[#22352B]/85 rounded-2xl overflow-hidden bg-white">
              {/* Header Tabel */}
              <div className="bg-[#F2F7F4] border-b border-[#22352B]/40 flex items-center">
                <div className="w-[26%] px-3 py-2 font-extrabold text-[10px] text-[#22352B] uppercase tracking-wider">
                  SISWA
                </div>
                <div className="w-[74%] grid grid-cols-6 divide-x divide-[#22352B]/20 py-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div key={num} className="text-center">
                      <span className="w-5 h-5 rounded-full bg-[#22352B] text-white inline-flex items-center justify-center font-extrabold text-[10px]">
                        {num}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Baris Siswa (5 Siswa per Lembar) */}
              <div className="divide-y divide-[#22352B]/40">
                {displayStudents.map((st, idx) => {
                  const ev = st.id ? evaluations[`${st.id}_${posNumber}`] : null;
                  let sScores: Record<string, number> = {};
                  if (ev?.scores_json) {
                    try {
                      sScores = JSON.parse(ev.scores_json);
                    } catch {}
                  }
                  let hasRf = false;
                  if (ev?.red_flags_json) {
                    try {
                      const rfObj = JSON.parse(ev.red_flags_json);
                      hasRf = Object.values(rfObj).some(Boolean);
                    } catch {}
                  }
                  const hasAman = Boolean(ev?.is_complete && !hasRf);
                  const note = ev?.anecdotal_note || "";

                  return (
                    <div key={idx} className="bg-white">
                      {/* Sub-baris Atas: Nama Siswa + 6 Kolom Skor (Masing-masing 4 OMR Capsule) */}
                      <div className="flex items-center border-b border-[#22352B]/15">
                        {/* Kolom Kiri: Nomor + Nama & ID */}
                        <div className="w-[26%] px-3 py-2">
                          <div className="font-extrabold text-[#22352B] text-[11px] leading-tight truncate">
                            {idx + 1} {st.nickname || st.full_name}
                          </div>
                          <div className="text-[9px] font-mono text-[#787F7A] mt-0.5">
                            {st.registration_no}
                          </div>
                        </div>

                        {/* Kolom Kanan: 6 Kolom Indikator, masing-masing 4 pill capsule [1] [2] [3] [4] */}
                        <div className="w-[74%] grid grid-cols-6 divide-x divide-[#22352B]/20 py-2">
                          {[1, 2, 3, 4, 5, 6].map((colIdx) => {
                            const ind = displayIndicators[colIdx - 1];
                            const recordedScore = ind && !ind.isPlaceholder ? sScores[ind.id] : null;

                            return (
                              <div key={colIdx} className="flex items-center justify-center gap-0.5 sm:gap-1 px-0.5">
                                {[1, 2, 3, 4].map((score) => {
                                  const isFilled = recordedScore === score;
                                  return (
                                    <span
                                      key={score}
                                      className={`w-3.5 sm:w-4 h-5 rounded-full border-[1.2px] flex items-center justify-center text-[8.5px] font-black transition-colors ${
                                        isFilled
                                          ? "bg-[#22352B] text-white border-[#22352B]"
                                          : "bg-white text-[#22352B] border-[#22352B]/85"
                                      }`}
                                    >
                                      {score}
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sub-baris Bawah: Sinyal Adaptif (Kotak Centang) + Catatan Anekdot (2 Garis Dotted) */}
                      <div className="flex items-start">
                        {/* Kolom Kiri: Sinyal Adaptif */}
                        <div className="w-[26%] px-3 py-2 border-r border-[#22352B]/20">
                          <div className="text-[8.5px] font-extrabold text-[#22352B] uppercase tracking-wider mb-1">
                            Sinyal adaptif
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[9px] text-[#22352B] font-medium">
                              <span
                                className={`w-3 h-3 rounded-[3px] border border-[#22352B] inline-flex items-center justify-center text-[8px] font-bold ${
                                  hasAman ? "bg-[#486B5A] text-white border-[#486B5A]" : "bg-white"
                                }`}
                              >
                                {hasAman ? "✓" : ""}
                              </span>
                              <span>Aman</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-[#22352B] font-medium">
                              <span
                                className={`w-3 h-3 rounded-[3px] border border-[#22352B] inline-flex items-center justify-center text-[8px] font-bold ${
                                  hasRf ? "bg-[#B85627] text-white border-[#B85627]" : "bg-white"
                                }`}
                              >
                                {hasRf ? "✓" : ""}
                              </span>
                              <span>Perlu perhatian</span>
                            </div>
                          </div>
                        </div>

                        {/* Kolom Kanan: Catatan Anekdot (2 Garis Dotted) */}
                        <div className="w-[74%] px-3 py-2">
                          <div className="text-[9px] font-bold text-[#22352B] mb-1">
                            Catatan anekdot:
                          </div>
                          {note ? (
                            <div className="text-[9px] text-[#22352B] italic mb-1 leading-snug">
                              &ldquo;{note}&rdquo;
                            </div>
                          ) : null}
                          <div className="space-y-2 pt-0.5">
                            <div className="border-b border-dotted border-stone-400 h-2.5 w-full" />
                            <div className="border-b border-dotted border-stone-400 h-2.5 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── 6. Footer Rotasi & Tanda Tangan ─── */}
            <div className="flex items-end justify-between pt-2 text-[10px] text-[#22352B]">
              {/* Rotasi 12 Menit */}
              <div className="max-w-md text-[9.5px] leading-relaxed">
                <span className="font-extrabold text-[#22352B]">Rotasi 12 menit: </span>
                <span className={posNumber === 1 && !isSuperObserver ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos 1 Kedatangan
                </span>
                <span className="text-stone-400 mx-1">&rsaquo;</span>
                <span className={posNumber === 2 ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos 2 Motorik
                </span>
                <span className="text-stone-400 mx-1">&rsaquo;</span>
                <span className={posNumber === 3 ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos 3 Kognitif
                </span>
                <span className="text-stone-400 mx-1">&rsaquo;</span>
                <span className={posNumber === 4 ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos 4 Bahasa
                </span>
                <span className="text-stone-400 mx-1">&rsaquo;</span>
                <span className={posNumber === 5 ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos 5 Bermain/Snack
                </span>
                {isSuperObserver && (
                  <div className="mt-0.5 font-bold underline text-[#486B5A]">
                    Super Observer: Memandu Pos 1 &rarr; 3 &rarr; 4 &rarr; 5
                  </div>
                )}
              </div>

              {/* Blok Tanda Tangan */}
              <div className="text-center w-52">
                <div className="font-bold text-[#22352B] text-[10px]">
                  Guru Pengamat Lapangan
                </div>
                <div className="border-b border-stone-400 w-44 mt-8 mx-auto" />
                <div className="text-[8.5px] text-[#787F7A] mt-1">
                  ( nama &amp; tanda tangan )
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ─── FORMAT B: DETAIL PER SISWA (Full Deskriptor Rubrik) ──────── */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {printFormat === "single" && (
          <div className="space-y-3">
            {/* Kotak Identitas Siswa */}
            <div className="border border-[#E8E2D8] rounded-2xl p-3 bg-[#FAF8F5]/70 text-[8.5pt]">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <span className="text-[7.5pt] uppercase font-bold text-[#787F7A] block leading-none">Nama Siswa</span>
                  <span className="font-bold text-[#22352B] mt-1 block truncate">
                    {currentSingleStudent?.full_name || "...................................................."}
                  </span>
                </div>
                <div>
                  <span className="text-[7.5pt] uppercase font-bold text-[#787F7A] block leading-none">Panggilan & Usia</span>
                  <span className="font-bold text-[#22352B] mt-1 block">
                    {currentSingleStudent ? `"${currentSingleStudent.nickname}"` : "........................"}
                  </span>
                </div>
                <div>
                  <span className="text-[7.5pt] uppercase font-bold text-[#787F7A] block leading-none">No. Reg / JK / Kelompok</span>
                  <span className="font-mono font-bold text-[#22352B] mt-1 block">
                    {currentSingleStudent ? `${currentSingleStudent.registration_no} • ${currentSingleStudent.gender} • ${currentSingleStudent.observation_group || "-"}` : "PPDB-2026-..... • [ ] L [ ] P"}
                  </span>
                </div>
                <div>
                  <span className="text-[7.5pt] uppercase font-bold text-[#787F7A] block leading-none">Guru Pengamat</span>
                  <span className="font-bold text-[#22352B] mt-1 block">
                    {isSuperObserver ? "Super Observer Lapangan" : `Evaluator Pos ${posNumber}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Detail Rubrik */}
            <div className="border border-[#CBD5D0] rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left text-[8pt] border-collapse">
                <thead>
                  <tr className="bg-[#E4EFE9] text-[#22352B] font-extrabold border-b border-[#CBD5D0]">
                    <th className="py-2 px-2.5 w-[25%]">Indikator Observasi</th>
                    <th className="py-2 px-2 w-[17%]">1 — Belum Muncul (BM)</th>
                    <th className="py-2 px-2 w-[17%]">2 — Bimbingan (MB)</th>
                    <th className="py-2 px-2 w-[17%]">3 — Mandiri (MM)</th>
                    <th className="py-2 px-2 w-[17%]">4 — Konsisten (MK)</th>
                    <th className="py-2 px-1.5 w-[7%] text-center">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {activeIndicators.map((ind, idx) => {
                    const ev = currentSingleStudent ? evaluations[`${currentSingleStudent.id}_${ind.pos}`] : null;
                    let currentScore: ScoreValue | null = null;
                    if (ev) {
                      try {
                        const sJson = JSON.parse(ev.scores_json || "{}");
                        currentScore = sJson[ind.id] || null;
                      } catch {}
                    }
                    const fMeta = ind.foundation ? FOUNDATION_LABELS[ind.foundation] : null;

                    return (
                      <tr key={ind.id} className={idx % 2 === 1 ? "bg-[#FAF8F5]/50" : "bg-white"}>
                        <td className="py-2 px-2.5 align-top">
                          <div className="flex items-start gap-1.5">
                            <span className="w-4.5 h-4.5 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-[7.5pt] flex-shrink-0 mt-0.5">
                              {ind.id}
                            </span>
                            <div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-[#22352B] leading-tight">{ind.label}</span>
                                {fMeta && (
                                  <span className={`text-[6.5pt] font-extrabold px-1 py-0.2 rounded border ${fMeta.badgeBg} ${fMeta.badgeText}`}>
                                    {fMeta.short}
                                  </span>
                                )}
                              </div>
                              <span className="text-[7pt] text-[#565C58] block mt-0.5 leading-tight">{ind.description}</span>
                            </div>
                          </div>
                        </td>

                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 1 ? "bg-[#FCEEEF] font-bold text-[#B83A35]" : ""}`}>
                          {ind.score_descriptors["1"] || "-"}
                        </td>
                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 2 ? "bg-[#F9E6DC] font-bold text-[#8C3713]" : ""}`}>
                          {ind.score_descriptors["2"] || "-"}
                        </td>
                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 3 ? "bg-[#E4EFE9] font-bold text-[#486B5A]" : ""}`}>
                          {ind.score_descriptors["3"] || "-"}
                        </td>
                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 4 ? "bg-[#D6E6DC] font-bold text-[#22352B]" : ""}`}>
                          {ind.score_descriptors["4"] || "-"}
                        </td>

                        <td className="py-2 px-1 align-middle text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            {[1, 2, 3, 4].map((s) => {
                              const isChosen = currentScore === s;
                              return (
                                <span
                                  key={s}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[7.5pt] font-extrabold ${
                                    isChosen
                                      ? "bg-[#B85627] text-white ring-1 ring-[#B85627]"
                                      : "border border-[#8F9691] text-[#22352B]"
                                  }`}
                                >
                                  {s}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reading Level & Red Flags */}
            <div className="grid grid-cols-2 gap-3 text-[8pt]">
              {/* Membaca */}
              {(posNumber === 4 || isSuperObserver) && (
                <div className="border border-[#CBD5D0] rounded-2xl p-2.5 bg-[#FAF4EB]">
                  <span className="font-extrabold text-[#7D5327] block text-[8pt] mb-1.5 flex items-center gap-1">
                    <i className="mdi mdi-book-open-page-variant-outline" />
                    <span>Tingkat Kemampuan Membaca (Centang salah satu)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {READING_LEVEL_OPTIONS.map((rl) => (
                      <div key={rl.level} className="bg-white p-1.5 rounded-xl border border-[#DDD0B8] flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded border border-[#7D5327] flex items-center justify-center text-[7pt] font-bold">
                          [ ]
                        </span>
                        <div>
                          <span className="font-bold text-[7.5pt] text-[#22352B] block leading-none">{rl.level}: {rl.name.split(":")[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              <div className={`border border-[#F1CFC0] rounded-2xl p-2.5 bg-[#FDF7F4] ${!(posNumber === 4 || isSuperObserver) ? "col-span-2" : ""}`}>
                <span className="font-extrabold text-[#8C3713] block text-[8pt] mb-1.5 flex items-center gap-1">
                  <i className="mdi mdi-alert-outline text-[#B85627]" />
                  <span>Sinyal Perhatian Khusus / Pendampingan</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeRedFlags.slice(0, 4).map((rf) => (
                    <div key={rf.id} className="bg-white/80 p-1.5 rounded-xl border border-[#F1CFC0]/60 flex items-center gap-1.5 text-[7pt]">
                      <span className="w-3.5 h-3.5 rounded border border-[#8C3713]/60 flex items-center justify-center font-bold">
                        [ ]
                      </span>
                      <span className="truncate text-[#22352B] font-medium">{rf.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Catatan Anekdot */}
            <div className="border border-[#CBD5D0] rounded-2xl p-3 bg-white text-[8pt]">
              <span className="font-extrabold text-[#22352B] block text-[8pt] mb-1 flex items-center gap-1">
                <i className="mdi mdi-pencil-outline text-[#486B5A]" />
                <span>Catatan Anekdot Pengamatan Guru:</span>
              </span>
              <div className="space-y-3 pt-1">
                <div className="border-b border-dashed border-[#DDD7CE] h-3" />
                <div className="border-b border-dashed border-[#DDD7CE] h-3" />
              </div>
            </div>

            {/* Pengesahan */}
            <div className="pt-2 border-t border-[#CBD5D0] grid grid-cols-2 text-center text-[8pt]">
              <div>
                <p className="text-[7.5pt] text-[#565C58]">Koordinator Observasi</p>
                <div className="h-6 flex items-end justify-center">
                  <span className="font-bold text-[#22352B] underline text-[8pt]">( Tim PPDB SDIT An-Najah )</span>
                </div>
              </div>
              <div>
                <p className="text-[7.5pt] text-[#565C58]">Guru Pengamat Lapangan</p>
                <div className="h-6 flex items-end justify-center">
                  <span className="font-bold text-[#22352B] underline text-[8pt]">( ............................................................ )</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
