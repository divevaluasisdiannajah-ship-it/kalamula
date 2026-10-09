"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Scales,
  Target,
  Warning,
  PushPin,
  User,
  FileText,
  ArrowsLeftRight,
  X,
} from "@phosphor-icons/react";
import type { Batch, ClassBalance, StudentProfile, AssignedClass } from "@/types";

export default function AdminClassesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [balancing, setBalancing] = useState(false);

  const [classA, setClassA] = useState<ClassBalance | null>(null);
  const [classB, setClassB] = useState<ClassBalance | null>(null);
  const [unassigned, setUnassigned] = useState<StudentProfile[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [balanceScore, setBalanceScore] = useState<number | null>(null);

  // Swap modal state
  const [swapTarget, setSwapTarget] = useState<{
    student: StudentProfile;
    currentClass: AssignedClass;
    targetClass: AssignedClass;
  } | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const [swapping, setSwapping] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        const json = await res.json();
        const batchList: Batch[] = json.data || [];
        setBatches(batchList);
        if (batchList.length > 0) {
          const activeBatch = batchList.find((b) => b.status === "active") || batchList[0];
          setSelectedBatchId(activeBatch.id);
        }
      }
    } catch {
      // offline handling
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlacements = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/balance?batch_id=${batchId}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setClassA(data.classA);
        setClassB(data.classB);
        setUnassigned(data.unassigned || []);
        setWarnings(data.warnings || []);
        setBalanceScore(data.balanceScore ?? null);
      }
    } catch {
      // offline handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatchId) {
      loadPlacements(selectedBatchId);
    }
  }, [selectedBatchId, loadPlacements]);

  // Close swap modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && swapTarget) {
        setSwapTarget(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [swapTarget]);

  const handleRunAutoBalancer = async () => {
    if (!selectedBatchId) return;
    setBalancing(true);
    try {
      const res = await fetch("/api/classes/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: selectedBatchId }),
      });
      if (res.ok) {
        loadPlacements(selectedBatchId);
      } else {
        alert("Gagal menjalankan algoritma penyeimbang kelas.");
      }
    } catch {
      alert("Koneksi gagal.");
    } finally {
      setBalancing(false);
    }
  };

  const executeSwap = async () => {
    if (!swapTarget || !selectedBatchId) return;
    setSwapping(true);
    try {
      const res = await fetch("/api/classes/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: swapTarget.student.student.id,
          batch_id: selectedBatchId,
          target_class: swapTarget.targetClass,
          override_reason: swapReason || "Penyesuaian manual oleh koordinator",
        }),
      });

      if (res.ok) {
        setSwapTarget(null);
        setSwapReason("");
        loadPlacements(selectedBatchId);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memindahkan siswa.");
      }
    } catch {
      alert("Koneksi gagal.");
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Pembagian Kelas Otomatis</h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-0.5">
            Penyeimbang Kelas 1A & 1B Secara Merata (Kapasitas Maksimal 56 Calon Siswa)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="h-11 rounded-xl px-3.5 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] font-bold border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name} ({b.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunAutoBalancer}
            disabled={balancing || !selectedBatchId}
            className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white px-5 text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-[0.98] font-bold focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            <Scales weight="light" size={18} />
            <span>{balancing ? "Memproses..." : "Bagi Kelas Secara Merata"}</span>
          </button>
        </div>
      </div>

      {/* Warnings & Balance Score Alert */}
      {balanceScore !== null && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#D4E2D8] flex items-center justify-between shadow-[0_4px_20px_-2px_rgba(92,124,104,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0">
              <Target weight="light" size={24} className="text-[#3D7A5A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E2320]">
                Tingkat Keseimbangan Kelas: {balanceScore} / 100
              </p>
              <p className="text-xs text-[#565C58]">
                Pembagian kelas menyeimbangkan jenis kelamin, kebutuhan khusus, tingkat membaca, dan nilai rata-rata siswa.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-[#F0F4F1] text-[#3D7A5A] rounded-full border border-[#D4E2D8]">
            Optimal
          </span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#FAF0E8] rounded-2xl p-4 space-y-1 border border-[#F2D8C7]">
          <p className="text-xs font-bold text-[#C9733B] flex items-center gap-1.5">
            <Warning weight="light" size={16} />
            <span>Catatan Keseimbangan Kelas:</span>
          </p>
          <ul className="list-disc list-inside text-xs text-[#8C4620] space-y-0.5 font-medium">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Real-Time Comparative Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClassMetricCard label="Kelas 1A" badgeColor="bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8]" balance={classA} />
        <ClassMetricCard label="Kelas 1B" badgeColor="bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]" balance={classB} />
      </div>

      {/* Unassigned Students Alert (if any) */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F2D8C7] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[#C9733B] flex items-center gap-1.5">
              <PushPin weight="light" size={14} />
              <span>Siswa Belum Ditempatkan ({unassigned.length} anak):</span>
            </p>
            <span className="text-[10px] text-[#787F7A]">Klik &quot;Bagi Kelas Secara Merata&quot; untuk membagi otomatis</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <span
                key={p.student.id}
                className="text-xs bg-[#FAF8F5] px-2.5 py-1 rounded-full text-[#1E2320] border border-[#E5E0D8]"
              >
                {p.student.nickname} ({p.student.gender})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dual Column Class Rosters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kelas 1A Column */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF8F5]">
            <h3 className="font-bold text-sm text-[#1E2320] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center font-bold text-xs shadow-2xs border border-[#D4E2D8]">
                1A
              </span>
              <span>Daftar Siswa Kelas 1A ({classA?.students.length || 0} / 28)</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {classA?.students.map((profile, i) => (
              <StudentRosterCard
                key={profile.student.id}
                index={i + 1}
                profile={profile}
                currentClass="1A"
                onSwap={() =>
                  setSwapTarget({
                    student: profile,
                    currentClass: "1A",
                    targetClass: "1B",
                  })
                }
              />
            ))}
            {(!classA || classA.students.length === 0) && (
              <div className="p-8 text-center text-xs text-[#787F7A] italic">
                Belum ada siswa di Kelas 1A
              </div>
            )}
          </div>
        </div>

        {/* Kelas 1B Column */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#FAF8F5]">
            <h3 className="font-bold text-sm text-[#1E2320] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FAF0E8] text-[#C9733B] flex items-center justify-center font-bold text-xs shadow-2xs border border-[#F2D8C7]">
                1B
              </span>
              <span>Daftar Siswa Kelas 1B ({classB?.students.length || 0} / 28)</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {classB?.students.map((profile, i) => (
              <StudentRosterCard
                key={profile.student.id}
                index={i + 1}
                profile={profile}
                currentClass="1B"
                onSwap={() =>
                  setSwapTarget({
                    student: profile,
                    currentClass: "1B",
                    targetClass: "1A",
                  })
                }
              />
            ))}
            {(!classB || classB.students.length === 0) && (
              <div className="p-8 text-center text-xs text-[#787F7A] italic">
                Belum ada siswa di Kelas 1B
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Swap Reason Modal */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#1E2320]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSwapTarget(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(30,35,32,0.25)] z-10 space-y-4 font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="text-base font-bold text-[#1E2320] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center">
                  <ArrowsLeftRight weight="light" size={18} />
                </div>
                <span>Pindah Kelas: {swapTarget.student.student.full_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSwapTarget(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                aria-label="Tutup"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            <p className="text-xs text-[#565C58]">
              Pindahkan siswa dari <strong>Kelas {swapTarget.currentClass}</strong> ke{" "}
              <strong>Kelas {swapTarget.targetClass}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1">
                  Alasan Pemindahan Manual (Wajib Diisi):
                </label>
                <textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Contoh: Permintaan khusus orang tua, koordinasi pendampingan terapi, dsb."
                  rows={3}
                  className="w-full rounded-xl p-3 text-xs bg-[#FAF8F5] text-[#1E2320] placeholder:text-[#A8A09A] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSwapTarget(null)}
                  className="h-11 px-4 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold rounded-xl border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeSwap}
                  disabled={swapping || !swapReason.trim()}
                  className="h-11 px-5 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  {swapping ? "Menyimpan..." : "Konfirmasi Pindah"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassMetricCard({
  label,
  badgeColor,
  balance,
}: {
  label: string;
  badgeColor: string;
  balance: ClassBalance | null;
}) {
  if (!balance) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#FAF8F5]">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
          {label}
        </span>
        <span className="text-xs text-[#565C58] font-medium">
          Total: <strong className="text-[#1E2320] text-sm font-bold">{balance.total}</strong> / 28 Siswa
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D8]">
          <span className="text-[10px] text-[#787F7A] block font-bold">Gender</span>
          <span className="font-extrabold text-[#1E2320]">{balance.male_count}L</span> /{" "}
          <span className="font-extrabold text-[#8C4620]">{balance.female_count}P</span>
        </div>

        <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D8]">
          <span className="text-[10px] text-[#787F7A] block font-bold">Pendampingan</span>
          <span
            className={`font-black ${
              balance.red_flag_count > 0 ? "text-[#C9733B]" : "text-[#787F7A]"
            }`}
          >
            {balance.red_flag_count} Anak
          </span>
        </div>

        <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D8]">
          <span className="text-[10px] text-[#787F7A] block font-bold">Rerata Skor</span>
          <span className="font-black text-[#1E2320]">{balance.avg_score}</span>
        </div>

        <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E8E2D8]">
          <span className="text-[10px] text-[#787F7A] block font-bold">Literasi</span>
          <span className="font-bold text-xs text-[#1E2320]">
            {balance.reading_level_distribution.L1 + balance.reading_level_distribution.L2} (A) /{" "}
            {balance.reading_level_distribution.L3 + balance.reading_level_distribution.L4} (B)
          </span>
        </div>
      </div>
    </div>
  );
}

function StudentRosterCard({
  index,
  profile,
  currentClass,
  onSwap,
}: {
  index: number;
  profile: StudentProfile;
  currentClass: AssignedClass;
  onSwap: () => void;
}) {
  const { student } = profile;

  return (
    <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E8E2D8] hover:border-[#5C7C68]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <span className="text-xs font-mono font-bold text-[#787F7A] w-5 text-right flex-shrink-0">
          {index}.
        </span>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs font-bold ${
            student.gender === "L" ? "bg-[#E8EDF2] text-[#283747]" : "bg-[#FAF0E8] text-[#8C4620] border border-[#F2D8C7]"
          }`}
        >
          <User weight="light" size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-[#1E2320] truncate">{student.full_name}</p>
            {profile.has_any_red_flag && <Warning weight="light" size={13} className="text-[#C9733B]" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-[#565C58] mt-0.5">
            <span>&ldquo;{student.nickname}&rdquo;</span>
            <span>&bull;</span>
            <span>Skor: <strong className="text-[#1E2320]">{profile.overall_score || "-"}</strong></span>
            {profile.reading_level && (
              <>
                <span>&bull;</span>
                <span className="font-bold text-[#1E2320]">{profile.reading_level}</span>
              </>
            )}
            {profile.placement?.manual_override && (
              <span className="text-[#C9733B] font-bold bg-[#FAF0E8] px-1 rounded border border-[#F2D8C7]">Manual</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end flex-shrink-0">
        <a
          href={`/reports/student/${student.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 bg-white text-[#1E2320] hover:bg-[#FAF8F5] px-2.5 text-xs rounded-xl border border-[#E5E0D8] flex items-center gap-1 transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
          title="Lihat Laporan PDF"
        >
          <FileText weight="light" size={14} />
          <span>PDF</span>
        </a>

        <button
          onClick={onSwap}
          className="h-8 bg-[#C9733B] hover:bg-[#B8632E] text-white text-xs font-bold px-3 rounded-xl shadow-xs flex items-center gap-1 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
          title={`Pindah ke Kelas ${currentClass === "1A" ? "1B" : "1A"}`}
        >
          <ArrowsLeftRight weight="light" size={14} />
          <span>Pindah</span>
        </button>
      </div>
    </div>
  );
}
