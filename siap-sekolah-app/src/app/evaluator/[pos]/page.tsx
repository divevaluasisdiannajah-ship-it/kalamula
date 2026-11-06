"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Student, Evaluation, AssessmentConfig, Batch } from "@/types";

interface TaskStepInfo {
  step: number;
  totalSteps: number;
  targetGroup: string;
  timeRange: string;
  location: string;
  title: string;
  instruction: string;
  icon: string;
}

const SO1_STEPS: Record<number, TaskStepInfo> = {
  1: {
    step: 1,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.00 - 08.24",
    location: "Titik Awal ➔ Pos Bahasa",
    title: "Asesmen Kelompok 2 dari Start sampai Pos Bahasa",
    instruction:
      "Dampingi kedatangan di titik awal, amati kemandirian berpisah dari orang tua, adab menaruh sepatu di rak, dan baris-berbaris. Lalu kawal ke Pos Bahasa dan amati ketertiban serta regulasi diri saat kegiatan bahasa berlangsung.",
    icon: "mdi-account-arrow-right",
  },
  2: {
    step: 2,
    totalSteps: 3,
    targetGroup: "Kelompok 1",
    timeRange: "08.24 - 08.48",
    location: "Pintu Pos Motorik ➔ Pos Kognitif & Bahasa",
    title: "Switch ke Kelompok 1 di Pintu Pos A & Kawal ke Pos Kognitif/Bahasa",
    instruction:
      "Standby di depan pintu Pos Motorik Kasar (08.24). Terima serah-terima Kelompok 1 dari Pak Rifky. Bawa dan dampingi Kelompok 1 ke Pos Kognitif hingga Pos Bahasa. Amati kepatuhan instruksi, fokus, dan interaksi sosial.",
    icon: "mdi-account-switch",
  },
  3: {
    step: 3,
    totalSteps: 3,
    targetGroup: "Kelompok 1",
    timeRange: "08.48 - Selesai",
    location: "Titik Akhir (Area Bermain & Snack)",
    title: "Observasi Titik Akhir: Snack Break & Bermain Bebas (Kelompok 1)",
    instruction:
      "Dampingi Kelompok 1 menuju Titik Akhir. Amati adab makan/snack bersama, toleransi berbagi mainan, regulasi emosi saat bermain bebas, dan evaluasi catatan khusus sebelum penjemputan orang tua.",
    icon: "mdi-cookie-outline",
  },
};

const SO2_STEPS: Record<number, TaskStepInfo> = {
  1: {
    step: 1,
    totalSteps: 3,
    targetGroup: "Kelompok 3",
    timeRange: "08.00 - 08.36",
    location: "Titik Awal ➔ Pos Kognitif & Bahasa",
    title: "Asesmen Kelompok 3 dari Start sampai Pos Kognitif & Bahasa",
    instruction:
      "Dampingi kedatangan di titik awal, amati kemandirian berpisah dari orang tua, adab sepatu, dan baris. Lalu kawal ke Pos Kematangan Kognitif dan amati fokus, kepatuhan instruksi, dan transisi ke Pos Bahasa.",
    icon: "mdi-account-arrow-right",
  },
  2: {
    step: 2,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.36 - 08.48",
    location: "Pintu Pos Motorik ➔ Pos Kognitif",
    title: "Switch ke Kelompok 2 di Pintu Pos A & Kawal ke Pos Kognitif",
    instruction:
      "Standby di depan pintu Pos Motorik Kasar (08.36). Terima serah-terima Kelompok 2 dari Pak Rifky yang baru keluar dari Pos Motorik. Bawa ke Pos Kognitif dan amati adaptasi transisi serta regulasi diri.",
    icon: "mdi-account-switch",
  },
  3: {
    step: 3,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.48 - Selesai",
    location: "Titik Akhir (Area Bermain & Snack)",
    title: "Observasi Titik Akhir: Snack Break & Bermain Bebas (Kelompok 2)",
    instruction:
      "Dampingi Kelompok 2 menuju Titik Akhir. Amati adab makan/snack bersama, interaksi sosial, berbagi mainan, dan regulasi emosi saat bermain bebas.",
    icon: "mdi-cookie-outline",
  },
};

const POS2_STEPS: Record<number, TaskStepInfo> = {
  1: {
    step: 1,
    totalSteps: 3,
    targetGroup: "Kelompok 1",
    timeRange: "08.00 - 08.24",
    location: "Titik Awal ➔ Pos Motorik Kasar",
    title: "Jemput Kelompok 1 di Titik Awal & Uji Motorik Kasar",
    instruction:
      "Hadir di titik awal kedatangan saat pembagian name tag (08.00). Jemput Kelompok 1 dan bawa ke Pos Motorik Kasar. Lakukan pengujian keseimbangan meniti titian, lompat 2 kaki, dan koordinasi tangkap bola.",
    icon: "mdi-run-fast",
  },
  2: {
    step: 2,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.24 - 08.36",
    location: "Pintu Pos A (Handover 1)",
    title: "Handover di Pintu Pos A: Terima & Uji Kelompok 2",
    instruction:
      "Di depan pintu Pos A (08.24), serahkan Kelompok 1 ke SO 1 (Ahmad Furqoni). Langsung sambut & terima Kelompok 2 dari SO 1 untuk diuji motorik kasarnya di dalam ruangan Pos Motorik.",
    icon: "mdi-account-switch",
  },
  3: {
    step: 3,
    totalSteps: 3,
    targetGroup: "Kelompok 3",
    timeRange: "08.36 - 08.48 (Hingga Titik Akhir)",
    location: "Pos Bahasa ➔ Pos Motorik ➔ Titik Akhir",
    title: "Jemput Kelompok 3 di Pos Bahasa & Antar ke Titik Akhir (Snack/Bermain)",
    instruction:
      "Serahkan Kelompok 2 ke SO 2 (08.36). Segera jalan ke Pos Bahasa untuk menjemput Kelompok 3 bawa ke Pos Motorik. Uji motorik Kelompok 3, lalu setelah selesai (08.48), antar langsung Kelompok 3 ke Area Bermain & Snack di Titik Akhir.",
    icon: "mdi-flag-checkered",
  },
};

