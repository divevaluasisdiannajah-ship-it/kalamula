export const runtime = 'edge';
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  CalendarBlank,
  NotePencil,
  Play,
  PencilSimple,
  Trash,
  LockKey,
  CheckCircle,
  FileDashed,
  X,
} from "@phosphor-icons/react";
import type { Batch } from "@/types";

type ModalMode = "create" | "edit" | null;

export default function BatchManagerPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({ batch_name: "", batch_date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.data || []);
      }
    } catch { /* offline fallback */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal) {
        setModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal]);

  const openCreate = () => {
    setForm({ batch_name: "", batch_date: new Date().toISOString().split("T")[0], notes: "" });
    setEditBatch(null);
    setModal("create");
  };

  const openEdit = (batch: Batch) => {
    setForm({ batch_name: batch.batch_name, batch_date: batch.batch_date, notes: batch.notes || "" });
    setEditBatch(batch);
    setModal("edit");
  };

  const handleSubmit = async () => {
    if (!form.batch_name.trim() || !form.batch_date) return;
    setSubmitting(true);
    try {
      if (modal === "create") {
        await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else if (modal === "edit" && editBatch) {
        await fetch(`/api/batches/${editBatch.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch_name: form.batch_name, notes: form.notes }),
        });
      }
      setModal(null);
      loadBatches();
    } catch { /* handle error */ }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (batch: Batch, newStatus: string) => {
    const confirmMsg: Record<string, string> = {
      active: `Aktifkan gelombang "${batch.batch_name}"? Evaluator akan bisa mulai input data observasi.`,
      locked: `Kunci gelombang "${batch.batch_name}"? Evaluator tidak bisa mengubah data lagi.`,
    };
    if (!confirm(confirmMsg[newStatus] || "Lanjutkan?")) return;

    try {
      await fetch(`/api/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadBatches();
    } catch { /* handle error */ }
  };

  const handleDelete = async (batch: Batch) => {
    if (!confirm(`Hapus gelombang "${batch.batch_name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await fetch(`/api/batches/${batch.id}`, { method: "DELETE" });
      loadBatches();
    } catch { /* handle error */ }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Kelola Gelombang</h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-0.5">
            Kelola gelombang observasi asesmen kesiapan siswa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white font-bold px-4 text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-1.5 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
        >
          <Plus weight="light" size={17} />
          <span>Tambah Gelombang</span>
        </button>
      </div>

      {/* Batch List */}
      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">Memuat data...</div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <CalendarBlank weight="light" size={44} className="text-[#787F7A] mx-auto mb-3" />
          <p className="text-[#1E2320] font-bold text-base">Belum ada gelombang</p>
          <p className="text-xs text-[#565C58] mt-1 mb-4">Buat gelombang pertama untuk memulai observasi</p>
          <button
            onClick={openCreate}
            className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white font-bold px-6 text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-1.5 mx-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
          >
            <Plus weight="light" size={17} />
            <span>Buat Gelombang Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] hover:shadow-[0_8px_24px_-2px_rgba(30,35,32,0.08)] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-sm text-[#1E2320]">{batch.batch_name}</h3>
                    <StatusBadge status={batch.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#565C58]">
                    <span className="flex items-center gap-1">
                      <CalendarBlank weight="light" size={14} className="text-[#787F7A]" />
                      {formatDate(batch.batch_date)}
                    </span>
                    {batch.notes && (
                      <span className="flex items-center gap-1">
                        <NotePencil weight="light" size={14} className="text-[#787F7A]" />
                        {batch.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 flex-shrink-0">
                  {batch.status === "draft" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(batch, "active")}
                        className="h-9 bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] font-bold px-3 text-xs rounded-xl shadow-2xs flex items-center gap-1 hover:bg-[#D4E2D8] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                      >
                        <Play weight="light" size={13} />
                        <span>Aktifkan</span>
                      </button>
                      <button
                        onClick={() => openEdit(batch)}
                        className="h-9 bg-[#FAF8F5] text-[#1E2320] px-3 text-xs rounded-xl border border-[#E5E0D8] hover:bg-[#F3EFE8] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                        title="Edit Gelombang"
                        aria-label="Edit Gelombang"
                      >
                        <PencilSimple weight="light" size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch)}
                        className="h-9 bg-[#FAF0E8] text-[#C9733B] px-3 text-xs rounded-xl border border-[#F2D8C7] hover:bg-[#F7EAE5] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                        title="Hapus Gelombang"
                        aria-label="Hapus Gelombang"
                      >
                        <Trash weight="light" size={15} />
                      </button>
                    </>
                  )}
                  {batch.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(batch, "locked")}
                      className="h-9 bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] font-bold px-3 text-xs rounded-xl shadow-2xs flex items-center gap-1 hover:bg-[#F7EAE5] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                    >
                      <LockKey weight="light" size={14} />
                      <span>Kunci</span>
                    </button>
                  )}
                  {batch.status === "locked" && (
                    <span className="h-9 text-xs text-[#787F7A] inline-flex items-center gap-1 px-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl font-semibold">
                      <LockKey weight="light" size={14} />
                      <span>Terkunci</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#1E2320]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setModal(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(30,35,32,0.25)] z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-bold text-[#1E2320]">
                {modal === "create" ? "Tambah Gelombang Baru" : "Edit Gelombang"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                aria-label="Tutup"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  Nama Gelombang *
                </label>
                <input
                  type="text"
                  value={form.batch_name}
                  onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
                  placeholder="Contoh: Gelombang 1 (Oktober 2026)"
                  className="w-full h-11 rounded-xl px-3.5 text-xs sm:text-sm text-[#1E2320] bg-[#FAF8F5] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
                />
              </div>

              {modal === "create" && (
                <div>
                  <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                    Tanggal Observasi *
                  </label>
                  <input
                    type="date"
                    value={form.batch_date}
                    onChange={(e) => setForm({ ...form, batch_date: e.target.value })}
                    className="w-full h-11 rounded-xl px-3.5 text-xs sm:text-sm text-[#1E2320] bg-[#FAF8F5] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  Catatan (opsional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan untuk gelombang ini..."
                  rows={2}
                  className="w-full rounded-xl p-3 text-xs sm:text-sm text-[#1E2320] bg-[#FAF8F5] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 h-11 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold rounded-xl border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !form.batch_name.trim()}
                  className="flex-1 h-11 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  {submitting ? "Menyimpan..." : modal === "create" ? "Buat Gelombang" : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { bg: string; Icon: React.ComponentType<{ weight?: "light" | "bold" | "regular" | "fill"; size?: number }>; label: string }> = {
    draft: { bg: "bg-[#EBE6DF] text-[#565C58] border border-[#DDD7CE]", Icon: FileDashed, label: "Draft" },
    active: { bg: "bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8]", Icon: CheckCircle, label: "Aktif" },
    locked: { bg: "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7]", Icon: LockKey, label: "Terkunci" },
  };
  const s = m[status] || m.draft;
  const BadgeIcon = s.Icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.bg}`}>
      <BadgeIcon weight="bold" size={12} />
      <span>{s.label}</span>
    </span>
  );
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

