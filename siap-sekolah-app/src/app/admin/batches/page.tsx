"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
    } catch {
      /* offline fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

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
    } catch {
      /* handle error */
    } finally {
      setSubmitting(false);
    }
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
    } catch {
      /* handle error */
    }
  };

  const handleDelete = async (batch: Batch) => {
    if (!confirm(`Hapus gelombang "${batch.batch_name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await fetch(`/api/batches/${batch.id}`, { method: "DELETE" });
      loadBatches();
    } catch {
      /* handle error */
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1">
        <Link
          href="/admin"
          className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-xs"
        >
          <i className="mdi mdi-chevron-left text-base" />
          <span>Dashboard Admin</span>
        </Link>
        <span className="bg-[#E4EAF2] text-[#36506C] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
          GELOMBANG
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#22352B] tracking-tight">
            Kelola Gelombang Observasi
          </h1>
          <p className="text-xs text-[#565C58] mt-1">
            Atur jadwal dan status aktif gelombang asesmen diagnostik kesiapan belajar calon siswa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold px-4 py-3 rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
        >
          <i className="mdi mdi-plus text-xl" />
          <span>Tambah Gelombang Baru</span>
        </button>
      </div>

      {/* Batch List */}
      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">
          Memuat data gelombang...
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center mx-auto">
            <i className="mdi mdi-calendar-blank-outline text-3xl" />
          </div>
          <p className="text-[#22352B] font-extrabold text-base">Belum ada gelombang</p>
          <p className="text-xs text-[#565C58]">Buat gelombang pertama untuk memulai jadwal observasi.</p>
          <button
            onClick={openCreate}
            className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold px-5 py-2.5 text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <i className="mdi mdi-plus text-lg" />
            <span>Buat Gelombang Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-3xl p-4.5 sm:p-5 border border-[#E8E2D8]/60 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0">
                      <i className="mdi mdi-calendar-blank-outline text-xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-[#22352B]">{batch.batch_name}</h3>
                        <StatusBadge status={batch.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#565C58] mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <i className="mdi mdi-calendar text-[#787F7A] text-sm" />
                          <span>{batch.batch_date}</span>
                        </span>
                        {batch.notes && (
                          <span className="flex items-center gap-1 text-[#787F7A]">
                            <i className="mdi mdi-note-text-outline text-sm" />
                            <span>{batch.notes}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 flex-shrink-0">
                  {batch.status === "draft" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(batch, "active")}
                        className="h-9 bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4] font-extrabold px-3.5 text-xs rounded-xl shadow-2xs flex items-center gap-1 hover:bg-[#D4E2D8] active:scale-95 transition-all cursor-pointer"
                      >
                        <i className="mdi mdi-play text-base" />
                        <span>Aktifkan</span>
                      </button>
                      <button
                        onClick={() => openEdit(batch)}
                        className="h-9 bg-[#FAF8F5] text-[#22352B] px-3 text-xs rounded-xl border border-[#E8E2D8] hover:bg-[#F3EFE6] active:scale-95 transition-all cursor-pointer"
                        title="Edit Gelombang"
                        aria-label="Edit Gelombang"
                      >
                        <i className="mdi mdi-pencil-outline text-base" />
                      </button>
                      <button
                        onClick={() => handleDelete(batch)}
                        className="h-9 bg-[#F9E6DC] text-[#8C3713] px-3 text-xs rounded-xl border border-[#F1CFC0] hover:bg-[#F2D7CA] active:scale-95 transition-all cursor-pointer"
                        title="Hapus Gelombang"
                        aria-label="Hapus Gelombang"
                      >
                        <i className="mdi mdi-trash-can-outline text-base" />
                      </button>
                    </>
                  )}
                  {batch.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(batch, "locked")}
                      className="h-9 bg-[#F9E6DC] text-[#8C3713] border border-[#F1CFC0] font-extrabold px-3.5 text-xs rounded-xl shadow-2xs flex items-center gap-1 hover:bg-[#F2D7CA] active:scale-95 transition-all cursor-pointer"
                    >
                      <i className="mdi mdi-lock-outline text-base" />
                      <span>Kunci Gelombang</span>
                    </button>
                  )}
                  {batch.status === "locked" && (
                    <span className="h-9 text-xs text-[#787F7A] inline-flex items-center gap-1 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl font-semibold">
                      <i className="mdi mdi-lock text-sm" />
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
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setModal(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xl z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-extrabold text-[#22352B]">
                {modal === "create" ? "Tambah Gelombang Baru" : "Edit Gelombang"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Nama Gelombang *
                </label>
                <input
                  type="text"
                  value={form.batch_name}
                  onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
                  placeholder="Contoh: Gelombang 1 - TP 2026/2027"
                  className="w-full h-11 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627]"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Tanggal Observasi *
                </label>
                <input
                  type="date"
                  value={form.batch_date}
                  onChange={(e) => setForm({ ...form, batch_date: e.target.value })}
                  className="w-full h-11 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627]"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Keterangan singkat tentang kelompok calon siswa..."
                  className="w-full rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] p-3 text-xs text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl bg-[#F3EFE6] text-[#22352B] text-xs font-bold hover:bg-[#EAE4D8] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.batch_name.trim() || !form.batch_date}
                className="px-5 py-2.5 rounded-xl bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-extrabold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : modal === "create" ? "Buat Gelombang" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="bg-[#E4EFE9] text-[#22352B] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-[#4F936F]" />
        <span>Aktif</span>
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="bg-[#F9E6DC] text-[#8C3713] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
        <i className="mdi mdi-lock text-xs" />
        <span>Terkunci</span>
      </span>
    );
  }
  return (
    <span className="bg-[#FAF8F5] text-[#787F7A] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#DDD7CE]">
      Draft
    </span>
  );
}