const POS3_STEPS: Record<number, TaskStepInfo> = {
  1: {
    step: 1,
    totalSteps: 3,
    targetGroup: "Kelompok 3",
    timeRange: "08.00 - 08.24",
    location: "Ruang Pos B (Kematangan Kognitif)",
    title: "Asesmen Kematangan Kognitif Kelompok 3",
    instruction:
      "Sambut Kelompok 3 yang diantar SO 2. Uji pola bentuk/warna (AB-AB), klasifikasi objek konkret, konsep kuantitas 1-10, serta pemecahan masalah puzzle dan balok logika.",
    icon: "mdi-puzzle-outline",
  },
  2: {
    step: 2,
    totalSteps: 3,
    targetGroup: "Kelompok 1",
    timeRange: "08.24 - 08.36",
    location: "Ruang Pos B (Kematangan Kognitif)",
    title: "Asesmen Kematangan Kognitif Kelompok 1",
    instruction:
      "Sambut Kelompok 1 yang diantar SO 1 dari Pos Motorik. Lakukan pengujian klasifikasi multi-atribut, pola deret berulang, perbandingan banyak-sedikit, dan susun balok.",
    icon: "mdi-shape-outline",
  },
  3: {
    step: 3,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.36 - 08.48",
    location: "Ruang Pos B (Kematangan Kognitif)",
    title: "Asesmen Kematangan Kognitif Kelompok 2",
    instruction:
      "Sambut Kelompok 2 yang diantar SO 2 dari Pos Motorik. Selesaikan asesmen kognitif sebelum anak diarahkan menuju Titik Akhir (Area Bermain Bebas & Snack Break).",
    icon: "mdi-lightbulb-on-outline",
  },
};

const POS4_STEPS: Record<number, TaskStepInfo> = {
  1: {
    step: 1,
    totalSteps: 3,
    targetGroup: "Kelompok 2",
    timeRange: "08.00 - 08.24",
    location: "Ruang Pos C (Bahasa Lisan & Halus)",
    title: "Asesmen Bahasa Lisan & Pra-Literasi Kelompok 2",
    instruction:
      "Sambut Kelompok 2 yang diantar SO 1 dari Titik Awal. Bacakan cerita lisan bergambar (read-aloud), amati daya simak, cek posisi genggaman pensil (tripod grasp), dan petakan tingkat membaca (L1-L4).",
    icon: "mdi-book-open-page-variant-outline",
  },
  2: {
    step: 2,
    totalSteps: 3,
    targetGroup: "Kelompok 3",
    timeRange: "08.24 - 08.36",
    location: "Ruang Pos C (Bahasa Lisan & Halus)",
    title: "Asesmen Bahasa Lisan & Pra-Literasi Kelompok 3",
    instruction:
      "Sambut Kelompok 3 yang berpindah dari Pos Kognitif. Lakukan sesi menyimak cerita lisan, amati artikulasi verbal, pemahaman alur cerita, dan kontrol motorik halus jemari tangan.",
    icon: "mdi-pencil-ruler",
  },
  3: {
    step: 3,
    totalSteps: 3,
    targetGroup: "Kelompok 1",
    timeRange: "08.36 - 08.48",
    location: "Ruang Pos C (Bahasa Lisan & Halus)",
    title: "Asesmen Bahasa Lisan & Pra-Literasi Kelompok 1",
    instruction:
      "Sambut Kelompok 1 yang berpindah dari Pos Kognitif. Tuntaskan observasi ekspresi lisan dan motorik pensil sebelum anak menuju Titik Akhir (Snack & Bermain).",
    icon: "mdi-text-box-check-outline",
  },
};

