"use client";
export const runtime = 'edge';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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

  // Tab State: SPMB Class Balancer vs Classroom PIN Management
  const [activeTab, setActiveTab] = useState<"spmb" | "pins">("spmb");

  // Classroom PIN Management State (Kelas 1A - 6B)
  const [classList, setClassList] = useState<Array<{
    id: string;
    grade: number;
    section: "A" | "B";
    name: string;
    teacher_name?: string | null;
    pin: string;
    student_count?: number;
  }>>([]);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [savingPinId, setSavingPinId] = useState<string | null>(null);
  const [pinNotice, setPinNotice] = useState<string>("");

  const loadClassList = useCallback(async () => {
    try {
      const res = await fetch("/api/classrooms?admin=true");
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setClassList(list);
        const initialInputs: Record<string, string> = {};
        list.forEach((c: { id: string; pin: string }) => {
          initialInputs[c.id] = c.pin || "1234";
        });
        setPinInputs(initialInputs);
      }
    } catch {
      // offline fallback
    }
  }, []);

  const handleUpdatePin = async (id: string) => {
    const newPin = pinInputs[id];
    if (!newPin || newPin.length < 4) {
      alert("PIN harus minimal 4 karakter");
      return;
    }
    setSavingPinId(id);
    setPinNotice("");
    try {
      const res = await fetch(`/api/classrooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_pin: newPin }),
      });
      const json = await res.json();
      if (res.ok) {
        setPinNotice(`PIN Kelas ${id} berhasil diperbarui menjadi ${newPin}`);
        setTimeout(() => setPinNotice(""), 3000);
        loadClassList();
      } else {
        alert(json.error || "Gagal memperbarui PIN");
      }
    } catch {
      alert("Koneksi gagal");
    } finally {
      setSavingPinId(null);
    }
  };

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
        setBalanceScore(data.balanceScore ?? data.overallBalanceScore ?? null);
      }
    } catch {
      // offline handling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
    loadClassList();
  }, [loadBatches, loadClassList]);

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
        await loadPlacements(selectedBatchId);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Gagal menjalankan algoritma penyeimbang kelas.");
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
    <div className="space-y-6 font-sans">
      {/* Top Bar Navigation & Badge */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#E8E2D8] text-xs font-bold text-[#486B5A] hover:bg-white hover:text-[#22352B] transition-colors shadow-2xs"
        >
          <i className="mdi mdi-arrow-left text-sm" />
          <span>Dashboard Admin</span>
        </Link>
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#EFE7D6] text-[#7D5327]">
          PEMBAGIAN KELAS
        </span>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#EFECE4] rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("spmb")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "spmb"
              ? "bg-white text-[#22352B] shadow-2xs"
              : "text-[#565C58] hover:text-[#22352B]"
          }`}
        >
          <i className="mdi mdi-scale-balance text-base" />
          <span>Pembagian Kelas SPMB (Calon Siswa)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pins")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === "pins"
              ? "bg-white text-[#22352B] shadow-2xs"
              : "text-[#565C58] hover:text-[#22352B]"
          }`}
        >
          <i className="mdi mdi-shield-key-outline text-base" />
          <span>Kelola Akses &amp; PIN Guru Kelas (1A s.d. 6B)</span>
        </button>
      </div>

      {activeTab === "spmb" && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#22352B] tracking-tight">
                Pembagian Kelas Otomatis
              </h1>
              <p className="text-xs sm:text-sm text-[#565C58] mt-1">
                Penyeimbang Kelas 1A & 1B secara merata berbasis profil asesmen calon siswa.
              </p>
            </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="h-11 rounded-2xl px-3.5 text-xs sm:text-sm bg-white text-[#22352B] font-bold border border-[#E8E2D8] shadow-2xs focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
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
            className="h-11 bg-[#B85627] hover:bg-[#A34B21] text-white px-5 text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-[0.98] font-bold focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            <i className={`mdi ${balancing ? "mdi-loading mdi-spin" : "mdi-scale-balance"} text-lg`} />
            <span>{balancing ? "Memproses..." : "Bagi Kelas Secara Merata"}</span>
          </button>
        </div>
      </div>

      {/* Warnings & Balance Score Alert */}
      {balanceScore !== null && (
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center shadow-xs flex-shrink-0">
              <i className="mdi mdi-target text-2xl" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#22352B]">
                Tingkat Keseimbangan Kelas: {balanceScore} / 100
              </p>
              <p className="text-xs text-[#565C58] mt-0.5">
                Algoritma menyeimbangkan rasio gender, sinyal pendampingan, tingkat membaca, dan rata-rata skor kesiapan.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs font-extrabold px-3.5 py-1.5 bg-[#E4EFE9] text-[#486B5A] rounded-full border border-[#CBE0D4]">
            Optimal Terdistribusi
          </span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#F9E6DC] rounded-3xl p-5 space-y-1.5 border border-[#F1CFC0]">
          <p className="text-xs font-extrabold text-[#8C3713] flex items-center gap-1.5">
            <i className="mdi mdi-alert text-base" />
            <span>Catatan Keseimbangan Kelas:</span>
          </p>
          <ul className="list-disc list-inside text-xs text-[#8C3713] space-y-0.5 font-medium">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Real-Time Comparative Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClassMetricCard
          label="Kelas 1A"
          badgeColor="bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4]"
          balance={classA}
        />
        <ClassMetricCard
          label="Kelas 1B"
          badgeColor="bg-[#EFE7D6] text-[#7D5327] border border-[#E5DAC6]"
          balance={classB}
        />
      </div>

      {/* Unassigned Students Alert (if any) */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-[#F1CFC0] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <p className="text-xs font-extrabold text-[#8C3713] flex items-center gap-1.5">
              <i className="mdi mdi-pin text-sm text-[#B85627]" />
              <span>Siswa Belum Ditempatkan ({unassigned.length} anak):</span>
            </p>
            <span className="text-[11px] text-[#565C58]">
              Klik tombol &quot;Bagi Kelas Secara Merata&quot; di atas untuk pembagian otomatis.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <span
                key={p.student.id}
                className="text-xs bg-[#FAF8F5] px-3 py-1.5 rounded-full text-[#22352B] font-semibold border border-[#E8E2D8]"
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
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8]/60 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F5]">
            <h3 className="font-extrabold text-sm sm:text-base text-[#22352B] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center font-extrabold text-xs shadow-2xs border border-[#CBE0D4]">
                1A
              </span>
              <span>Daftar Siswa Kelas 1A ({classA?.students.length || 0} / 28)</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
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
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8]/60 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F5]">
            <h3 className="font-extrabold text-sm sm:text-base text-[#22352B] flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#EFE7D6] text-[#7D5327] flex items-center justify-center font-extrabold text-xs shadow-2xs border border-[#E5DAC6]">
                1B
              </span>
              <span>Daftar Siswa Kelas 1B ({classB?.students.length || 0} / 28)</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
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
      </div>
      )}

      {/* ─── TAB 2: TEACHER PIN MANAGEMENT (KELAS 1A - 6B) ─── */}
      {activeTab === "pins" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#22352B] tracking-tight">
                Pengaturan Akses &amp; PIN Guru Kelas (1A s.d. 6B)
              </h2>
              <p className="text-xs sm:text-sm text-[#565C58] mt-1">
                Kelola 4-digit PIN masuk untuk guru masing-masing rombel ruang kelas SDIT An-Najah.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#E4EFE9] text-[#486B5A] px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#CBE0D4]">
              <i className="mdi mdi-lock-check-outline text-base" />
              <span>12 Rombel Aktif</span>
            </div>
          </div>

          {pinNotice && (
            <div className="p-4 bg-[#E4EFE9] text-[#486B5A] text-xs font-bold rounded-2xl border border-[#CBE0D4] flex items-center gap-2 shadow-2xs animate-in fade-in">
              <i className="mdi mdi-check-circle text-lg" />
              <span>{pinNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classList.map((c) => {
              const currentInput = pinInputs[c.id] || "";
              const isSaving = savingPinId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-[#22352B]">
                        {c.name}
                      </span>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EFECE4] text-[#22352B]">
                        {c.grade <= 2 ? "Fase A" : c.grade <= 4 ? "Fase B" : "Fase C"}
                      </span>
                    </div>

                    <p className="text-xs text-[#565C58] flex items-center gap-1.5">
                      <i className="mdi mdi-account-tie-outline text-sm text-[#486B5A]" />
                      <span className="font-semibold">{c.teacher_name || "Guru Kelas"}</span>
                    </p>

                    <p className="text-[11px] text-[#787F7A]">
                      {c.student_count ?? 0} Siswa Terdaftar &bull; T.A. 2026/2027
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F6F3EC] space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#787F7A] block">
                      4-Digit PIN Masuk:
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <i className="mdi mdi-key-outline absolute left-3 top-2.5 text-base text-[#787F7A]" />
                        <input
                          type="text"
                          maxLength={6}
                          value={currentInput}
                          onChange={(e) =>
                            setPinInputs({
                              ...pinInputs,
                              [c.id]: e.target.value,
                            })
                          }
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs font-mono font-bold text-[#22352B] focus:outline-none focus:ring-2 focus:ring-[#486B5A]"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isSaving || currentInput === c.pin}
                        onClick={() => handleUpdatePin(c.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#486B5A] hover:bg-[#22352B] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                      >
                        {isSaving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>

                    <p className="text-[10px] text-[#787F7A]">
                      PIN saat ini: <code className="font-mono font-bold text-[#22352B]">{c.pin}</code>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Swap Reason Modal */}
      {swapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSwapTarget(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-2xl z-10 space-y-4 font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="text-base font-extrabold text-[#22352B] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E4EFE9] text-[#486B5A] flex items-center justify-center">
                  <i className="mdi mdi-swap-horizontal text-lg" />
                </div>
                <span>Pindah Kelas: {swapTarget.student.student.full_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSwapTarget(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E8E2D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#486B5A]"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-base" />
              </button>
            </div>

            <p className="text-xs text-[#565C58]">
              Pindahkan siswa dari <strong>Kelas {swapTarget.currentClass}</strong> ke{" "}
              <strong>Kelas {swapTarget.targetClass}</strong>
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-extrabold text-[#22352B] uppercase tracking-wider block mb-1.5">
                  Alasan Pemindahan Manual (Wajib Diisi):
                </label>
                <textarea
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Contoh: Permintaan khusus orang tua, koordinasi pendampingan terapi, rekomendasi guru, dsb."
                  rows={3}
                  className="w-full rounded-2xl p-3.5 text-xs bg-[#FAF8F5] text-[#22352B] placeholder:text-[#A8A09A] border border-[#E8E2D8] focus-visible:ring-2 focus-visible:ring-[#486B5A] focus-visible:ring-offset-2 focus-visible:outline-none resize-none transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSwapTarget(null)}
                  className="h-11 px-5 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#22352B] text-xs font-bold rounded-2xl border border-[#E8E2D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#486B5A]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeSwap}
                  disabled={swapping || !swapReason.trim()}
                  className="h-11 px-6 bg-[#B85627] hover:bg-[#A34B21] text-white text-xs font-bold rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#486B5A]"
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8]/60 shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#FAF8F5]">
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${badgeColor}`}>
          {label}
        </span>
        <span className="text-xs text-[#565C58] font-medium">
          Total: <strong className="text-[#22352B] text-sm font-extrabold">{balance.total}</strong> / 28 Siswa
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E8E2D8]/60">
          <span className="text-[10px] text-[#787F7A] block font-bold">Gender</span>
          <span className="font-extrabold text-[#22352B]">{balance.male_count}L</span> /{" "}
          <span className="font-extrabold text-[#8C3713]">{balance.female_count}P</span>
        </div>

        <div className={`p-2.5 rounded-2xl border ${balance.red_flag_count > 0 ? "bg-[#F9E6DC] border-[#F1CFC0]" : "bg-[#FAF8F5] border-[#E8E2D8]/60"}`}>
          <span className="text-[10px] text-[#787F7A] block font-bold">Pendampingan</span>
          <span
            className={`font-extrabold ${
              balance.red_flag_count > 0 ? "text-[#8C3713]" : "text-[#787F7A]"
            }`}
          >
            {balance.red_flag_count} Anak
          </span>
        </div>

        <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E8E2D8]/60">
          <span className="text-[10px] text-[#787F7A] block font-bold">Rerata Skor</span>
          <span className="font-extrabold text-[#22352B]">{balance.avg_score}</span>
        </div>

        <div className="bg-[#EFE7D6]/50 p-2.5 rounded-2xl border border-[#E5DAC6]/60">
          <span className="text-[10px] text-[#7D5327] block font-bold">Literasi (A / B)</span>
          <span className="font-extrabold text-xs text-[#7D5327]">
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
    <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E8E2D8]/70 hover:border-[#486B5A]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-mono font-bold text-[#787F7A] w-5 text-right flex-shrink-0">
          {index}.
        </span>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
            student.gender === "L"
              ? "bg-[#E4EAF2] text-[#36506C]"
              : "bg-[#F9E6DC] text-[#8C3713]"
          }`}
        >
          <i className="mdi mdi-account text-lg" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-extrabold text-[#22352B] truncate">{student.full_name}</p>
            {profile.has_any_red_flag && <i className="mdi mdi-alert text-xs text-[#B85627]" title="Perhatian Khusus" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-[#565C58] mt-0.5">
            <span>&ldquo;{student.nickname}&rdquo;</span>
            <span>&bull;</span>
            <span>Skor: <strong className="text-[#22352B]">{profile.overall_score || "-"}</strong></span>
            {profile.reading_level && (
              <>
                <span>&bull;</span>
                <span className="font-extrabold text-[#22352B]">{profile.reading_level}</span>
              </>
            )}
            {profile.placement?.manual_override && (
              <span className="text-[#8C3713] font-bold bg-[#F9E6DC] px-1.5 py-0.5 rounded-full border border-[#F1CFC0]">
                Manual
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end flex-shrink-0">
        <a
          href={`/reports/student/${student.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 bg-white text-[#22352B] hover:bg-[#FAF8F5] px-2.5 text-xs rounded-xl border border-[#E8E2D8] flex items-center gap-1.5 transition-colors font-bold shadow-2xs focus-visible:ring-2 focus-visible:ring-[#486B5A]"
          title="Lihat Laporan PDF"
        >
          <i className="mdi mdi-file-document-outline text-sm" />
          <span>PDF</span>
        </a>

        <button
          onClick={onSwap}
          className="h-8 bg-[#B85627] hover:bg-[#A34B21] text-white text-xs font-bold px-3 rounded-xl shadow-xs flex items-center gap-1 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#486B5A]"
          title={`Pindah ke Kelas ${currentClass === "1A" ? "1B" : "1A"}`}
        >
          <i className="mdi mdi-swap-horizontal text-sm" />
          <span>Pindah</span>
        </button>
      </div>
    </div>
  );
}
