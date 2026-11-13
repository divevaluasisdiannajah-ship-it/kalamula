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
  const [deletingDummy, setDeletingDummy] = useState(false);

  const isDummyBatch = (b: Batch) =>
    b.created_by === "system-seed" ||
    b.batch_name.includes("56 Siswa") ||
    b.batch_name.includes("TP 2026/2027") ||
    b.id.startsWith("batch-demo");

  const handleCleanDummy = async () => {
    if (
      !confirm(
        "Hapus semua data dummy bawaan sistem (56 siswa dummy & batch sampel)? Data gelombang dan siswa riil yang Anda buat tidak akan terhapus."
      )
    ) {
      return;
    }
    setDeletingDummy(true);
    try {
      const res = await fetch("/api/seed", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Data dummy berhasil dibersihkan dari database!");
        loadBatches();
      } else {
        alert(data.error || "Gagal menghapus data dummy");
      }
    } catch {
      alert("Gagal menghapus data dummy. Periksa koneksi.");
    } finally {
      setDeletingDummy(false);
    }
  };

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
      active:
        batch.status === "locked"
          ? `Buka kunci gelombang "${batch.batch_name}"? Evaluator akan dapat kembali mengedit dan menginput data observasi.`
          : `Aktifkan gelombang "${batch.batch_name}"? Evaluator akan bisa mulai input data observasi.`,
      locked: `Kunci gelombang "${batch.batch_name}"? Evaluator tidak bisa mengubah data lagi. (Catatan: Anda tetap dapat membuka kuncinya kembali sewaktu-waktu).`,
    };
    if (!confirm(confirmMsg[newStatus] || "Lanjutkan?")) return;

    try {
      const res = await fetch(`/api/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Gagal mengubah status gelombang");
        return;
      }
      loadBatches();
    } catch {
      alert("Gagal mengubah status gelombang. Periksa koneksi.");
    }
  };

  const handleDelete = async (batch: Batch) => {
    const isDummy = isDummyBatch(batch);
    const msg = isDummy
      ? `Hapus gelombang sampel "${batch.batch_name}" beserta seluruh data siswanya?`
      : batch.status === "draft"
      ? `Hapus gelombang "${batch.batch_name}"? Tindakan ini tidak dapat dibatalkan.`
      : `Hapus gelombang "${batch.batch_name}" beserta SEMUA siswa dan data evaluasi di dalamnya? Tindakan ini tidak dapat dibatalkan.`;

    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/batches/${batch.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        loadBatches();
      } else {
        alert(data.error || "Gagal menghapus gelombang");
      }
    } catch {
      alert("Gagal menghapus gelombang");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1">
        <Link
          href="/admin"
          className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-2xs active:scale-[0.96]"
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
          <h1 className="text-xl sm:text-2xl font-black text-[#22352B] tracking-tight">
            Kelola Gelombang Observasi
          </h1>
          <p className="text-xs text-[#565C58] mt-0.5">
            Atur jadwal dan status aktif gelombang asesmen diagnostik kesiapan belajar calon siswa
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {batches.some(isDummyBatch) && (
            <button
              onClick={handleCleanDummy}
              disabled={deletingDummy}
              className="bg-[#F9E6DC] hover:bg-[#F2D7CA] text-[#8C3713] font-bold px-3.5 py-2.5 rounded-xl border border-[#F1CFC0] shadow-xs transition flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer active:scale-[0.96] disabled:opacity-50"
              title="Bersihkan 56 siswa dummy dan gelombang demo bawaan"
            >
              <i className={`mdi ${deletingDummy ? "mdi-loading mdi-spin" : "mdi-broom"} text-lg`} />
              <span>{deletingDummy ? "Menghapus..." : "Hapus Data Dummy"}</span>
            </button>
          )}
          <button
            onClick={openCreate}
            className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer active:scale-[0.96]"
          >
            <i className="mdi mdi-plus text-lg" />
            <span>Tambah Gelombang Baru</span>
          </button>
        </div>
      </div>

      {/* Batch List */}
      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">
          Memuat data gelombang...
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#E8E2D8] shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center mx-auto">
            <i className="mdi mdi-calendar-blank-outline text-3xl" />
          </div>
          <p className="text-[#22352B] font-bold text-base">Belum ada gelombang</p>
          <p className="text-xs text-[#565C58]">Buat gelombang pertama untuk memulai jadwal observasi.</p>
          <button
            onClick={openCreate}
            className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-bold px-5 py-2.5 text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 mx-auto cursor-pointer active:scale-[0.96]"
          >
            <i className="mdi mdi-plus text-base" />
            <span>Buat Gelombang Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-xs hover:border-[#DDD7CE] transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center flex-shrink-0">
                      <i className="mdi mdi-calendar-blank-outline text-xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#22352B]">{batch.batch_name}</h3>
                        <StatusBadge status={batch.status} />
                        {isDummyBatch(batch) && (
                          <span className="bg-[#FFF4E5] text-[#B85627] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FED7AA]">
                            Data Dummy
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#565C58] mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <i className="mdi mdi-calendar text-[#787F7A] text-sm" />
                          <span className="font-mono tabular-nums">{batch.batch_date}</span>
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
                    <button
                      onClick={() => handleStatusChange(batch, "active")}
                      className="h-8 sm:h-9 bg-[#E4EFE9] text-[#486B5A] border border-[#CBE0D4] font-bold px-3 text-xs rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-[#D4E2D8] active:scale-[0.96] transition-all cursor-pointer"
                      title="Aktifkan gelombang agar evaluator dapat mulai observasi"
                    >
                      <i className="mdi mdi-play text-base" />
                      <span>Aktifkan</span>
                    </button>
                  )}
                  {batch.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(batch, "locked")}
                      className="h-8 sm:h-9 bg-[#FAF8F5] text-[#565C58] border border-[#E8E2D8] font-bold px-3 text-xs rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-[#F2ECE4] hover:text-[#8C3713] hover:border-[#E1D7C8] active:scale-[0.96] transition-all cursor-pointer"
                      title="Kunci gelombang setelah observasi selesai (dapat dibuka kembali sewaktu-waktu)"
                    >
                      <i className="mdi mdi-lock-outline text-base" />
                      <span>Kunci Gelombang</span>
                    </button>
                  )}
                  {batch.status === "locked" && (
                    <button
                      onClick={() => handleStatusChange(batch, "active")}
                      className="h-8 sm:h-9 bg-[#FFF4E5] text-[#9A3412] border border-[#FED7AA] font-bold px-3 text-xs rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-[#FEEBC8] hover:border-[#FDBA74] active:scale-[0.96] transition-all cursor-pointer"
                      title="Buka kunci gelombang jika tidak sengaja terkunci atau perlu revisi data observasi"
                    >
                      <i className="mdi mdi-lock-open-variant-outline text-base" />
                      <span>Buka Kunci</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(batch)}
                    className="h-8 sm:h-9 bg-[#FAF8F5] text-[#22352B] px-2.5 text-xs rounded-xl border border-[#E8E2D8] hover:bg-[#F3EFE6] active:scale-[0.96] transition-all cursor-pointer"
                    title="Edit Gelombang"
                    aria-label="Edit Gelombang"
                  >
                    <i className="mdi mdi-pencil-outline text-base" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch)}
                    className="h-8 sm:h-9 bg-[#F9E6DC] text-[#8C3713] px-2.5 text-xs rounded-xl border border-[#F1CFC0] hover:bg-[#F2D7CA] active:scale-[0.96] transition-all cursor-pointer"
                    title={isDummyBatch(batch) ? "Hapus Gelombang Dummy" : "Hapus Gelombang"}
                    aria-label="Hapus Gelombang"
                  >
                    <i className="mdi mdi-trash-can-outline text-base" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
          <div
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setModal(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E2D8] shadow-2xl z-10 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#FAF8F5]">
              <h2 className="text-base font-bold text-[#22352B]">
                {modal === "create" ? "Tambah Gelombang Baru" : "Edit Gelombang"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-7 h-7 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer active:scale-[0.96]"
                aria-label="Tutup"
              >
                <i className="mdi mdi-close text-base" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Nama Gelombang *
                </label>
                <input
                  type="text"
                  value={form.batch_name}
                  onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
                  placeholder="Contoh: Gelombang 1 - TP 2026/2027"
                  className="w-full h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] px-3 text-xs text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Tanggal Observasi *
                </label>
                <input
                  type="date"
                  value={form.batch_date}
                  onChange={(e) => setForm({ ...form, batch_date: e.target.value })}
                  className="w-full h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] px-3 text-xs text-[#22352B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Keterangan singkat tentang kelompok calon siswa..."
                  className="w-full rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] p-2.5 text-xs text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85627] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#FAF8F5]">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] text-[#22352B] text-xs font-bold hover:bg-[#EAE4D8] transition cursor-pointer active:scale-[0.96]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.batch_name.trim() || !form.batch_date}
                className="px-4 py-2 rounded-xl bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-[0.96]"
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
