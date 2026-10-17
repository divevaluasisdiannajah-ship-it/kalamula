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
    focus: "Kemandirian berpisah, merapikan barang bawaan di loker, dan kesantunan mengantre",
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
    focus: "Keseimbangan meniti papan titian, melompat 2 kaki, dan lempar-tangkap bola",
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
    pos_name: "Kematangan Kognitif & Numerasi Dasar",
    pos_description: "Observasi kemampuan berpikir logis, pola, perbandingan, dan pemecahan masalah",
    focus: "Klasifikasi atribut, melanjutkan pola berulang, dan pemecahan masalah sederhana",
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
    focus: "Menyimak cerita lisan, komunikasi ide, pincer grasp, dan tahap kesiapan membaca",
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
    focus: "Bermain kooperatif, berbagi mainan/snack, empati, dan antusiasme belajar",
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

  // Filter students by selected group (or blank dummy placeholders if no students)
  const groupStudents = useMemo(() => {
    if (selectedGroup === "blank") {
      return [null, null, null, null, null];
    }
    const filtered = students.filter((s) => s.observation_group === selectedGroup);
    // Pad to 5 slots for clean matrix columns
    const result: (Student | null)[] = [...filtered];
    while (result.length < 5) {
      result.push(null);
    }
    return result.slice(0, 5);
  }, [students, selectedGroup]);

  // Selected student for single format
  const currentSingleStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || (students.length > 0 ? students[0] : null);
  }, [students, selectedStudentId]);

  // Active indicators for current view
  // If Super Observer: Pos 1, 3, 4, 5 combined!
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

  // Red flags for single format or matrix
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

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] py-4 sm:py-6 px-2 sm:px-6 print:bg-white print:p-0 print:min-h-0 font-sans">
      {/* ─── Embedded Print Stylesheet (Strict A4 Layout) ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${orientation === "landscape" ? "A4 landscape" : "A4 portrait"};
            margin: 5mm 6mm 5mm 6mm;
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
      <div className="max-w-[940px] mx-auto mb-4 space-y-3 print-hidden-nav">
        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] px-3 py-1.5 text-xs font-bold rounded-full border border-[#E8E2D8] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="mdi mdi-arrow-left text-base" />
              <span>Kembali</span>
            </button>

            {/* Pos & Super Observer Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[1, 2, 3, 4, 5].map((pos) => {
                const isActive = !isSuperObserver && pos === posNumber;
                return (
                  <button
                    key={pos}
                    onClick={() => router.push(`/reports/rubric/${pos}${selectedStudentId ? `?student_id=${selectedStudentId}` : ""}`)}
                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
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
                onClick={() => router.push(`/reports/rubric/so`)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  isSuperObserver
                    ? "bg-[#486B5A] text-white shadow-xs"
                    : "bg-[#E4EFE9] text-[#486B5A] hover:bg-[#D4E6DC] border border-[#CBE0D4]"
                }`}
              >
                <i className="mdi mdi-eye-check-outline text-sm" />
                <span>Super Observer (Pos 1, 3, 4, 5)</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#B85627] hover:bg-[#A34B21] text-white px-4 py-1.5 text-xs font-extrabold rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <i className="mdi mdi-printer text-base" />
              <span>Cetak A4</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Format Selection & Group Filter */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Format Mode: Matrix vs Single */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8E2D8]">
              <button
                onClick={() => setPrintFormat("matrix")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printFormat === "matrix"
                    ? "bg-[#486B5A] text-white shadow-2xs"
                    : "text-[#565C58] hover:bg-[#FAF8F5]"
                }`}
              >
                <i className="mdi mdi-table-large" />
                <span>Matriks Kelompok (4-5 Anak)</span>
              </button>
              <button
                onClick={() => setPrintFormat("single")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  printFormat === "single"
                    ? "bg-[#486B5A] text-white shadow-2xs"
                    : "text-[#565C58] hover:bg-[#FAF8F5]"
                }`}
              >
                <i className="mdi mdi-card-account-details-outline" />
                <span>Detail Per Siswa</span>
              </button>
            </div>

            {/* Filter Kelompok (Untuk Matrix) */}
            {printFormat === "matrix" && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#565C58] text-[11px]">Pilih Kelompok:</span>
                {["Kelompok 1", "Kelompok 2", "Kelompok 3", "blank"].map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroup(grp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      selectedGroup === grp
                        ? "bg-[#EFE7D6] text-[#7D5327] border-[#DDD0B8]"
                        : "bg-white text-[#565C58] border-[#E8E2D8] hover:bg-[#EFECE4]"
                    }`}
                  >
                    {grp === "blank" ? "Formulir Kosong" : grp}
                  </button>
                ))}
              </div>
            )}

            {/* Pilih Siswa (Untuk Single) */}
            {printFormat === "single" && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#565C58] text-[11px]">Siswa:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-white border border-[#CBD5D0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#22352B] outline-none"
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

        {/* Guidance Banner */}
        <div className="bg-[#E4EFE9] border border-[#CBE0D4] rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-[#486B5A]">
          <div className="flex items-center gap-2">
            <i className={`mdi ${isSuperObserver ? "mdi-eye-check-outline" : "mdi-clipboard-list-outline"} text-lg`} />
            <span className="font-bold">
              {isSuperObserver ? (
                <>Lembar Terpadu Super Observer (Pos 1, 3, 4, 5) — Pemantauan kontinyu kelompok & interaksi santun</>
              ) : (
                <>Lembar Lapangan Pos {posNumber}: {DEFAULT_CONFIGS[posNumber]?.pos_name}</>
              )}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#787F7A]">
            12 Menit/Pos • Skala 1 (BM) s.d. 4 (MK)
          </span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ─── A4 PRINT SHEET (LEMBAR OBSERVASI FISIK RESMI KALAMULA) ──── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      <div className="a4-rubric-sheet max-w-[940px] mx-auto bg-white rounded-2xl shadow-sm p-4 sm:p-6 print:p-0 print:border-none print:shadow-none text-[#22352B] leading-tight text-[8.5pt] font-sans">
        
        {/* ─── 1. Kop Surat & Identitas ─── */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-[#486B5A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D67443] text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs print:border print:border-[#D67443]">
              <i className="mdi mdi-leaf" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-extrabold text-[#22352B] tracking-tight leading-none">
                  kalamula
                </span>
                <span className="text-[9.5pt] font-bold text-[#486B5A] uppercase tracking-wider">
                  • Instrumen Observasi Asesmen Diagnostik Kesiapan Belajar
                </span>
              </div>
              <p className="text-[7.5pt] text-[#565C58] mt-0.5">
                SDIT An-Najah • Pemetaan 6 Fondasi Transisi PAUD-SD Berbasis Standar Kemendikbudristek
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[8.5pt] text-white print:border ${
              isSuperObserver ? "bg-[#486B5A] print:border-[#486B5A]" : "bg-[#B85627] print:border-[#B85627]"
            }`}>
              {isSuperObserver ? "SUPER OBSERVER (POS 1, 3, 4, 5)" : `POS OBSERVASI ${posNumber}`}
            </span>
            <p className="text-[7.5pt] text-[#787F7A] mt-0.5 font-mono">{currentDateFormatted}</p>
          </div>
        </div>

        {/* ─── 2. Header Info Pos & Kelompok ─── */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between gap-2 text-[8pt]">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[#787F7A] uppercase text-[7pt] font-bold block leading-none">FOKUS OBSERVASI</span>
              <span className="font-extrabold text-[#22352B] text-[8.5pt]">
                {isSuperObserver
                  ? "Pendampingan Kelompok Berkelanjutan di Pos 1, 3, 4, 5 (Melewati Pos 2)"
                  : DEFAULT_CONFIGS[posNumber]?.pos_name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {printFormat === "matrix" ? (
              <div className="text-right">
                <span className="text-[#787F7A] uppercase text-[7pt] font-bold block leading-none">KELOMPOK</span>
                <span className="font-bold text-[#7D5327] bg-[#EFE7D6] px-2 py-0.5 rounded border border-[#DDD0B8]">
                  {selectedGroup === "blank" ? "Formulir Lapangan (Kosong)" : selectedGroup}
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[#787F7A] uppercase text-[7pt] font-bold block leading-none">SISWA OBSERVASI</span>
                <span className="font-bold text-[#22352B]">
                  {currentSingleStudent ? `${currentSingleStudent.full_name} (${currentSingleStudent.nickname})` : "............................"}
                </span>
              </div>
            )}

            <div className="text-right pl-2 border-l border-[#E8E2D8]">
              <span className="text-[#787F7A] uppercase text-[7pt] font-bold block leading-none">DURASI SESI</span>
              <span className="font-extrabold text-[#486B5A]">
                {isSuperObserver ? "4 x 12 Mnt (Total 48 Mnt)" : "12 Menit"}
              </span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ─── FORMAT A: MATRIKS KELOMPOK (1 Lembar untuk 4-5 Anak) ────── */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {printFormat === "matrix" && (
          <div className="space-y-2">
            <div className="border border-[#CBD5D0] rounded-lg overflow-hidden">
              <table className="w-full text-left text-[8pt] border-collapse">
                <thead>
                  <tr className="bg-[#E4EFE9] text-[#22352B] font-extrabold border-b border-[#CBD5D0]">
                    <th className="py-1.5 px-2 w-[34%]">
                      Indikator Asesmen & Pondasi Rujukan
                    </th>
                    {groupStudents.map((st, idx) => (
                      <th
                        key={idx}
                        className="py-1.5 px-1.5 w-[13.2%] border-l border-[#CBD5D0] text-center align-top bg-[#F4F8F5]"
                      >
                        <div className="text-[7pt] text-[#486B5A] uppercase font-bold leading-none">
                          Siswa {idx + 1}
                        </div>
                        <div className="font-bold text-[#22352B] text-[8pt] truncate mt-0.5">
                          {st ? st.nickname || st.full_name.split(" ")[0] : `.................`}
                        </div>
                        <div className="text-[6.5pt] text-[#787F7A] font-mono leading-none mt-0.5">
                          {st ? `${st.registration_no} • ${st.gender}` : `[ ] L  [ ] P`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E8E2D8]">
                  {activeIndicators.map((ind, idx) => {
                    const fMeta = ind.foundation ? FOUNDATION_LABELS[ind.foundation] : null;

                    return (
                      <tr key={ind.id} className={idx % 2 === 1 ? "bg-[#FAF8F5]/40" : "bg-white"}>
                        {/* Kolom Indikator */}
                        <td className="py-1 px-2 align-middle">
                          <div className="flex items-start gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-[7pt] flex-shrink-0 mt-0.5">
                              {ind.id}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-[#22352B] text-[8pt] leading-tight">
                                  {ind.label}
                                </span>
                                {fMeta && (
                                  <span className={`text-[6.5pt] font-extrabold px-1 py-0.2 rounded border ${fMeta.badgeBg} ${fMeta.badgeText}`}>
                                    {fMeta.short}
                                  </span>
                                )}
                              </div>
                              <span className="text-[7pt] text-[#565C58] block leading-tight mt-0.5">
                                {ind.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 5 Kolom Siswa */}
                        {groupStudents.map((st, sIdx) => {
                          const ev = st ? evaluations[`${st.id}_${ind.pos}`] : null;
                          let sScore: ScoreValue | null = null;
                          if (ev) {
                            try {
                              const sJson = JSON.parse(ev.scores_json || "{}");
                              sScore = sJson[ind.id] || null;
                            } catch {}
                          }

                          return (
                            <td
                              key={sIdx}
                              className="py-1 px-1 border-l border-[#CBD5D0] align-middle text-center"
                            >
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4].map((s) => {
                                  const isSelected = sScore === s;
                                  return (
                                    <span
                                      key={s}
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[7.5pt] font-extrabold ${
                                        isSelected
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
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Khusus Pos 4 atau Super Observer: Baris Tingkat Membaca */}
                  {(posNumber === 4 || isSuperObserver) && (
                    <tr className="bg-[#FAF4EB]">
                      <td className="py-1.5 px-2 align-middle">
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-[#7D5327] text-white flex items-center justify-center font-extrabold text-[7pt] flex-shrink-0 mt-0.5">
                            <i className="mdi mdi-book-open-page-variant-outline text-[7pt]" />
                          </span>
                          <div>
                            <span className="font-extrabold text-[#7D5327] text-[8pt]">
                              Tingkat Kemampuan Membaca (L1 - L4)
                            </span>
                            <span className="text-[6.5pt] text-[#787F7A] block leading-none">
                              L1: Simbol • L2: Huruf/Bunyi • L3: Suku Kata • L4: Kalimat
                            </span>
                          </div>
                        </div>
                      </td>

                      {groupStudents.map((st, sIdx) => {
                        const ev = st ? evaluations[`${st.id}_4`] : null;
                        const rLevel = ev?.reading_level || null;

                        return (
                          <td
                            key={sIdx}
                            className="py-1 px-1 border-l border-[#CBD5D0] align-middle text-center"
                          >
                            <div className="flex items-center justify-center gap-0.5">
                              {(["L1", "L2", "L3", "L4"] as ReadingLevel[]).map((rl) => {
                                const isSel = rLevel === rl;
                                return (
                                  <span
                                    key={rl}
                                    className={`px-1 py-0.5 rounded text-[6.5pt] font-extrabold ${
                                      isSel
                                        ? "bg-[#7D5327] text-white"
                                        : "border border-[#DDD0B8] text-[#7D5327] bg-white"
                                    }`}
                                  >
                                    {rl}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Baris Catatan Perhatian Khusus / Red Flag */}
                  <tr className="bg-[#FDF7F4]">
                    <td className="py-1.5 px-2 align-middle">
                      <div className="flex items-center gap-1.5">
                        <i className="mdi mdi-alert-outline text-[#B85627] text-sm" />
                        <span className="font-extrabold text-[#8C3713] text-[8pt]">
                          Perhatian Khusus / Sinyal Adaptif
                        </span>
                      </div>
                      <span className="text-[6.5pt] text-[#787F7A] block leading-none mt-0.5">
                        Centang bila teramati: cemas berlebih / speech delay / agresif
                      </span>
                    </td>

                    {groupStudents.map((st, sIdx) => {
                      const ev = st ? evaluations[`${st.id}_${posNumber}`] : null;
                      let hasRf = false;
                      if (ev?.red_flags_json) {
                        try {
                          const rfObj = JSON.parse(ev.red_flags_json);
                          hasRf = Object.values(rfObj).some(Boolean);
                        } catch {}
                      }

                      return (
                        <td
                          key={sIdx}
                          className="py-1 px-1 border-l border-[#CBD5D0] align-middle text-center"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className={`w-3.5 h-3.5 rounded border text-[7pt] flex items-center justify-center font-bold ${
                              hasRf ? "bg-[#B85627] text-white border-[#B85627]" : "border-[#8C3713]/50 bg-white"
                            }`}>
                              {hasRf ? "✓" : ""}
                            </span>
                            <span className="text-[6.5pt] text-[#8C3713] font-bold">
                              {hasRf ? "Ada Sinyal" : "[ ] Aman"}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Baris Catatan Anekdot Lapangan per Anak */}
                  <tr>
                    <td className="py-2 px-2 align-top bg-[#FAF8F5]">
                      <div className="flex items-center gap-1.5">
                        <i className="mdi mdi-pencil-outline text-[#486B5A] text-sm" />
                        <span className="font-extrabold text-[#22352B] text-[8pt]">
                          Catatan Anekdot Lapangan
                        </span>
                      </div>
                      <span className="text-[6.5pt] text-[#787F7A] block mt-0.5">
                        Tulis respon spontan, kata santun, interaksi kawan
                      </span>
                    </td>

                    {groupStudents.map((st, sIdx) => {
                      const ev = st ? evaluations[`${st.id}_${posNumber}`] : null;
                      const note = ev?.anecdotal_note || "";

                      return (
                        <td
                          key={sIdx}
                          className="py-1.5 px-1.5 border-l border-[#CBD5D0] align-top text-[7pt] text-[#22352B] h-14 bg-white"
                        >
                          {note ? (
                            <p className="italic leading-snug line-clamp-3">&ldquo;{note}&rdquo;</p>
                          ) : (
                            <div className="h-full space-y-2.5 pt-1">
                              <div className="border-b border-dashed border-[#DDD7CE] h-2" />
                              <div className="border-b border-dashed border-[#DDD7CE] h-2" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Skala Keterangan & Pengesahan */}
            <div className="grid grid-cols-12 gap-2 pt-1 border-t border-[#CBD5D0] items-center text-[7.5pt]">
              <div className="col-span-8 text-[#565C58] space-y-0.5">
                <p>
                  <strong className="text-[#22352B]">Skala Skor:</strong> 1 = Belum Muncul (BM) • 2 = Mulai Berkembang (MB) • 3 = Mulai Mandiri (MM) • 4 = Membudaya/Konsisten (MK)
                </p>
                <p className="text-[7pt] text-[#787F7A]">
                  *Rotasi 12 Menit: Pos 1 (Kedatangan) → Pos 2 (Motorik) → Pos 3 (Kognitif) → Pos 4 (Bahasa) → Pos 5 (Bermain/Snack).
                </p>
              </div>

              <div className="col-span-4 text-center">
                <span className="text-[7pt] text-[#787F7A] block">Guru Pengamat Lapangan</span>
                <div className="h-6 flex items-end justify-center">
                  <span className="font-bold text-[#22352B] underline text-[8pt]">
                    ( ............................................................ )
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ─── FORMAT B: DETAIL PER SISWA (Full Deskriptor Rubrik) ──────── */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {printFormat === "single" && (
          <div className="space-y-2.5">
            {/* Kotak Identitas Siswa */}
            <div className="border border-[#E8E2D8] rounded-xl p-2.5 bg-[#FAF8F5]/60 text-[8pt]">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[7pt] uppercase font-bold text-[#787F7A] block leading-none">Nama Siswa</span>
                  <span className="font-bold text-[#22352B] mt-0.5 block truncate">
                    {currentSingleStudent?.full_name || "...................................................."}
                  </span>
                </div>
                <div>
                  <span className="text-[7pt] uppercase font-bold text-[#787F7A] block leading-none">Panggilan & Usia</span>
                  <span className="font-bold text-[#22352B] mt-0.5 block">
                    {currentSingleStudent ? `"${currentSingleStudent.nickname}"` : "........................"}
                  </span>
                </div>
                <div>
                  <span className="text-[7pt] uppercase font-bold text-[#787F7A] block leading-none">No. Reg / JK / Kelompok</span>
                  <span className="font-mono font-bold text-[#22352B] mt-0.5 block">
                    {currentSingleStudent ? `${currentSingleStudent.registration_no} • ${currentSingleStudent.gender} • ${currentSingleStudent.observation_group || "-"}` : "PPDB-2026-..... • [ ] L [ ] P"}
                  </span>
                </div>
                <div>
                  <span className="text-[7pt] uppercase font-bold text-[#787F7A] block leading-none">Guru Pengamat</span>
                  <span className="font-bold text-[#22352B] mt-0.5 block">
                    {isSuperObserver ? "Super Observer Lapangan" : `Evaluator Pos ${posNumber}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Detail Rubrik */}
            <div className="border border-[#CBD5D0] rounded-xl overflow-hidden">
              <table className="w-full text-left text-[8pt] border-collapse">
                <thead>
                  <tr className="bg-[#E4EFE9] text-[#22352B] font-extrabold border-b border-[#CBD5D0]">
                    <th className="py-1.5 px-2 w-[24%]">Indikator Observasi</th>
                    <th className="py-1.5 px-2 w-[18%]">1 — Belum Muncul (BM)</th>
                    <th className="py-1.5 px-2 w-[18%]">2 — Bimbingan (MB)</th>
                    <th className="py-1.5 px-2 w-[18%]">3 — Mandiri (MM)</th>
                    <th className="py-1.5 px-2 w-[18%]">4 — Konsisten (MK)</th>
                    <th className="py-1.5 px-1.5 w-[4%] text-center">Skor</th>
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
                        <td className="py-1.5 px-2 align-top">
                          <div className="flex items-start gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#B85627] text-white flex items-center justify-center font-extrabold text-[7pt] flex-shrink-0 mt-0.5">
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

                        <td className={`py-1.5 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 1 ? "bg-[#FCEEEF] font-bold text-[#B83A35]" : ""}`}>
                          {ind.score_descriptors["1"] || "-"}
                        </td>
                        <td className={`py-1.5 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 2 ? "bg-[#F9E6DC] font-bold text-[#8C3713]" : ""}`}>
                          {ind.score_descriptors["2"] || "-"}
                        </td>
                        <td className={`py-1.5 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 3 ? "bg-[#E4EFE9] font-bold text-[#486B5A]" : ""}`}>
                          {ind.score_descriptors["3"] || "-"}
                        </td>
                        <td className={`py-1.5 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 4 ? "bg-[#D6E6DC] font-bold text-[#22352B]" : ""}`}>
                          {ind.score_descriptors["4"] || "-"}
                        </td>

                        <td className="py-1.5 px-1 align-middle text-center">
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
            <div className="grid grid-cols-2 gap-2 text-[8pt]">
              {/* Membaca */}
              {(posNumber === 4 || isSuperObserver) && (
                <div className="border border-[#CBD5D0] rounded-xl p-2 bg-[#FAF4EB]">
                  <span className="font-extrabold text-[#7D5327] block text-[8pt] mb-1">
                    Tingkat Kemampuan Membaca (Centang salah satu)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {READING_LEVEL_OPTIONS.map((rl) => (
                      <div key={rl.level} className="bg-white p-1 rounded border border-[#DDD0B8] flex items-center gap-1.5">
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
              <div className={`border border-[#F1CFC0] rounded-xl p-2 bg-[#FDF7F4] ${!(posNumber === 4 || isSuperObserver) ? "col-span-2" : ""}`}>
                <span className="font-extrabold text-[#8C3713] block text-[8pt] mb-1">
                  Sinyal Perhatian Khusus / Pendampingan
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {activeRedFlags.slice(0, 4).map((rf) => (
                    <div key={rf.id} className="bg-white/80 p-1 rounded border border-[#F1CFC0]/60 flex items-center gap-1.5 text-[7pt]">
                      <span className="w-3.5 h-3.5 rounded border border-[#8C3713]/60 flex items-center justify-center font-bold">
                        [ ]
                      </span>
                      <span className="truncate">{rf.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Catatan Anekdot */}
            <div className="border border-[#CBD5D0] rounded-xl p-2.5 bg-white text-[8pt]">
              <span className="font-extrabold text-[#22352B] block text-[8pt] mb-1">
                Catatan Anekdot Pengamatan Guru:
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
