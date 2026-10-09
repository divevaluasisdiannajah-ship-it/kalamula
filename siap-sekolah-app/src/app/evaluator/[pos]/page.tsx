"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudentHeroCard } from "@/components/aetrium/StudentHeroCard";
import {
  ArrowLeft,
  MagnifyingGlass,
  X,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
import type { Student, Evaluation, AssessmentConfig, Batch } from "@/types";

export default function EvaluatorStudentListPage() {
  const params = useParams();
  const router = useRouter();
  const posNumber = Number(params.pos);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "done">("all");

  const loadData = useCallback(async () => {
    try {
      // Get active batch
      const batchRes = await fetch("/api/batches");
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        const activeBatch = (batchData.data || []).find(
          (b: { status: string }) => b.status === "active"
        ) || batchData.data?.[0];

        if (activeBatch) {
          setBatch(activeBatch);
          setActiveBatchId(activeBatch.id);

          // Load students for this batch
          const sRes = await fetch(`/api/students?batch_id=${activeBatch.id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            setStudents(sData.data || []);
          }

          // Load evaluations for this batch & pos
          const eRes = await fetch(`/api/evaluations?batch_id=${activeBatch.id}&pos_number=${posNumber}`);
          if (eRes.ok) {
            const eData = await eRes.json();
            setEvaluations(eData.data || []);
          }
        }
      }

      // Load config for this pos
      const cRes = await fetch("/api/configs");
      if (cRes.ok) {
        const cData = await cRes.json();
        const posConfig = (cData.data || []).find(
          (c: AssessmentConfig) => c.pos_number === posNumber && c.is_active
        );
        setConfig(posConfig || null);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, [posNumber]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStudentEvaluation = useCallback(
    (studentId: string) => {
      return evaluations.find((e) => e.student_id === studentId);
    },
    [evaluations]
  );

  const completionStats = useMemo(() => {
    if (students.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = students.filter((s) => {
      const ev = getStudentEvaluation(s.id);
      return ev?.is_complete;
    }).length;
    return {
      percent: Math.round((completed / students.length) * 100),
      completed,
      total: students.length,
    };
  }, [students, getStudentEvaluation]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const ev = getStudentEvaluation(student.id);
      const isComplete = ev?.is_complete;

      if (filterTab === "pending" && isComplete) return false;
      if (filterTab === "done" && !isComplete) return false;

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
  }, [students, filterTab, searchQuery, getStudentEvaluation]);

  const POS_METADATA: Record<number, { name: string; focus: string }> = {
    1: { name: "Kedatangan, Kemandirian & Kematangan Emosi", focus: "Kemandirian berpisah & etika santun mengantre." },
    2: { name: "Motorik Kasar & Koordinasi Fisik", focus: "Keseimbangan meniti & koordinasi gerak mata-tangan." },
    3: { name: "Kematangan Kognitif & Numerasi Dasar", focus: "Pola atribut warna/ukuran & konsep kuantitas." },
    4: { name: "Bahasa Lisan, Pra-Literasi & Motorik Halus", focus: "Pemahaman cerita, memegang pensil & tahap membaca." },
    5: { name: "Bermain Bebas, Interaksi Sosial & Kerjasama", focus: "Regulasi emosi, berbagi mainan & empati kelompok." },
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E2320] pb-24 font-sans">
      {/* Sticky Header with Soft Shadow */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/evaluator")}
            className="text-[#3D7A5A] hover:text-[#1E2320] text-xs font-bold inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <ArrowLeft weight="light" size={15} />
            <span>Ganti Pos</span>
          </button>
          <div className="flex items-center gap-2 bg-[#F0F4F1] border border-[#D4E2D8] px-3.5 py-1.5 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#5C7C68] animate-pulse" />
            <span className="text-[11px] font-bold text-[#3D7A5A]">
              Pos {posNumber} Aktif
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Pos Heading with Progress Overview */}
        <div className="border-b border-[#E8E2D8] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-brand text-lg sm:text-xl font-bold text-[#1E2320] tracking-tight">
              Observasi Pos {posNumber}: {config?.pos_name || POS_METADATA[posNumber]?.name || "Memuat..."}
            </h1>
            <p className="text-xs sm:text-sm text-[#565C58] font-medium mt-1">
              {batch?.batch_name || "Gelombang Observasi Calon Siswa"} &bull; {POS_METADATA[posNumber]?.focus || "Catat respons autentik anak dengan penuh empati."}
            </p>
          </div>
          {students.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3.5 py-1.5 rounded-xl border border-[#E8E2D8] shadow-2xs">
              <span className="text-[11px] font-bold text-[#565C58]">Progres Pos:</span>
              <span className="text-xs font-black text-[#1E2320]">
                {completionStats.completed} / {completionStats.total} ({completionStats.percent}%)
              </span>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#787F7A] pointer-events-none">
              <MagnifyingGlass weight="light" size={17} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama lengkap, nama panggilan, atau no. reg..."
              className="w-full h-11 rounded-xl shadow-xs pl-10 pr-9 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] placeholder:text-[#A8A09A] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#787F7A] hover:text-[#1E2320] p-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] rounded-md transition-colors"
                aria-label="Bersihkan pencarian"
              >
                <X weight="light" size={15} />
              </button>
            )}
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
            <button
              onClick={() => setFilterTab("all")}
              className={`h-11 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 ${
                filterTab === "all"
                  ? "bg-[#C9733B] text-white shadow-xs font-black"
                  : "bg-[#FAF8F5] text-[#565C58] hover:bg-[#F3EFE8] border border-[#E5E0D8]"
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`h-11 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 ${
                filterTab === "pending"
                  ? "bg-[#C9733B] text-white shadow-xs font-black"
                  : "bg-[#FAF8F5] text-[#565C58] hover:bg-[#F3EFE8] border border-[#E5E0D8]"
              }`}
            >
              Belum ({students.length - completionStats.completed})
            </button>
            <button
              onClick={() => setFilterTab("done")}
              className={`h-11 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 ${
                filterTab === "done"
                  ? "bg-[#C9733B] text-white shadow-xs font-black"
                  : "bg-[#FAF8F5] text-[#565C58] hover:bg-[#F3EFE8] border border-[#E5E0D8]"
              }`}
            >
              Selesai ({completionStats.completed})
            </button>
          </div>
        </div>

        {/* Student Cards Grid using StudentHeroCard */}
        {loading ? (
          <div className="text-center py-16 text-xs text-[#565C58] animate-pulse font-medium">
            Memuat daftar calon siswa...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 sm:p-12 bg-white rounded-2xl border border-[#E8E2D8] shadow-xs text-center">
            <MagnifyingGlass weight="light" size={40} className="text-[#787F7A] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1E2320]">Tidak ada siswa yang ditemukan</p>
            <p className="text-xs text-[#565C58] mt-1">
              {searchQuery ? "Silakan coba kata kunci lain." : "Belum ada siswa pada filter ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const ev = getStudentEvaluation(student.id);
              const isComplete = Boolean(ev?.is_complete);
              const hasRedFlag = Boolean(ev?.has_red_flag);

              return (
                <StudentHeroCard
                  key={student.id}
                  student={student}
                  completionRate={isComplete ? 100 : ev ? 50 : 0}
                  overallScore={ev?.total_score || null}
                  readingLevel={posNumber === 4 ? ev?.reading_level : null}
                  hasRedFlag={hasRedFlag}
                  onClick={() =>
                    router.push(
                      `/evaluator/${posNumber}/${student.id}${
                        activeBatchId ? `?batch=${activeBatchId}` : ""
                      }`
                    )
                  }
                  actionSlot={
                    <span
                      className={`h-10 px-3.5 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all ${
                        isComplete
                          ? "bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8]"
                          : "bg-[#C9733B] hover:bg-[#B8632E] text-white shadow-xs active:scale-95"
                      }`}
                    >
                      {isComplete ? (
                        <>
                          <Check weight="bold" size={14} className="text-[#3D7A5A]" />
                          <span>Lihat Jurnal</span>
                        </>
                      ) : (
                        <>
                          <span>Catat Observasi</span>
                          <CaretRight weight="bold" size={13} />
                        </>
                      )}
                    </span>
                  }
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
