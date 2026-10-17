"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Student, Batch, ExcelValidationResult } from "@/types";
import { autoAssignObservationGroups } from "@/lib/excel";

type ViewMode = "cards" | "table";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importResults, setImportResults] = useState<ExcelValidationResult[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importBatchId, setImportBatchId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    registration_no: "",
    full_name: "",
    nickname: "",
    birth_date: "",
    gender: "L" as "L" | "P",
    parent_name: "",
    phone: "",
    batch_id: "",
    observation_group: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`/api/students${filterBatch !== "all" ? `?batch_id=${filterBatch}` : ""}`),
        fetch("/api/batches"),
      ]);
      if (sRes.ok) {
        const d = await sRes.json();
        setStudents(d.data || []);
      }
      if (bRes.ok) {
        const d = await bRes.json();
        setBatches(d.data || []);
      }
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, [filterBatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImport) {
          setShowImport(false);
          setImportResults(null);
        }
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImport, showAddModal]);

  const filtered = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.nickname.toLowerCase().includes(q) ||
      s.registration_no.toLowerCase().includes(q)
    );
  });

  // ─── Import Handlers ──────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!importBatchId) {
      alert("Pilih gelombang terlebih dahulu");
      return;
    }
    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("batch_id", importBatchId);

    try {
      const res = await fetch("/api/students/import?preview_only=true", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImportResults(data.data?.errors || []);
      }
    } catch {
      alert("Gagal memproses file");
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !importBatchId) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("batch_id", importBatchId);

    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Berhasil import ${data.data?.imported || 0} siswa!`);
        setShowImport(false);
        setImportResults(null);
        loadData();
      }
    } catch {
      alert("Gagal import data");
    } finally {
      setImportLoading(false);
    }
  };

  // ─── Add Student ──────────────────────────────────────────
  const handleAddStudent = async () => {
    if (!addForm.registration_no || !addForm.full_name || !addForm.nickname || !addForm.birth_date) return;
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({
          registration_no: "",
          full_name: "",
          nickname: "",
          birth_date: "",
          gender: "L",
          parent_name: "",
          phone: "",
          batch_id: "",
          observation_group: "",
        });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah siswa");
      }
    } catch {
      alert("Gagal menambah siswa");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleAutoAssignGroups = async () => {
    const targetStudents =
      filterBatch === "all" ? students : students.filter((s) => s.batch_id === filterBatch);

    if (targetStudents.length === 0) {
      alert("Tidak ada siswa untuk dibagi kelompok.");
      return;
    }

    if (
      !confirm(
        `Bagi kelompok otomatis (Kelompok 1, 2, 3 dengan keseimbangan gender, maks 5 anak/kelompok) untuk ${targetStudents.length} siswa?`
      )
    ) {
      return;
    }

    setAutoAssigning(true);
    try {
      const assigned = autoAssignObservationGroups(
        targetStudents.map((s) => ({
          ...s,
          gender: s.gender,
          observation_group: null, // Re-balance fresh
        }))
      );

      let updatedCount = 0;
      for (const item of assigned) {
        if (item.observation_group) {
          const res = await fetch(`/api/students/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ observation_group: item.observation_group }),
          });
          if (res.ok) updatedCount++;
        }
      }

      alert(`Berhasil membagikan kelompok untuk ${updatedCount} siswa!`);
      loadData();
    } catch {
      alert("Gagal membagi kelompok otomatis.");
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Hapus data "${student.full_name}"?`)) return;
    try {
      await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      loadData();
    } catch {
      /* handle error */
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1">
        <Link
          href="/admin"
          className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-xs"
        >
          <i className="mdi mdi-chevron-left text-base" />
          <span>Dashboard Admin</span>
        </Link>
        <span className="bg-[#E4EFE9] text-[#486B5A] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
          DATA SISWA
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#22352B] tracking-tight">
            Data Calon Siswa
          </h1>
          <p className="text-xs text-[#565C58] mt-1">
            {students.length} calon siswa terdaftar dalam sistem asesmen
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoAssignGroups}
            disabled={autoAssigning}
            className="h-10 bg-[#EFE7D6] hover:bg-[#E4D8BE] text-[#7D5327] font-extrabold px-3.5 text-xs rounded-xl shadow-xs border border-[#DDD0B8] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Bagi siswa ke dalam Kelompok 1, 2, 3 secara seimbang (gender balance)"
          >
            <i
              className={`mdi ${
                autoAssigning ? "mdi-loading mdi-spin" : "mdi-account-group-outline"
              } text-base`}
            />
            <span>{autoAssigning ? "Membagi..." : "Bagi Kelompok Otomatis"}</span>
          </button>
          <a
            href="/api/students/template"
            className="h-10 bg-white text-[#22352B] font-bold px-3.5 text-xs rounded-xl shadow-xs border border-[#E8E2D8] hover:bg-[#FAF8F5] transition flex items-center gap-1.5"
          >
            <i className="mdi mdi-download text-base text-[#787F7A]" />
            <span>Template Excel</span>
          </a>
          <button
            onClick={() => setShowImport(true)}
            className="h-10 bg-[#E4EFE9] text-[#486B5A] font-bold px-3.5 text-xs rounded-xl shadow-xs hover:bg-[#D4E2D8] transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className="mdi mdi-tray-arrow-up text-lg" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold px-4 text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className="mdi mdi-plus text-lg" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#E8E2D8]/60 shadow-sm flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 bg-[#FAF8F5] rounded-2xl border border-[#DDD7CE] px-3.5 py-2 flex items-center gap-2">
          <i className="mdi mdi-magnify text-lg text-[#787F7A] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau No. Pendaftaran..."
            className="w-full text-xs bg-transparent text-[#22352B] placeholder:text-[#A8A09A] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#787F7A] hover:text-[#22352B] p-0.5"
            >
              <i className="mdi mdi-close" />
            </button>
          )}
        </div>

        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="h-10 rounded-2xl px-3.5 text-xs bg-[#FAF8F5] text-[#22352B] font-bold border border-[#DDD7CE] focus:outline-none cursor-pointer"
        >
          <option value="all">Semua Gelombang</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batch_name}
            </option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#DDD7CE]">
          <button
            onClick={() => setViewMode("cards")}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === "cards"
                ? "bg-[#B85627] text-white shadow-xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
            title="Tampilan Kartu"
          >
            <i className="mdi mdi-view-grid-outline text-base" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === "table"
                ? "bg-[#B85627] text-white shadow-xs"
                : "text-[#565C58] hover:text-[#22352B]"
            }`}
            title="Tampilan Tabel"
          >
            <i className="mdi mdi-table text-base" />
          </button>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">
          Memuat data calon siswa...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8]/60 shadow-sm space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] text-[#787F7A] flex items-center justify-center mx-auto">
            <i className="mdi mdi-account-search-outline text-3xl" />
          </div>
          <p className="text-[#22352B] font-extrabold text-base">
            {searchQuery ? "Data siswa tidak ditemukan" : "Belum ada data calon siswa"}
          </p>
          <p className="text-xs text-[#565C58]">
            {searchQuery ? "Coba kata kunci pencarian lain" : "Import data via Excel atau tambah siswa manual"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((s, idx) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-4.5 border border-[#E8E2D8]/60 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-2xs ${
                    idx % 2 === 0 ? "bg-[#D67443]" : "bg-[#486B5A]"
                  }`}
                >
                  {s.nickname ? s.nickname.charAt(0).toUpperCase() : s.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm text-[#22352B] truncate">{s.full_name}</p>
                  <p className="text-xs text-[#787F7A] font-mono">{s.registration_no}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/reports/student/${s.id}`}
                    target="_blank"
                    className="p-1.5 rounded-xl bg-[#E4EFE9] text-[#486B5A] hover:bg-[#D4E2D8] transition"
                    title="Lihat Laporan PDF"
                  >
                    <i className="mdi mdi-printer text-base" />
                  </Link>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 rounded-xl bg-[#F9E6DC] text-[#8C3713] hover:bg-[#F2D7CA] transition cursor-pointer"
                    title="Hapus Siswa"
                  >
                    <i className="mdi mdi-trash-can-outline text-base" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#FAF8F5]">
                <span className="text-[#565C58] font-medium flex items-center gap-1">
                  <i className="mdi mdi-calendar-blank-outline text-sm text-[#787F7A]" />
                  <span>{s.birth_date}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {s.observation_group ? (
                    <span className="font-extrabold px-2 py-0.5 rounded-full text-[10px] bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] flex items-center gap-0.5">
                      <i className="mdi mdi-account-group text-xs" />
                      <span>{s.observation_group}</span>
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-[#787F7A] italic">Tanpa Kelompok</span>
                  )}
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      s.gender === "L" ? "bg-[#E4EAF2] text-[#36506C]" : "bg-[#F9E6DC] text-[#8C3713]"
                    }`}
                  >
                    {s.gender === "L" ? "L" : "P"}
                  </span>
                </div>
              </div>

              {s.parent_name && (
                <p className="text-[11px] text-[#787F7A] truncate flex items-center gap-1">
                  <i className="mdi mdi-account-child-outline text-sm" />
                  <span>Ortu: {s.parent_name}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-[#E8E2D8]/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#787F7A] uppercase tracking-wider text-[10px] font-extrabold border-b border-[#E8E2D8]">
                <tr>
                  <th className="p-3.5">No. Reg</th>
                  <th className="p-3.5">Nama Calon Siswa</th>
                  <th className="p-3.5">Kelompok</th>
                  <th className="p-3.5">JK</th>
                  <th className="p-3.5">Tgl Lahir</th>
                  <th className="p-3.5">Orang Tua</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="p-3.5 font-mono text-[#787F7A] font-bold">{s.registration_no}</td>
                    <td className="p-3.5 font-bold text-[#22352B]">
                      {s.full_name} <span className="text-[#787F7A] font-normal">({s.nickname})</span>
                    </td>
                    <td className="p-3.5">
                      {s.observation_group ? (
                        <span className="font-extrabold px-2.5 py-0.5 rounded-full text-[10.5px] bg-[#EFE7D6] text-[#7D5327] border border-[#DDD0B8] inline-flex items-center gap-1">
                          <i className="mdi mdi-account-group text-xs" />
                          <span>{s.observation_group}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#787F7A] italic">Belum dibagi</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10.5px] ${
                          s.gender === "L" ? "bg-[#E4EAF2] text-[#36506C]" : "bg-[#F9E6DC] text-[#8C3713]"
                        }`}
                      >
                        {s.gender}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#565C58]">{s.birth_date}</td>
                    <td className="p-3.5 text-[#565C58]">{s.parent_name || "-"}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/reports/student/${s.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-[#E4EFE9] text-[#486B5A] hover:bg-[#D4E2D8] transition"
                        >
                          <i className="mdi mdi-printer text-sm" />
                        </Link>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg bg-[#F9E6DC] text-[#8C3713] hover:bg-[#F2D7CA] transition cursor-pointer"
                        >
                          <i className="mdi mdi-trash-can-outline text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowImport(false);
              setImportResults(null);
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xl z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-extrabold text-[#22352B] flex items-center gap-2">
                <i className="mdi mdi-tray-arrow-up text-xl text-[#486B5A]" />
                <span>Import Data Calon Siswa</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportResults(null);
                }}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Pilih Gelombang *
                </label>
                <select
                  value={importBatchId}
                  onChange={(e) => setImportBatchId(e.target.value)}
                  className="w-full h-11 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] font-bold focus:outline-none"
                >
                  <option value="">Pilih Gelombang...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Upload Berkas Excel (.xlsx) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="w-full text-xs text-[#565C58] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E4EFE9] file:text-[#486B5A] hover:file:bg-[#D4E2D8] cursor-pointer"
                />
              </div>

              {importLoading && (
                <div className="text-center py-4 text-xs font-bold text-[#B85627] animate-pulse">
                  Sedang memvalidasi baris Excel...
                </div>
              )}

              {importResults && (
                <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#486B5A]">
                      Valid: {importResults.filter((r) => r.is_valid).length} siswa
                    </span>
                    <span className="text-[#8C3713]">
                      Error: {importResults.filter((r) => !r.is_valid).length} baris
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => {
                    setShowImport(false);
                    setImportResults(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#F3EFE6] text-[#22352B] text-xs font-bold hover:bg-[#EAE4D8] transition"
                >
                  Batal
                </button>
                {importResults && importResults.some((r) => r.is_valid) && (
                  <button
                    type="button"
                    onClick={confirmImport}
                    disabled={importLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-extrabold shadow-xs transition"
                  >
                    Simpan Import
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-[#22352B]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddModal(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-xl z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-extrabold text-[#22352B]">
                Tambah Calon Siswa Baru
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#22352B] flex items-center justify-center border border-[#DDD7CE] transition cursor-pointer"
              >
                <i className="mdi mdi-close text-lg" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: "registration_no", label: "No Pendaftaran *", placeholder: "PPDB-2026-001", type: "text" },
                { key: "full_name", label: "Nama Lengkap *", placeholder: "Ahmad Rayyan Al-Fatih", type: "text" },
                { key: "nickname", label: "Nama Panggilan *", placeholder: "Rayyan", type: "text" },
                { key: "birth_date", label: "Tanggal Lahir *", placeholder: "", type: "date" },
                { key: "parent_name", label: "Nama Orang Tua", placeholder: "Budi Santoso", type: "text" },
                { key: "phone", label: "No WhatsApp", placeholder: "08123456789", type: "tel" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(addForm as Record<string, string>)[field.key]}
                    onChange={(e) => setAddForm({ ...addForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full h-10 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Jenis Kelamin *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["L", "P"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, gender: g })}
                      className={`h-10 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                        addForm.gender === g
                          ? "bg-[#B85627] text-white shadow-xs"
                          : "bg-[#FAF8F5] text-[#565C58] border border-[#DDD7CE]"
                      }`}
                    >
                      {g === "L" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Gelombang
                </label>
                <select
                  value={addForm.batch_id}
                  onChange={(e) => setAddForm({ ...addForm, batch_id: e.target.value })}
                  className="w-full h-10 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] font-bold focus:outline-none"
                >
                  <option value="">(Pilih Gelombang)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#787F7A] uppercase tracking-wider block mb-1">
                  Kelompok Observasi
                </label>
                <select
                  value={addForm.observation_group}
                  onChange={(e) => setAddForm({ ...addForm, observation_group: e.target.value })}
                  className="w-full h-10 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] px-3.5 text-xs text-[#22352B] font-bold focus:outline-none"
                >
                  <option value="">(Belum Ditentukan / Otomatis)</option>
                  <option value="Kelompok 1">Kelompok 1</option>
                  <option value="Kelompok 2">Kelompok 2</option>
                  <option value="Kelompok 3">Kelompok 3</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F3EFE6] text-[#22352B] text-xs font-bold hover:bg-[#EAE4D8] transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={addSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-extrabold shadow-xs transition"
                >
                  {addSubmitting ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