export default function EvaluatorStudentListPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const posNumber = Number(params.pos);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "mandiri" | "bimbingan">("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [currentSubrole, setCurrentSubrole] = useState<"so1" | "so2">("so1");
  const [stepOverride, setStepOverride] = useState<number | null>(null);

  useEffect(() => {
    const urlSubrole = searchParams.get("subrole") as "so1" | "so2" | null;
    const savedSubrole =
      typeof window !== "undefined"
        ? (localStorage.getItem("kalamula_evaluator_subrole") as "so1" | "so2" | null)
        : null;
    if (urlSubrole === "so1" || urlSubrole === "so2") {
      setCurrentSubrole(urlSubrole);
    } else if (savedSubrole === "so1" || savedSubrole === "so2") {
      setCurrentSubrole(savedSubrole);
    }
  }, [searchParams]);

  const loadBatchStudents = useCallback(
    async (targetBatchId: string) => {
      try {
        // Load students for this batch
        const sRes = await fetch(`/api/students?batch_id=${targetBatchId}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setStudents(sData.data || []);
        } else {
          throw new Error("Gagal mengambil daftar siswa");
        }

        // Load evaluations for this batch & pos
        const eRes = await fetch(
          `/api/evaluations?batch_id=${targetBatchId}&pos_number=${posNumber}`
        );
        if (eRes.ok) {
          const eData = await eRes.json();
          setEvaluations(eData.data || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat data siswa.";
        setError(msg);
      }
    },
    [posNumber]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get all batches
      const batchRes = await fetch("/api/batches");
      if (!batchRes.ok) throw new Error("Gagal mengambil data gelombang");

      const batchData = await batchRes.json();
      const allBatches: Batch[] = batchData.data || [];
      setBatches(allBatches);

      if (allBatches.length > 0) {
        const urlBatchId = searchParams.get("batch_id") || searchParams.get("batch");
        const savedBatchId =
          typeof window !== "undefined"
            ? localStorage.getItem("kalamula_evaluator_batch_id")
            : null;
        const requestedId = urlBatchId || savedBatchId;

        let selected = allBatches.find((b) => b.id === requestedId);
        if (!selected) {
          // Smart priority: active batch with students > any batch with students > active batch > first batch
          selected =
            allBatches.find((b) => b.status === "active" && (b.student_count || 0) > 0) ||
            allBatches.find((b) => (b.student_count || 0) > 0) ||
            allBatches.find((b) => b.status === "active") ||
            allBatches[0];
        }

        setBatch(selected);
        setActiveBatchId(selected.id);
        if (typeof window !== "undefined") {
          localStorage.setItem("kalamula_evaluator_batch_id", selected.id);
        }

        await loadBatchStudents(selected.id);
      }

      // 2. Load config for this pos
      const cRes = await fetch("/api/configs");
      if (cRes.ok) {
        const cData = await cRes.json();
        const posConfig = (cData.data || []).find(
          (c: AssessmentConfig) => c.pos_number === posNumber && c.is_active
        );
        setConfig(posConfig || null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Periksa koneksi jaringan Anda.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [posNumber, searchParams, loadBatchStudents]);

  const handleBatchChange = async (newBatchId: string) => {
    const selected = batches.find((b) => b.id === newBatchId);
    if (!selected) return;
    setBatch(selected);
    setActiveBatchId(newBatchId);
    if (typeof window !== "undefined") {
      localStorage.setItem("kalamula_evaluator_batch_id", newBatchId);
    }
    router.replace(`/evaluator/${posNumber}?batch_id=${newBatchId}`);
    setLoading(true);
    await loadBatchStudents(newBatchId);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStudentEvaluation = useCallback(
    (studentId: string) => {
      return evaluations.find((e) => e.student_id === studentId);
    },
    [evaluations]
  );

  const parsedIndicators = useMemo(() => {
    if (!config?.indicators_json) return [];
    try {
      const parsed = typeof config.indicators_json === "string" ? JSON.parse(config.indicators_json) : config.indicators_json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [config?.indicators_json]);

  const completionStats = useMemo(() => {
    if (students.length === 0) return { percent: 0, completed: 0, total: 0, pending: 0 };
    const completed = students.filter((s) => {
      const ev = getStudentEvaluation(s.id);
      return ev?.is_complete;
    }).length;
    return {
      percent: Math.round((completed / students.length) * 100),
      completed,
      total: students.length,
      pending: Math.max(0, students.length - completed),
    };
  }, [students, getStudentEvaluation]);

  const POS_METADATA: Record<number, { name: string; focus: string; role: string }> = {
    1: {
      name: "Pos Kemandirian, Regulasi Emosi & Kepatuhan Instruksi",
      focus: "Kemandirian berpisah, adab antrean, ketertiban transisi, & bermain bebas (Longitudinal)",
      role: "Super Observer (SO 1 & SO 2)",
    },
    2: {
      name: "Pos Motorik Kasar & Koordinasi Fisik",
      focus: "Keseimbangan meniti titian, tangkap bola & rotasi pendamping",
      role: "Station Evaluator + Escort",
    },
    3: {
      name: "Pos Kematangan Kognitif & Berhitung",
      focus: "Pola bentuk, warna, klasifikasi & logika kuantitas (12 mnt)",
      role: "Station Evaluator",
    },
    4: {
      name: "Pos Bahasa Lisan, Pra-Literasi & Motorik Halus",
      focus: "Pemahaman cerita, ekspresi verbal & kontrol pensil tripod grasp",
      role: "Station Evaluator",
    },
  };

  const groupStats = useMemo(() => {
    const groups = ["Kelompok 1", "Kelompok 2", "Kelompok 3"] as const;
    const res: Record<string, { total: number; completed: number; percent: number; isFinished: boolean }> = {};
    for (const grp of groups) {
      const grpStudents = students.filter((s) => s.observation_group === grp);
      const completed = grpStudents.filter((s) => {
        const ev = getStudentEvaluation(s.id);
        return Boolean(ev?.is_complete);
      }).length;
      const total = grpStudents.length;
      res[grp] = {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        isFinished: total > 0 && completed >= total,
      };
    }
    return res;
  }, [students, getStudentEvaluation]);

  const autoStep = useMemo(() => {
    if (posNumber === 1) {
      if (currentSubrole === "so1") {
        if (!groupStats["Kelompok 2"]?.isFinished) return 1;
        if (!groupStats["Kelompok 1"]?.isFinished) return 2;
        return 3;
      } else {
        if (!groupStats["Kelompok 3"]?.isFinished) return 1;
        if (!groupStats["Kelompok 2"]?.isFinished) return 2;
        return 3;
      }
    } else if (posNumber === 2) {
      if (!groupStats["Kelompok 1"]?.isFinished) return 1;
      if (!groupStats["Kelompok 2"]?.isFinished) return 2;
      return 3;
    } else if (posNumber === 3) {
      if (!groupStats["Kelompok 3"]?.isFinished) return 1;
      if (!groupStats["Kelompok 1"]?.isFinished) return 2;
      return 3;
    } else if (posNumber === 4) {
      if (!groupStats["Kelompok 2"]?.isFinished) return 1;
      if (!groupStats["Kelompok 3"]?.isFinished) return 2;
      return 3;
    }
    return 1;
  }, [posNumber, currentSubrole, groupStats]);

  const currentStep = stepOverride ?? autoStep;

  const currentTaskInfo = useMemo<TaskStepInfo | null>(() => {
    if (posNumber === 1) {
      const steps = currentSubrole === "so1" ? SO1_STEPS : SO2_STEPS;
      return steps[currentStep] || steps[1];
    } else if (posNumber === 2) {
      return POS2_STEPS[currentStep] || POS2_STEPS[1];
    } else if (posNumber === 3) {
      return POS3_STEPS[currentStep] || POS3_STEPS[1];
    } else if (posNumber === 4) {
      return POS4_STEPS[currentStep] || POS4_STEPS[1];
    }
    return null;
  }, [posNumber, currentSubrole, currentStep]);

  // Lock filter automatically to the active step's target group
  useEffect(() => {
    if (currentTaskInfo?.targetGroup) {
      setSelectedGroup(currentTaskInfo.targetGroup);
    }
  }, [posNumber, currentSubrole, currentStep, currentTaskInfo]);

  const displayStats = useMemo(() => {
    if (selectedGroup !== "all" && groupStats[selectedGroup]) {
      return groupStats[selectedGroup];
    }
    if (currentTaskInfo?.targetGroup && groupStats[currentTaskInfo.targetGroup]) {
      return groupStats[currentTaskInfo.targetGroup];
    }
    return completionStats;
  }, [selectedGroup, currentTaskInfo, groupStats, completionStats]);

  const handleReset = () => {
    setStepOverride(null);
    setSearchQuery("");
    setFilterTab("all");
    const autoTarget =
      posNumber === 1
        ? (currentSubrole === "so1" ? SO1_STEPS[autoStep] : SO2_STEPS[autoStep])?.targetGroup
        : posNumber === 2
        ? POS2_STEPS[autoStep]?.targetGroup
        : posNumber === 3
        ? POS3_STEPS[autoStep]?.targetGroup
        : POS4_STEPS[autoStep]?.targetGroup;
    if (autoTarget) setSelectedGroup(autoTarget);
    else setSelectedGroup("all");
  };

  const handleSimulate = () => {
    const nextStep = (currentStep % 3) + 1;
    setStepOverride(nextStep);
    const stepTarget =
      posNumber === 1
        ? (currentSubrole === "so1" ? SO1_STEPS[nextStep] : SO2_STEPS[nextStep])?.targetGroup
        : posNumber === 2
        ? POS2_STEPS[nextStep]?.targetGroup
        : posNumber === 3
        ? POS3_STEPS[nextStep]?.targetGroup
        : POS4_STEPS[nextStep]?.targetGroup;
    if (stepTarget) setSelectedGroup(stepTarget);
  };

  /** Calculate accurate age string */
  const calculateAge = (birthDateStr: string): string => {
    if (!birthDateStr) return "-";
    const birth = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} thn ${months} bln`;
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const ev = getStudentEvaluation(student.id);
      const isComplete = Boolean(ev?.is_complete);
      const score = ev?.total_score || 0;
      const hasRedFlag = Boolean(ev?.has_red_flag);
      const isMandiri = isComplete && score >= 2.5 && !hasRedFlag;
      const isBimbingan = isComplete && (score < 2.5 || hasRedFlag);

      if (filterTab === "mandiri" && !isMandiri) return false;
      if (filterTab === "bimbingan" && !isBimbingan) return false;

      if (selectedGroup !== "all" && student.observation_group !== selectedGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          student.full_name.toLowerCase().includes(q) ||
          student.nickname.toLowerCase().includes(q) ||
          student.registration_no.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [students, filterTab, selectedGroup, searchQuery, getStudentEvaluation]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#22352B] pb-24 font-sans">
      <div className="p-4 sm:p-6 max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-4">
        {/* Top Bar Navigation & Actions (Sesuai Mockup Referensi) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2">
            <Link
              href="/evaluator"
              className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96]"
            >
              <i className="mdi mdi-chevron-left text-base" />
              <span>Ganti Pos</span>
            </Link>

            <button
              type="button"
              onClick={handleReset}
              className="bg-white border border-[#E8E2D8] text-[#22352B] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96] cursor-pointer"
              title="Reset filter dan step ke alur otomatis"
            >
              <i className="mdi mdi-restore text-base text-[#787F7A]" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSimulate}
              className="bg-white border border-[#E8E2D8] text-[#22352B] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1.5 shadow-2xs active:scale-[0.96] cursor-pointer"
              title="Simulasi perputaran rotasi step"
            >
              <i className="mdi mdi-flask-outline text-base text-[#9B3F18]" />
              <span>Simulasi</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports/rubric/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex bg-[#FAF0E8] border border-[#F2D8C7] text-[#9B3F18] hover:bg-[#F5E6DC] px-3 py-1.5 rounded-full text-xs font-bold transition items-center gap-1 shadow-2xs"
              title="Panduan & Rubrik Asesmen Lengkap"
            >
              <i className="mdi mdi-book-open-page-variant text-sm" />
              <span>Panduan</span>
            </Link>

            <Link
              href={`/reports/rubric/${posNumber === 1 ? "so" : posNumber}${activeBatchId ? `?batch_id=${activeBatchId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex bg-white border border-[#E8E2D8] text-[#9B3F18] hover:bg-[#FAF8F5] px-3 py-1.5 rounded-full text-xs font-bold transition items-center gap-1 shadow-2xs"
              title="Cetak Lembar Observasi Fisik"
            >
              <i className="mdi mdi-printer-outline text-sm" />
              <span>Cetak Lembar</span>
            </Link>

            <div className="bg-[#E4EFE9] text-[#22352B] border border-[#CBE0D4] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2E6B4D] animate-pulse" />
              <span>
                {posNumber === 1
                  ? "SO Aktif"
                  : posNumber === 2
                  ? "Pos A Aktif"
                  : posNumber === 3
                  ? "Pos B Aktif"
                  : "Pos C Aktif"}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SIGNATURE TERRACOTTA HERO BANNER CARD (Varian E Megamendung) ─── */}
        <div className="relative overflow-hidden bg-[#9B3F18] rounded-[32px] p-6 text-white shadow-md space-y-4">
          {/* Megamendung Adaptive Overlay */}
          <div className="bg-megamendung-overlay" aria-hidden="true" />

          {/* Top Tag & Percent Badge */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="bg-white text-[#9B3F18] font-black text-[10px] tracking-wider uppercase px-3.5 py-1 rounded-full shadow-2xs">
              {posNumber === 1
                ? "LINTAS KELOMPOK"
                : posNumber === 2
                ? "POS A • MOTORIK"
                : posNumber === 3
                ? "POS B • KOGNITIF"
                : "POS C • BAHASA"}
            </span>

            <div className="bg-white text-[#22352B] rounded-2xl px-3.5 py-1.5 text-center shadow-xs min-w-[70px]">
              <div className="text-sm font-black font-mono leading-tight text-[#9B3F18]">
                {displayStats.percent}%
              </div>
              <div className="text-[9px] font-bold text-[#787F7A] uppercase tracking-wider leading-none">
                Selesai
              </div>
            </div>
          </div>

          {/* Pos Title & Focus Description */}
          <div className="relative z-10 space-y-1">
            <p className="text-xs text-white/80 font-medium">
              {posNumber === 1
                ? "Super Observer (Kel. 1, 2 & 3)"
                : posNumber === 2
                ? "Pos A (Motorik Kasar & Koordinasi)"
                : posNumber === 3
                ? "Pos B (Kematangan Kognitif & Logika)"
                : "Pos C (Bahasa Lisan & Motorik Halus)"}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {config?.pos_name || (posNumber === 1
                ? "Karakter, Emosi, Kemandirian & Dinamika Sosial"
                : posNumber === 2
                ? "Motorik Kasar & Koordinasi Fisik"
                : posNumber === 3
                ? "Kematangan Kognitif & Logika Berhitung"
                : "Bahasa Lisan, Pra-Literasi & Motorik Halus")}
            </h1>
            <p className="text-xs text-white/90 font-normal leading-relaxed max-w-xl pt-0.5">
              {config?.pos_description || (posNumber === 1
                ? "Kemandirian berpisah, adab antrean, kelenturan transisi, & bermain bebas antar pos."
                : posNumber === 2
                ? "Keseimbangan meniti titian, tangkap bola, koordinasi fisik & rotasi pendamping."
                : posNumber === 3
                ? "Klasifikasi objek, logika pola berulang, perbandingan kuantitas & problem solving balok."
                : "Menyimak cerita lisan (read-aloud), komunikasi verbal, & kontrol genggaman pensil (tripod grasp).")}
            </p>
          </div>

          {/* Gelombang / Batch Selector Pill */}
          <div className="relative z-10 inline-flex items-center">
            <div className="bg-white text-[#22352B] rounded-full px-4 py-1.5 text-xs font-bold inline-flex items-center gap-2 shadow-xs pointer-events-none">
              <i className="mdi mdi-calendar-month-outline text-sm text-[#9B3F18]" />
              <span>
                {batch?.batch_name || "Gelombang 1 - TP 2027/2028"} ({completionStats.total} Siswa) • Aktif
              </span>
              <i className="mdi mdi-chevron-down text-sm text-[#787F7A]" />
            </div>
            <select
              value={activeBatchId || ""}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
              title="Ganti Gelombang"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id} className="text-[#22352B] bg-white">
                  {b.batch_name} ({b.student_count ?? 0} Siswa){b.status === "active" ? " • Aktif" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ─── 3 STAT BOXES (TOTAL, SELESAI, MENUNGGU - Varian E Solid White Cards) ─── */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs flex flex-col justify-center items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A] block">
                TOTAL
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#22352B] font-mono tabular-nums block mt-0.5">
                {displayStats.total}
              </span>
            </div>
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs flex flex-col justify-center items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A] block">
                SELESAI
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#2E6B4D] font-mono tabular-nums block mt-0.5">
                {displayStats.completed}
              </span>
            </div>
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 text-center shadow-xs flex flex-col justify-center items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#787F7A] block">
                MENUNGGU
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#9B3F18] font-mono tabular-nums block mt-0.5">
                {Math.max(0, displayStats.total - displayStats.completed)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── KARTU TUGAS AKTIF TUNGGAL (DYNAMIC TASK CARD - Persis Gambar) ── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {currentTaskInfo && (() => {
          const targetStats = groupStats[currentTaskInfo.targetGroup] || {
            total: 0,
            completed: 0,
            percent: 0,
            isFinished: false,
          };

          return (
            <div className="bg-[#FAF8F5] rounded-[32px] p-5 sm:p-6 border border-[#E8E2D8] shadow-xs space-y-4">
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#9B3F18] text-white font-black text-[10px] tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-2xs">
                  TUGAS AKTIF • STEP {currentStep} DARI {currentTaskInfo.totalSteps}
                </span>

                <span className="bg-white border border-[#E8E2D8] text-[#22352B] font-bold text-xs px-3.5 py-1.5 rounded-full shadow-2xs inline-flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <i className="mdi mdi-account-group text-sm text-[#787F7A]" />
                    <span>TARGET: {currentTaskInfo.targetGroup}</span>
                  </span>
                  <span className="text-[#C5BCB2]">•</span>
                  <span className="font-mono text-[#787F7A] flex items-center gap-1">
                    <i className="mdi mdi-clock-outline text-xs" />
                    <span>{currentTaskInfo.timeRange}</span>
                  </span>
                </span>
              </div>

              {/* Subrole Switcher (Pos 1) or Officer Badge (Pos 2, 3, 4) */}
              {posNumber === 1 ? (
                <div className="grid grid-cols-2 gap-2 bg-[#F0EDE6] p-1.5 rounded-2xl border border-[#E8E2D8]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSubrole("so1");
                      setStepOverride(null);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kalamula_evaluator_subrole", "so1");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                      currentSubrole === "so1"
                        ? "bg-[#9B3F18] text-white shadow-xs"
                        : "bg-white/80 text-[#787F7A] hover:bg-white"
                    }`}
                  >
                    SO 1 (Ahmad Furqoni)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSubrole("so2");
                      setStepOverride(null);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kalamula_evaluator_subrole", "so2");
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                      currentSubrole === "so2"
                        ? "bg-[#9B3F18] text-white shadow-xs"
                        : "bg-white/80 text-[#787F7A] hover:bg-white"
                    }`}
                  >
                    SO 2 (Novia Permatasari)
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#E8E2D8] rounded-2xl py-2 px-3.5 text-xs font-bold text-[#22352B] flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-1.5">
                    <i className="mdi mdi-account-tie text-sm text-[#486B5A]" />
                    <span>
                      Petugas:{" "}
                      {posNumber === 2
                        ? "Rifky Delsandi Rifai, S. Pd"
                        : posNumber === 3
                        ? "Shalma Ruhail Maldova, S. Pd"
                        : "Susmurtiningsih, S. Pd"}
                    </span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#E4EFE9] text-[#486B5A]">
                    {posNumber === 2 ? "Mobile Escort" : "Stasioner Ruangan"}
                  </span>
                </div>
              )}

              {/* Main Task Description Card (White) */}
              <div className="bg-white rounded-[24px] p-5 border border-[#E8E2D8] shadow-xs space-y-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#9B3F18] text-white flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                    <i className="mdi mdi-cached" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-base sm:text-lg font-black text-[#22352B] leading-tight">
                      {currentTaskInfo.title}
                    </h2>
                    <div className="text-xs font-bold text-[#486B5A] flex items-center gap-1.5">
                      <i className="mdi mdi-map-marker-radius text-sm" />
                      <span>Lokasi Alur: {currentTaskInfo.location}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-[#565C58] leading-relaxed font-normal">
                  {currentTaskInfo.instruction}
                </p>

                {/* Progress Subcard */}
                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-[#22352B]">
                      Proses Asesmen {currentTaskInfo.targetGroup}:
                    </span>
                    <span className="text-xs font-black font-mono tabular-nums text-[#9B3F18]">
                      {targetStats.completed} dari {targetStats.total} Siswa ({targetStats.percent}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {targetStats.isFinished ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E4EFE9] text-[#2E6B4D] border border-[#CBE0D4] inline-flex items-center gap-1 shadow-2xs">
                        <i className="mdi mdi-check-decagram text-xs" />
                        <span>Selesai! Otomatis Beralih</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#787F7A] border border-[#E8E2D8] inline-flex items-center gap-1 shadow-2xs">
                        <i className="mdi mdi-timer-sand text-xs text-[#9B3F18]" />
                        <span>Sedang Berjalan</span>
                      </span>
                    )}
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        targetStats.isFinished ? "bg-[#2E6B4D]" : "bg-[#9B3F18]"
                      }`}
                      style={{ width: `${Math.max(5, targetStats.percent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Steps Navigation */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#787F7A]">Langkah:</span>
                  {[1, 2, 3].map((stepNum) => {
                    const stepGroup =
                      posNumber === 1
                        ? (currentSubrole === "so1" ? SO1_STEPS[stepNum] : SO2_STEPS[stepNum])?.targetGroup
                        : posNumber === 2
                        ? POS2_STEPS[stepNum]?.targetGroup
                        : posNumber === 3
                        ? POS3_STEPS[stepNum]?.targetGroup
                        : POS4_STEPS[stepNum]?.targetGroup;
                    const isStepDone = Boolean(stepGroup && groupStats[stepGroup]?.isFinished);
                    const isCurrent = currentStep === stepNum;

                    return (
                      <button
                        key={stepNum}
                        type="button"
                        onClick={() => {
                          setStepOverride(stepNum);
                          if (stepGroup) setSelectedGroup(stepGroup);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          isCurrent
                            ? "bg-[#9B3F18] text-white shadow-2xs font-extrabold"
                            : "bg-white border border-[#E8E2D8] text-[#565C58] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <span>Step {stepNum}</span>
                        {isStepDone && <i className="mdi mdi-check text-xs text-[#2E6B4D]" />}
                      </button>
                    );
                  })}
                </div>

                {stepOverride !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setStepOverride(null);
                      const autoTarget =
                        posNumber === 1
                          ? (currentSubrole === "so1" ? SO1_STEPS[autoStep] : SO2_STEPS[autoStep])?.targetGroup
                          : posNumber === 2
                          ? POS2_STEPS[autoStep]?.targetGroup
                          : posNumber === 3
                          ? POS3_STEPS[autoStep]?.targetGroup
                          : POS4_STEPS[autoStep]?.targetGroup;
                      if (autoTarget) setSelectedGroup(autoTarget);
                    }}
                    className="text-xs text-[#787F7A] hover:text-[#22352B] underline cursor-pointer"
                  >
                    Kembali ke Alur Otomatis
                  </button>
                )}
              </div>

              {/* Filter Button: Full-width light sage green pill (Persis Gambar) */}
              <button
                type="button"
                onClick={() => setSelectedGroup(currentTaskInfo.targetGroup)}
                className="w-full bg-[#E4EFE9] hover:bg-[#D6E6DC] text-[#486B5A] border border-[#CBE0D4] font-black text-xs sm:text-sm py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.99]"
              >
                <i className="mdi mdi-filter-variant text-base" />
                <span>Tampilkan Daftar Siswa: {currentTaskInfo.targetGroup}</span>
              </button>
            </div>
          );
        })()}

        {/* Responsive Toolbar: Pencarian, Kelompok, dan Filter Status (Gaya Chips Sesuai Gambar) */}
        <div className="bg-white p-3 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Input pencarian */}
          <div className="relative flex-1 min-w-[200px] bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] px-3 py-2 flex items-center gap-2">
            <i className="mdi mdi-magnify text-base text-[#787F7A] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau No. Reg..."
              className="w-full text-base sm:text-xs bg-transparent text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#787F7A] hover:text-[#22352B] text-xs p-0.5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <i className="mdi mdi-close" />
              </button>
            )}
          </div>

          {/* Segmented Filter Kelompok - Chips Pills Sesuai Gambar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedGroup("all")}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer text-center whitespace-nowrap active:scale-[0.96] ${
                selectedGroup === "all"
                  ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#DDD7CE]"
              }`}
            >
              Semua Kelompok
            </button>
            {(["Kelompok 1", "Kelompok 2", "Kelompok 3"] as const).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer text-center whitespace-nowrap active:scale-[0.96] ${
                  selectedGroup === grp
                    ? "bg-[#9C4322] text-white shadow-2xs font-extrabold"
                    : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#DDD7CE]"
                }`}
              >
                {grp.replace("Kelompok ", "Kel. ")}
              </button>
            ))}
          </div>

          {/* Filter Status Siswa */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "all"
                  ? "bg-[#22352B] text-white shadow-2xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#DDD7CE]"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("mandiri")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "mandiri"
                  ? "bg-[#2E6B4D] text-white shadow-2xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#DDD7CE]"
              }`}
            >
              Mandiri
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("bimbingan")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap active:scale-[0.96] ${
                filterTab === "bimbingan"
                  ? "bg-[#9C4322] text-white shadow-2xs"
                  : "bg-white border border-[#E8E2D8] text-[#565C58] hover:border-[#DDD7CE]"
              }`}
            >
              Perlu Bimbingan
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-white rounded-2xl border border-[#F1CFC0] text-center space-y-2 shadow-xs">
            <p className="text-sm font-bold text-[#8C3713]">Gagal memuat data observasi</p>
            <p className="text-xs text-[#565C58]">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-2 px-4 py-2 bg-[#9C4322] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-[0.96]"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Daftar Kartu Siswa (Karakter Visual Persis Gambar Referensi) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 bg-white rounded-2xl border border-[#E8E2D8] p-4.5 animate-pulse"
              />
            ))}
          </div>
        ) : !error && students.length === 0 ? (
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F6F2E9] border border-[#E8E2D8] flex items-center justify-center text-[#9C4322]">
              <i className="mdi mdi-account-group-outline text-3xl" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#22352B]">
                Gelombang &ldquo;{batch?.batch_name}&rdquo; Belum Ada Siswa
              </p>
              <p className="text-xs text-[#565C58] mt-1 max-w-sm mx-auto leading-relaxed">
                Belum ada data siswa yang didaftarkan pada gelombang observasi ini.
              </p>
            </div>

            {/* Tombol Cepat Pindah ke Gelombang Lain yang Memiliki Siswa */}
            {batches.some((b) => b.id !== activeBatchId && (b.student_count ?? 0) > 0) && (
              <div className="pt-3 border-t border-[#E8E2D8]/60 space-y-2">
                <p className="text-[11px] font-bold text-[#787F7A]">
                  Pindah ke gelombang yang sudah berisi siswa:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {batches
                    .filter((b) => b.id !== activeBatchId && (b.student_count ?? 0) > 0)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleBatchChange(b.id)}
                        className="bg-[#E4EFE9] border border-[#CBE0D4] text-[#486B5A] hover:bg-[#D6E6DC] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.96]"
                      >
                        <i className="mdi mdi-swap-horizontal" />
                        <span>
                          {b.batch_name} ({b.student_count} Siswa)
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : !error && filteredStudents.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs text-center space-y-1">
            <i className="mdi mdi-account-search-outline text-4xl text-[#787F7A]" />
            <p className="text-sm font-bold text-[#22352B]">Tidak ada siswa yang sesuai</p>
            <p className="text-xs text-[#565C58]">
              {searchQuery ? "Silakan coba kata kunci lain." : "Belum ada siswa pada kategori filter ini."}
            </p>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredStudents.map((student) => {
              const ev = getStudentEvaluation(student.id);
              const isComplete = Boolean(ev?.is_complete);
              const score = ev?.total_score || 0;
              const hasRedFlag = Boolean(ev?.has_red_flag);
              const isNeedsGuidance = isComplete && (score < 2.5 || hasRedFlag);
              const isMandiri = isComplete && !isNeedsGuidance;

              const targetUrl = `/evaluator/${posNumber}/${student.id}${
                activeBatchId ? `?batch=${activeBatchId}` : ""
              }`;

              // Tentukan avatar style & status box sesuai gambar
              const avatarBg = isMandiri
                ? "bg-[#3D5A47] text-white"
                : isNeedsGuidance
                ? "bg-[#9C4322] text-white"
                : "bg-[#EFECE4] text-[#787F7A]";

              return (
                <article
                  key={student.id}
                  onClick={() => router.push(targetUrl)}
                  tabIndex={0}
                  role="link"
                  aria-label={`Buka observasi ${student.nickname || student.full_name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(targetUrl);
                    }
                  }}
                  className={`rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col justify-between gap-3 relative transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98] border ${
                    isNeedsGuidance
                      ? "bg-[#FDF9F7] border-[#F1CFC0]"
                      : isMandiri
                      ? "bg-white border-[#E8E2D8]"
                      : "bg-white border-[#E8E2D8]"
                  }`}
                >
                  {/* Baris Atas: Avatar + Nama + Kelompok + Gender */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar Bulat Bersih */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 shadow-2xs ${avatarBg}`}>
                        {student.nickname ? student.nickname.charAt(0).toUpperCase() : student.full_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-[#22352B] leading-tight truncate" title={student.nickname || student.full_name}>
                            {student.nickname || student.full_name}
                          </h3>
                          {student.nickname && (
                            <span className="text-[11px] text-[#787F7A] truncate font-normal">
                              ({student.full_name})
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#787F7A] mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                          {student.observation_group && (
                            <span className="font-bold text-[#9C4322] bg-[#FAF0E8] border border-[#F2D8C7] px-2 py-0.2 rounded-md text-[10px]">
                              {student.observation_group}
                            </span>
                          )}
                          <span>{calculateAge(student.birth_date)}</span>
                          <span>&bull;</span>
                          <span className="font-mono tabular-nums text-[#565C58]">
                            {student.registration_no}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge Ringkas Kanan Atas */}
                    {isComplete && (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs ${
                          isMandiri
                            ? "bg-[#E4EFE9] text-[#2E6B4D]"
                            : "bg-[#FAF0E8] text-[#9C4322]"
                        }`}
                        title={isMandiri ? "Mandiri & Konsisten" : "Dengan Bimbingan"}
                      >
                        <i className="mdi mdi-check text-base font-black" />
                      </div>
                    )}
                  </div>

                  {/* ─── KOTAK SNAPSHOT PROGRES OBSERVASI (Persis Gambar Referensi) ─── */}
                  <div>
                    {isMandiri ? (
                      <div className="bg-[#EAF3EE] text-[#2E6B4D] border border-[#CFE4D7] rounded-xl p-2.5 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <i className="mdi mdi-shield-check-outline text-sm" />
                          <span>Mandiri &amp; Konsisten</span>
                        </span>
                        <span className="font-mono font-extrabold tabular-nums">
                          Skor: {score.toFixed(1)} / 3.0
                        </span>
                      </div>
                    ) : isNeedsGuidance ? (
                      <div className="bg-[#FAF0E8] text-[#9C4322] border border-[#F2D8C7] rounded-xl p-2.5 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <i className="mdi mdi-alert-circle-outline text-sm" />
                          <span>Perlu Bimbingan / Sinyal Adaptif</span>
                        </span>
                        <span className="font-mono font-extrabold tabular-nums">
                          Skor: {score.toFixed(1)} / 3.0
                        </span>
                      </div>
                    ) : (
                      <div className="bg-[#FAF8F5] text-[#787F7A] border border-[#E8E2D8] rounded-xl p-2.5 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <i className="mdi mdi-clock-outline text-sm text-[#A8A09A]" />
                          <span>Belum diobservasi di pos ini</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#9C4322]">
                          Siap dinilai
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Baris Bawah: Status Pill + Tombol Aksi */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#FAF8F5]">
                    {isComplete ? (
                      <span className="text-[11px] font-bold text-[#2E6B4D] flex items-center gap-1">
                        <i className="mdi mdi-check-circle text-xs" />
                        <span>Selesai Dievaluasi</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#787F7A]">
                        Menunggu Asesmen
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(targetUrl);
                      }}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.96] ${
                        isComplete
                          ? "bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#22352B] border border-[#E8E2D8]"
                          : "bg-[#9C4322] hover:bg-[#84371B] text-white"
                      }`}
                    >
                      <span>{isComplete ? "Lihat / Edit" : "Mulai Observasi"}</span>
                      <i className={`mdi ${isComplete ? "mdi-pencil-outline text-xs text-[#9C4322]" : "mdi-arrow-right text-sm"}`} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
