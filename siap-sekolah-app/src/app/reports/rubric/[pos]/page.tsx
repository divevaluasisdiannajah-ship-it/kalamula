"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Student, Batch, AssessmentConfigParsed, ScoreValue, ReadingLevel, Evaluation, FoundationNumber } from "@/types";
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
    pos_name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    pos_description: "Observasi longitudinal 2 Superobserver dari kedatangan, transisi rotasi 3 pos, hingga bermain bebas dan snack",
    focus: "Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
    indicators: [
      {
        id: "SO-01",
        label: "Berpisah dari Orang Tua",
        description: "Berpisah dari orang tua dengan tenang tanpa kecemasan berlebihan",
        foundation: 3,
        score_descriptors: {
          "1": "Menangis histeris / menolak keras ditinggal",
          "2": "Sempat cemas/menangis, mau masuk setelah dibujuk",
          "3": "Berpisah dengan tenang, ceria, dan antusias",
        },
      },
      {
        id: "SO-02",
        label: "Kemandirian Menaruh Barang",
        description: "Mandiri melepaskan dan merapikan sepatu di rak serta menggantung tas",
        foundation: 5,
        score_descriptors: {
          "1": "Barang ditinggal berserakan / butuh bantuan fisik penuh",
          "2": "Merapikan sepatu/tas dengan sedikit arahan/pengingat",
          "3": "Mandiri dan tertib merapikan sepatu di rak & gantung tas",
        },
      },
      {
        id: "SO-03",
        label: "Kepatuhan Mengikuti Instruksi saat Transisi",
        description: "Mengikuti instruksi pendamping dengan tertib saat berpindah antar ruang pos",
        foundation: 2,
        score_descriptors: {
          "1": "Mengabaikan instruksi, berlarian keluar barisan",
          "2": "Mengikuti transisi, sesekali perlu diingatkan tertib",
          "3": "Sangat tertib, fokus, dan tanggap instruksi pemandu",
        },
      },
      {
        id: "SO-04",
        label: "Kesantunan dan Budaya Antre",
        description: "Menggunakan kata santun (tolong, terima kasih, maaf) dan budaya sabar mengantre",
        foundation: 1,
        score_descriptors: {
          "1": "Menyerobot antrean / tidak sabar menunggu giliran",
          "2": "Mau mengantre dan berucap santun jika diingatkan",
          "3": "Konsisten sabar mengantre & spontan berucap tolong/maaf/terima kasih",
        },
      },
      {
        id: "SO-05",
        label: "Regulasi Diri & Adaptasi Kesulitan",
        description: "Kemampuan menenangkan diri dan beradaptasi saat menghadapi tantangan",
        foundation: 3,
        score_descriptors: {
          "1": "Tantrum / meltdown / menyerah saat ada tantangan",
          "2": "Sempat frustrasi, mampu tenang dengan sedikit arahan",
          "3": "Tenang, gigih, dan mampu meregulasi emosi secara mandiri",
        },
      },
      {
        id: "SO-06",
        label: "Bermain Kooperatif & Berbagi",
        description: "Interaksi saat bermain bersama, berbagi alat main/snack, dan dinamika kelompok",
        foundation: 2,
        score_descriptors: {
          "1": "Menolak interaksi / merebut alat main / agresif",
          "2": "Bermain paralel atau mau bergantian jika difasilitasi",
          "3": "Aktif berinteraksi positif, kooperatif, dan senang berbagi",
        },
      },
      {
        id: "SO-07",
        label: "Antusiasme & Refleksi Belajar",
        description: "Menunjukkan rasa ingin tahu positif, keceriaan, dan antusiasme belajar",
        foundation: 6,
        score_descriptors: {
          "1": "Sangat tertekan, pasif, atau menolak kegiatan",
          "2": "Mengikuti alur kegiatan dengan dorongan sesekali",
          "3": "Sangat antusias, ceria, dan bangga menceritakan pengalamannya",
        },
      },
    ],
    red_flags: [
      { id: "rf-so-1", label: "Tantrum histeris melantai (>10 menit)" },
      { id: "rf-so-2", label: "Agresi fisik membahayakan (memukul/menggigit teman)" },
      { id: "rf-so-3", label: "Perilaku impulsif membahayakan diri (lari keluar area)" },
      { id: "rf-so-4", label: "Penolakan sosial ekstrem (menolak disapa/kontak mata absen total)" },
    ],
  },
  2: {
    pos_name: "Pos Motorik Kasar & Koordinasi Fisik",
    pos_description: "Observasi kemampuan gerak tubuh, keseimbangan, dan koordinasi mata-tangan",
    focus: "Motorik Kasar & Koordinasi Fisik",
    indicators: [
      {
        id: "MK-01",
        label: "Keseimbangan & Kontrol Tubuh",
        description: "Berjalan lurus pada garis, meniti papan titian, dan melompat 2 kaki bersamaan",
        foundation: 5,
        score_descriptors: {
          "1": "Menolak melangkah / hilang keseimbangan total (harus dipegangi erat)",
          "2": "Mampu meniti/melompat dengan bantuan minimal (sentuhan tangan/sesekali goyah)",
          "3": "Lincah, seimbang sempurna, dan melompat 2 kaki mandiri dengan percaya diri",
        },
      },
      {
        id: "MK-02",
        label: "Koordinasi Mata-Tangan & Respons Gerak",
        description: "Merespons instruksi gerak verbal dan koordinasi tangkap-lempar bola",
        foundation: 5,
        score_descriptors: {
          "1": "Tidak merespons instruksi / luput total menangkap bola",
          "2": "Respons sedikit lambat, berhasil menangkap/melempar setelah 1–2 kali percobaan",
          "3": "Respons tanggap, tangkap dan lempar bola akurat serta gesit",
        },
      },
    ],
    red_flags: [
      { id: "rf-mk-1", label: "Tonus otot kaku (hipertonia) atau sangat lemas (hipotonia)" },
      { id: "rf-mk-2", label: "Sering jatuh tanpa hambatan fisik jelas / hilang keseimbangan berat" },
    ],
  },
  3: {
    pos_name: "Pos Kematangan Kognitif & Berhitung",
    pos_description: "Observasi kemampuan berpikir logis, pola, konsep kuantitas, dan pemecahan masalah",
    focus: "Kematangan Kognitif & Berhitung",
    indicators: [
      {
        id: "KG-01",
        label: "Klasifikasi Objek & Pola Berulang",
        description: "Mengelompokkan benda berdasarkan atribut dan melengkapi pola deret teratur",
        foundation: 4,
        score_descriptors: {
          "1": "Belum mampu memilah benda atau melanjutkan pola walau dicontohkan",
          "2": "Mampu mengelompokkan 1 atribut atau melengkapi pola sederhana setelah dipandu",
          "3": "Mandiri dan tepat memilah multi-atribut serta melanjutkan pola deret kompleks",
        },
      },
      {
        id: "KG-02",
        label: "Konsep Kuantitas & Problem Solving",
        description: "Memahami perbandingan banyak/sedikit, membilang konkret, dan menyusun balok/puzzle",
        foundation: 4,
        score_descriptors: {
          "1": "Belum paham konsep banyak-sedikit / bingung membilang konkret (1–5)",
          "2": "Mampu membandingkan kuantitas & menyelesaikan puzzle dasar dengan sedikit petunjuk",
          "3": "Pemahaman kuantitas kuat, membilang tepat, dan solutif merangkai balok/puzzle",
        },
      },
    ],
    red_flags: [
      { id: "rf-kg-1", label: "Disorientasi spasial berat / tidak mengenal bentuk dan arah dasar" },
      { id: "rf-kg-2", label: "Tidak memahami hubungan kausalitas (sebab-akibat) sederhana" },
    ],
  },
  4: {
    pos_name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
    pos_description: "Observasi kemampuan menyimak cerita lisan, komunikasi verbal, dan kontrol motorik halus alat tulis",
    focus: "Bahasa Lisan, Pra-Literasi & Motorik Halus",
    indicators: [
      {
        id: "BL-01",
        label: "Menyimak Cerita Lisan (Read-Aloud)",
        description: "Menyimak cerita lisan dan memahami pesan serta alur sederhana yang diceritakan",
        foundation: 2,
        score_descriptors: {
          "1": "Tidak memperhatikan cerita / tidak mampu menjawab pertanyaan sederhana",
          "2": "Menyimak cerita, mampu menjawab jika dipandu pertanyaan arahan",
          "3": "Menyimak aktif, paham alur, dan mampu menceritakan kembali dengan runtut",
        },
      },
      {
        id: "BL-02",
        label: "Komunikasi Gagasan Lisan",
        description: "Mengomunikasikan gagasan lisan tentang ide/karya dengan kalimat terstruktur",
        foundation: 2,
        score_descriptors: {
          "1": "Menolak bicara / suara sangat lirih / kata tidak bermakna",
          "2": "Menjelaskan dengan frasa pendek / 1–2 kata, butuh dipancing",
          "3": "Berani mengutarakan gagasan dengan kalimat sederhana yang jelas",
        },
      },
      {
        id: "BL-03",
        label: "Kontrol Motorik Halus & Tripod Grasp",
        description: "Kontrol jemari tangan dan genggaman pensil fungsional (tripod grasp) saat menulis/menggambar",
        foundation: 5,
        score_descriptors: {
          "1": "Genggaman palmar/tinju tanpa kontrol gerak jemari",
          "2": "Genggaman peralihan (pincer), goresan/garis masih kaku",
          "3": "Dynamic tripod grasp fungsional, goresan luwes, mantap, dan terkontrol",
        },
      },
    ],
    red_flags: [
      { id: "rf-bl-1", label: "Bicara tidak dapat dipahami (speech delay berat)" },
      { id: "rf-bl-2", label: "Ekolalia — menirukan kata tanpa makna kontekstual" },
      { id: "rf-bl-3", label: "Otot jemari tangan sangat lemah / tremor, tidak bisa pegang alat tulis" },
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

  // Route pos slug: 'so', '2', '3', '4' (Pos 1 is Super Observer, Pos 5 is legacy redirected to SO)
  const posParam = String(params.pos || "so").toLowerCase();
  const isSuperObserver = posParam === "so" || posParam === "super-observer" || posParam === "1";
  const posNumber = isSuperObserver ? 1 : Number(posParam) || 1;

  useEffect(() => {
    // If someone visits /reports/rubric/5 or /reports/rubric/1, gracefully normalize URL to /reports/rubric/so
    if (posParam === "5" || posParam === "1") {
      const q = searchParams.toString();
      router.replace(`/reports/rubric/so${q ? `?${q}` : ""}`);
    }
  }, [posParam, router, searchParams]);

  const initialStudentId = searchParams.get("student_id") || "";

  // View modes
  const [printFormat, setPrintFormat] = useState<"matrix" | "single">("matrix");
  const [selectedGroup, setSelectedGroup] = useState<string>("Kelompok 1");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  // Data states
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [allConfigs, setAllConfigs] = useState<Record<number, AssessmentConfigParsed>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [evaluatorName, setEvaluatorName] = useState<string>("");
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch configs, batches, students, evaluations, school profile & teachers
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch batches first to know the active wave
      const bRes = await fetch("/api/batches");
      let batchList: Batch[] = [];
      if (bRes.ok) {
        const bData = await bRes.json();
        batchList = bData.data || [];
        setBatches(batchList);
      }

      const urlBatchId = searchParams.get("batch_id");
      const savedBatchId =
        typeof window !== "undefined"
          ? localStorage.getItem("kalamula_evaluator_batch_id")
          : null;
      // Prefer batch from URL/storage, or the user's latest real batch (non-dummy)
      const realBatch = batchList.find(
        (b) => !b.batch_name.includes("56 Siswa") && !b.batch_name.includes("TP 2026/2027")
      );
      const activeBatchId =
        urlBatchId || savedBatchId || (realBatch ? realBatch.id : (batchList[0]?.id || ""));

      setSelectedBatchId(activeBatchId);

      // 2. Fetch parallel data using active batch ID
      const [cRes, sRes, eRes, pRes, tRes] = await Promise.all([
        fetch("/api/configs"),
        fetch(activeBatchId ? `/api/students?batch_id=${activeBatchId}` : "/api/students"),
        fetch(activeBatchId ? `/api/evaluations?batch_id=${activeBatchId}` : "/api/evaluations"),
        fetch("/api/school"),
        fetch("/api/teachers"),
      ]);

      // Configs
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

      // Students
      if (sRes.ok) {
        const sData = await sRes.json();
        const stList: Student[] = sData.data || [];
        setStudents(stList);
        if (!selectedStudentId && stList.length > 0) {
          setSelectedStudentId(stList[0].id);
        }
      }

      // Evaluations
      if (eRes.ok) {
        const eData = await eRes.json();
        const evList: Evaluation[] = eData.data || [];
        const evMap: Record<string, Evaluation> = {};
        evList.forEach((ev) => {
          evMap[`${ev.student_id}_${ev.pos_number}`] = ev;
        });
        setEvaluations(evMap);
      }

      // School Profile
      if (pRes.ok) {
        const pData = await pRes.json();
        setSchoolProfile(pData.data);
      }

      // Teachers
      if (tRes.ok) {
        const tData = await tRes.json();
        const tList = tData.data || [];
        setTeacherList(tList);
        if (isSuperObserver || posNumber === 1) {
          const soTeachers = tList.filter((t: any) => t.is_evaluator && t.evaluator_pos === 1);
          if (soTeachers.length >= 2) {
            setEvaluatorName(`${soTeachers[0].name} / ${soTeachers[1].name}`);
          } else if (soTeachers.length === 1) {
            setEvaluatorName(soTeachers[0].name);
          } else {
            setEvaluatorName("Ahmad Furqoni, S. Pd / Novia Permatasari, S. Pd");
          }
        } else {
          const evalTch = tList.find((t: any) => t.is_evaluator && t.evaluator_pos === posNumber);
          if (evalTch) {
            setEvaluatorName(evalTch.name);
          } else if (posNumber === 2) {
            setEvaluatorName("Rifky Delsandi Rifai, S. Pd");
          } else if (posNumber === 3) {
            setEvaluatorName("Shalma Ruhail Maldova, S. Pd");
          } else if (posNumber === 4) {
            setEvaluatorName("Susmurtiningsih, S. Pd");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load rubric data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams, selectedStudentId, posNumber]);

  const handleBatchChange = async (newBatchId: string) => {
    setSelectedBatchId(newBatchId);
    if (typeof window !== "undefined") {
      localStorage.setItem("kalamula_evaluator_batch_id", newBatchId);
    }
    try {
      setLoading(true);
      const [sRes, eRes] = await Promise.all([
        fetch(newBatchId ? `/api/students?batch_id=${newBatchId}` : "/api/students"),
        fetch(newBatchId ? `/api/evaluations?batch_id=${newBatchId}` : "/api/evaluations"),
      ]);
      if (sRes.ok) {
        const sData = await sRes.json();
        const stList: Student[] = sData.data || [];
        setStudents(stList);
        if (stList.length > 0) {
          setSelectedStudentId(stList[0].id);
        } else {
          setSelectedStudentId("");
        }
      }
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
      console.error("Gagal mengganti gelombang:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  // Active indicators for current view
  // If Super Observer: Pos 1 (SO-01 to SO-07)
  // If Station Evaluator: specific Pos (Pos 2 Motorik, Pos 3 Kognitif, Pos 4 Bahasa)
  const activeIndicators = useMemo(() => {
    const targetPos = isSuperObserver ? 1 : posNumber;
    const cfg = allConfigs[targetPos] || DEFAULT_CONFIGS[targetPos] || DEFAULT_CONFIGS[1];
    return (cfg.indicators || []).map((ind) => ({
      pos: targetPos,
      id: ind.id,
      label: ind.label,
      description: ind.description,
      foundation: ind.foundation,
      score_descriptors: (ind.score_descriptors as unknown as Record<string | number, string>) || {},
    }));
  }, [isSuperObserver, posNumber, allConfigs]);

  // Responsive display indicators: matches activeIndicators dynamically without artificial padding
  const displayIndicators = useMemo(() => {
    if (activeIndicators.length === 0) {
      return [
        {
          id: "1",
          label: "Indikator Observasi",
          description: "Belum ada indikator terkonfigurasi untuk pos ini",
          foundation: "",
          isPlaceholder: true,
        },
      ];
    }

    return activeIndicators.map((ind) => ({
      id: ind.id,
      label: ind.label,
      description: ind.description,
      foundation: ind.foundation,
      isPlaceholder: false,
    }));
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

    // If group has no students in this batch, return 5 blank dotted rows
    return [1, 2, 3, 4, 5].map((i) => ({
      id: "",
      nickname: "........................",
      full_name: "................................",
      registration_no: "PPDB-2026-.....",
    }));
  }, [students, selectedGroup]);

  // Current batch object
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Selected student for single format
  const currentSingleStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || (students.length > 0 ? students[0] : null);
  }, [students, selectedStudentId]);

  // Red flags for single format
  const activeRedFlags = useMemo(() => {
    const targetPos = isSuperObserver ? 1 : posNumber;
    const cfg = allConfigs[targetPos] || DEFAULT_CONFIGS[targetPos] || DEFAULT_CONFIGS[1];
    return (cfg.red_flags || []).map((rf) => ({ ...rf, pos: targetPos }));
  }, [isSuperObserver, posNumber, allConfigs]);

  const currentDateFormatted = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeFocusText = useMemo(() => {
    if (isSuperObserver || posNumber === 1) {
      return "Kemandirian, Regulasi Emosi Individu & Sosial, Kepatuhan Mengikuti Instruksi";
    }
    const defaultCfg = DEFAULT_CONFIGS[posNumber];
    const customCfg = allConfigs[posNumber];
    return customCfg?.pos_name || defaultCfg?.focus || "Observasi Kesiapan Belajar";
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

            {/* Ruang Observasi Switcher (SO + 3 Pos Stasioner) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                {
                  id: "so",
                  path: "/reports/rubric/so",
                  badge: "SO",
                  label: "Super Observer",
                  isActive: isSuperObserver || posNumber === 1,
                  activeClass: "bg-[#486B5A] text-white shadow-xs",
                  badgeBg: "bg-white/20 text-white",
                },
                {
                  id: "2",
                  path: "/reports/rubric/2",
                  badge: "POS A",
                  label: "Pos A (Motorik)",
                  isActive: !isSuperObserver && posNumber === 2,
                  activeClass: "bg-[#7D5327] text-white shadow-xs",
                  badgeBg: "bg-white/20 text-white",
                },
                {
                  id: "3",
                  path: "/reports/rubric/3",
                  badge: "POS B",
                  label: "Pos B (Kognitif)",
                  isActive: !isSuperObserver && posNumber === 3,
                  activeClass: "bg-[#36506C] text-white shadow-xs",
                  badgeBg: "bg-white/20 text-white",
                },
                {
                  id: "4",
                  path: "/reports/rubric/4",
                  badge: "POS C",
                  label: "Pos C (Bahasa)",
                  isActive: !isSuperObserver && posNumber === 4,
                  activeClass: "bg-[#8C3713] text-white shadow-xs",
                  badgeBg: "bg-white/20 text-white",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `${item.path}?batch_id=${selectedBatchId}${
                        selectedStudentId ? `&student_id=${selectedStudentId}` : ""
                      }`
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    item.isActive
                      ? item.activeClass
                      : "bg-[#FAF8F5] text-[#565C58] hover:bg-[#EFECE4] border border-[#E8E2D8]"
                  }`}
                >
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider ${
                      item.isActive ? item.badgeBg : "bg-[#EFECE4] text-[#22352B]"
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
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
            {/* Dropdown Pemilih Gelombang */}
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#787F7A] text-[11px] uppercase tracking-wider">
                Gelombang:
              </span>
              <select
                value={selectedBatchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="bg-white border border-[#CBE0D4] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A] cursor-pointer shadow-2xs max-w-[210px] truncate"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Dropdown Pemilih Evaluator */}
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#787F7A] text-[11px] uppercase tracking-wider">
                Evaluator:
              </span>
              <select
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                className="bg-white border border-[#CBE0D4] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A] cursor-pointer shadow-2xs max-w-[190px]"
              >
                <option value="">(Titik-titik / Manual)</option>
                {teacherList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
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
                kalamula &bull; {schoolProfile?.school_name || "SD Islam An Najah"} &bull; {currentBatch ? currentBatch.batch_name : (schoolProfile?.foundation_name || "Yayasan Nurun Najah")} &bull; T.A. {schoolProfile?.academic_year || "2026/2027"}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span
              className={`font-extrabold px-3.5 py-1 rounded-full text-[10px] sm:text-xs text-white uppercase tracking-wide inline-block shadow-2xs print:border ${
                isSuperObserver || posNumber === 1
                  ? "bg-[#486B5A] print:border-[#486B5A]"
                  : posNumber === 2
                  ? "bg-[#7D5327] print:border-[#7D5327]"
                  : posNumber === 3
                  ? "bg-[#36506C] print:border-[#36506C]"
                  : "bg-[#8C3713] print:border-[#8C3713]"
              }`}
            >
              {isSuperObserver || posNumber === 1
                ? "SUPER OBSERVER (TERPADU)"
                : posNumber === 2
                ? "POS A: MOTORIK KASAR & FISIK"
                : posNumber === 3
                ? "POS B: KOGNITIF & BERHITUNG"
                : posNumber === 4
                ? "POS C: BAHASA LISAN & PRA-LITERASI"
                : `POS OBSERVASI ${posNumber}`}
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
          <div className="col-span-2 px-3.5 py-2">
            <span className="text-[9px] uppercase font-bold text-[#787F7A] tracking-wider flex items-center gap-1 leading-none">
              <i className="mdi mdi-account-group-outline text-xs text-[#787F7A]" />
              <span>KELOMPOK</span>
            </span>
            <div className="font-extrabold text-[#22352B] text-xs mt-1 truncate">
              {selectedGroup === "blank" ? "Formulir Kosong" : selectedGroup}
            </div>
            {currentBatch && (
              <div className="text-[8.5px] text-[#787F7A] truncate font-medium mt-0.5">
                {currentBatch.batch_name}
              </div>
            )}
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
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="...................................."
              className="border-b border-stone-400 w-full min-h-4 mt-1 font-bold text-[#22352B] text-xs bg-transparent focus:outline-none focus:border-[#486B5A] print:border-none print:p-0"
            />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ─── FORMAT A: MATRIKS KELOMPOK (5 Siswa x 6 Indikator) ──────── */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {printFormat === "matrix" && (
          <div className="space-y-3">
            {/* ─── 3. Kotak Panduan Indikator (Responsive 2 Kolom) ─── */}
            <div className="border-[1.5px] border-[#22352B]/75 rounded-2xl p-3.5 space-y-2.5 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#22352B]">
                  <i className="mdi mdi-clipboard-text-outline text-sm text-[#486B5A]" />
                  <span>PANDUAN INDIKATOR ({displayIndicators.length} Indikator Observasi)</span>
                </div>
                <span className="text-[9px] font-medium text-[#787F7A]">
                  Format Matriks Observasi
                </span>
              </div>

              {(() => {
                const halfCount = Math.ceil(displayIndicators.length / 2);
                const leftIndicators = displayIndicators.slice(0, halfCount);
                const rightIndicators = displayIndicators.slice(halfCount);

                return (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    {/* Kolom Kiri */}
                    <div className="space-y-2.5">
                      {leftIndicators.map((ind, idx) => {
                        const num = idx + 1;
                        return (
                          <div key={ind.id || num} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#22352B] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 mt-0.5">
                              {num}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-[#22352B] text-[11px] leading-tight flex items-center gap-1.5 flex-wrap">
                                <span>{ind.label}</span>
                                {!ind.isPlaceholder && (
                                  <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-[#F2F7F4] border border-[#CBE0D4] text-[#486B5A] rounded">
                                    {ind.id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9.5px] text-[#565C58] leading-tight mt-0.5">
                                {ind.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-2.5">
                      {rightIndicators.map((ind, idx) => {
                        const num = halfCount + idx + 1;
                        return (
                          <div key={ind.id || num} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#22352B] text-white flex items-center justify-center font-extrabold text-[10px] flex-shrink-0 mt-0.5">
                              {num}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-[#22352B] text-[11px] leading-tight flex items-center gap-1.5 flex-wrap">
                                <span>{ind.label}</span>
                                {!ind.isPlaceholder && (
                                  <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-[#F2F7F4] border border-[#CBE0D4] text-[#486B5A] rounded">
                                    {ind.id}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9.5px] text-[#565C58] leading-tight mt-0.5">
                                {ind.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Sinyal Adaptif Notice at bottom of box */}
              <div className="border-t border-stone-200 pt-2 flex items-center gap-1.5 text-[9.5px] text-[#565C58]">
                <i className="mdi mdi-alert-circle-outline text-[#B85627] text-sm flex-shrink-0" />
                <span>
                  <strong>Sinyal adaptif:</strong> centang &ldquo;Perlu perhatian&rdquo; bila teramati cemas berlebih, <em>speech delay</em>, atau agresif.
                </span>
              </div>
            </div>

            {/* ─── 4. Bar Legenda Skor (1 PB – 3 M) ─── */}
            <div className="bg-[#F2F7F4] border border-[#CBE0D4] rounded-xl px-4 py-2 text-[10px] text-[#22352B]">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="font-extrabold text-[#486B5A]">Skala Penilaian:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9.5px] bg-white">1</span>
                  <span><strong>Perlu Bimbingan (PB)</strong> — Belum mampu mandiri / butuh bantuan penuh</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9.5px] bg-white">2</span>
                  <span><strong>Berkembang (B)</strong> — Mampu dengan 1–2 kali arahan / pengingat</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-[#22352B] inline-flex items-center justify-center font-bold text-[9.5px] bg-white">3</span>
                  <span><strong>Mandiri (M)</strong> — Lancar, tepat, dan konsisten tanpa bantuan</span>
                </span>
              </div>
            </div>

            {/* ─── 5. Tabel Utama Observasi (5 Siswa x N Kolom Indikator) ─── */}
            <div className="border-[1.5px] border-[#22352B]/85 rounded-2xl overflow-hidden bg-white">
              {/* Header Tabel */}
              <div className="bg-[#F2F7F4] border-b border-[#22352B]/40 flex items-center">
                <div className="w-[26%] px-3 py-2 font-extrabold text-[10px] text-[#22352B] uppercase tracking-wider">
                  SISWA
                </div>
                <div
                  className="w-[74%] grid divide-x divide-[#22352B]/20 py-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${displayIndicators.length}, minmax(0, 1fr))`,
                  }}
                >
                  {displayIndicators.map((ind, colIdx) => (
                    <div key={ind.id || colIdx} className="text-center flex flex-col items-center justify-center px-0.5">
                      <span className="w-5 h-5 rounded-full bg-[#22352B] text-white inline-flex items-center justify-center font-extrabold text-[10px]">
                        {colIdx + 1}
                      </span>
                      {!ind.isPlaceholder && (
                        <span className="text-[8px] font-mono text-[#486B5A] font-bold mt-0.5 truncate max-w-full">
                          {ind.id}
                        </span>
                      )}
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
                  const isDense = displayIndicators.length > 5;

                  return (
                    <div key={idx} className="bg-white">
                      {/* Sub-baris Atas: Nama Siswa + N Kolom Skor (Masing-masing 3 OMR Capsule) */}
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

                        {/* Kolom Kanan: N Kolom Indikator, masing-masing 3 pill capsule [1] [2] [3] */}
                        <div
                          className="w-[74%] grid divide-x divide-[#22352B]/20 py-2"
                          style={{
                            gridTemplateColumns: `repeat(${displayIndicators.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {displayIndicators.map((ind, colIdx) => {
                            const recordedScore = !ind.isPlaceholder ? sScores[ind.id] : null;

                            return (
                              <div
                                key={ind.id || colIdx}
                                className={`flex items-center justify-center ${
                                  isDense ? "gap-0.5 px-0.5" : "gap-1 sm:gap-1.5 px-1"
                                }`}
                              >
                                {[1, 2, 3].map((score) => {
                                  const isFilled = recordedScore === score;
                                  return (
                                    <span
                                      key={score}
                                      className={`rounded-full border-[1.3px] flex items-center justify-center font-black transition-colors ${
                                        isDense
                                          ? "w-3.5 sm:w-4 h-4.5 sm:h-5 text-[8px] sm:text-[8.5px]"
                                          : "w-4.5 sm:w-5 h-5 sm:h-5.5 text-[9px] sm:text-[9.5px]"
                                      } ${
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
              {/* Alur Rotasi Pos SPMB Terbaru */}
              <div className="max-w-md text-[9.5px] leading-relaxed">
                <span className="font-extrabold text-[#22352B]">Alur Observasi (3 Pos + 2 Superobserver): </span>
                <span className={posNumber === 2 && !isSuperObserver ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos A (Motorik)
                </span>
                <span className="text-stone-400 mx-1">&bull;</span>
                <span className={posNumber === 3 && !isSuperObserver ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos B (Kognitif)
                </span>
                <span className="text-stone-400 mx-1">&bull;</span>
                <span className={posNumber === 4 && !isSuperObserver ? "font-bold underline text-[#22352B]" : "text-[#565C58]"}>
                  Pos C (Bahasa)
                </span>
                <div className="mt-0.5 text-[9px] text-[#486B5A] font-semibold">
                  Longitudinal: 2 Superobserver (Titik Awal &rarr; Transisi 3 Pos &rarr; Titik Akhir Bermain/Snack)
                </div>
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
                    <th className="py-2 px-2.5 w-[28%]">Indikator Observasi</th>
                    <th className="py-2 px-2 w-[22%]">1 — Perlu Bimbingan (PB)</th>
                    <th className="py-2 px-2 w-[22%]">2 — Berkembang (B)</th>
                    <th className="py-2 px-2 w-[22%]">3 — Mandiri (M)</th>
                    <th className="py-2 px-1.5 w-[6%] text-center">Skor</th>
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
                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 2 ? "bg-[#FAF8F5] font-bold text-[#7D5327]" : ""}`}>
                          {ind.score_descriptors["2"] || "-"}
                        </td>
                        <td className={`py-2 px-2 align-top text-[#565C58] leading-tight text-[7.5pt] ${currentScore === 3 ? "bg-[#E4EFE9] font-bold text-[#486B5A]" : ""}`}>
                          {ind.score_descriptors["3"] || "-"}
                        </td>

                        <td className="py-2 px-1 align-middle text-center">
                          <div className="flex flex-col items-center gap-1">
                            {[1, 2, 3].map((s) => {
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
                  <span className="font-bold text-[#22352B] underline text-[8pt]">( Tim PPDB SD Islam An Najah )</span>
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
