export const runtime = 'edge';
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  DownloadSimple,
  UploadSimple,
  Plus,
  MagnifyingGlass,
  SquaresFour,
  ListDashes,
  User,
  X,
  CalendarBlank,
  CheckCircle,
  Warning,
  CircleNotch,
  Printer,
} from "@phosphor-icons/react";
import type { Student, Batch, ExcelValidationResult } from "@/types";

type ViewMode = "table" | "cards";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importResults, setImportResults] = useState<ExcelValidationResult[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importBatchId, setImportBatchId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    registration_no: "", full_name: "", nickname: "",
    birth_date: "", gender: "L" as "L" | "P",
    parent_name: "", phone: "", batch_id: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`/api/students${filterBatch !== "all" ? `?batch_id=${filterBatch}` : ""}`),
        fetch("/api/batches"),
      ]);
      if (sRes.ok) { const d = await sRes.json(); setStudents(d.data || []); }
      if (bRes.ok) { const d = await bRes.json(); setBatches(d.data || []); }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [filterBatch]);

  useEffect(() => { loadData(); }, [loadData]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImport) { setShowImport(false); setImportResults(null); }
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
    } catch { alert("Gagal memproses file"); }
    finally { setImportLoading(false); }
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
    } catch { alert("Gagal import data"); }
    finally { setImportLoading(false); }
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
        setAddForm({ registration_no: "", full_name: "", nickname: "", birth_date: "", gender: "L", parent_name: "", phone: "", batch_id: "" });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menambah siswa");
      }
    } catch { alert("Gagal menambah siswa"); }
    finally { setAddSubmitting(false); }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Hapus data "${student.full_name}"?`)) return;
    try {
      await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      loadData();
    } catch { /* handle error */ }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Data Calon Siswa</h1>
          <p className="text-xs sm:text-sm text-[#565C58] mt-0.5">
            {students.length} calon siswa terdaftar di pangkalan data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/students/template"
            className="h-11 bg-white text-[#1E2320] font-bold px-3.5 text-xs rounded-xl shadow-2xs border border-[#E5E0D8] hover:bg-[#FAF8F5] active:scale-95 transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
          >
            <DownloadSimple weight="light" size={16} />
            <span>Template Excel</span>
          </a>
          <button
            onClick={() => setShowImport(true)}
            className="h-11 bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] px-3.5 text-xs rounded-xl shadow-2xs hover:bg-[#D4E2D8] active:scale-95 transition-all flex items-center gap-1.5 font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
          >
            <UploadSimple weight="light" size={16} />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white px-4 text-xs rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-1.5 font-bold focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
          >
            <Plus weight="light" size={16} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filters (Pure Crisp White Container matching Portal Guru) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#787F7A]">
            <MagnifyingGlass weight="light" size={17} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau no pendaftaran..."
            className="w-full h-11 pl-10 pr-4 rounded-xl text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] placeholder:text-[#A8A09A] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
          />
        </div>
        <select
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="h-11 rounded-xl px-3.5 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] font-bold border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
        >
          <option value="all">Semua Gelombang</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.batch_name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E0D8]">
          <button
            onClick={() => setViewMode("cards")}
            className={`h-9 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "cards"
                ? "bg-[#C9733B] text-white shadow-xs font-black"
                : "text-[#565C58] hover:text-[#1E2320]"
            } focus-visible:ring-2 focus-visible:ring-[#5C7C68]`}
            title="Tampilan Kartu"
            aria-label="Tampilan Kartu"
          >
            <SquaresFour weight="light" size={17} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`h-9 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === "table"
                ? "bg-[#C9733B] text-white shadow-xs font-black"
                : "text-[#565C58] hover:text-[#1E2320]"
            } focus-visible:ring-2 focus-visible:ring-[#5C7C68]`}
            title="Tampilan Tabel"
            aria-label="Tampilan Tabel"
          >
            <ListDashes weight="light" size={17} />
          </button>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">Memuat data siswa...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <User weight="light" size={44} className="text-[#787F7A] mx-auto mb-3" />
          <p className="text-[#1E2320] font-bold text-base">
            {searchQuery ? "Tidak ditemukan" : "Belum ada data siswa"}
          </p>
          <p className="text-xs text-[#565C58] mt-1">
            {searchQuery ? "Coba kata kunci pencarian lain" : "Import data via Excel atau tambah manual"}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs font-bold
                  ${s.gender === "L" ? "bg-[#E8EDF2] text-[#283747]" : "bg-[#FAF0E8] text-[#8C4620] border border-[#F2D8C7]"}`}>
                  <User weight="light" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1E2320] truncate">{s.full_name}</p>
                  <p className="text-xs text-[#787F7A] font-mono">{s.registration_no}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/reports/student/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3D7A5A] hover:text-[#1E2320] p-1.5 rounded-lg hover:bg-[#F0F4F1] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                    title="Lihat Laporan PDF Siswa"
                    aria-label="Lihat Laporan PDF Siswa"
                  >
                    <Printer weight="light" size={17} />
                  </Link>
                  <button
                    onClick={() => handleDelete(s)}
                    className="text-[#C9733B] hover:text-[#B8632E] p-1.5 rounded-lg hover:bg-[#FAF0E8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                    aria-label="Hapus Siswa"
                  >
                    <X weight="light" size={17} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#565C58]">
                <span className="flex items-center gap-1">
                  <CalendarBlank weight="light" size={13} className="text-[#787F7A]" />
                  {formatDate(s.birth_date)}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${s.gender === "L" ? "bg-[#E8EDF2] text-[#283747]" : "bg-[#FAF0E8] text-[#8C4620]"}`}>
                  {s.gender === "L" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
              {s.parent_name && (
                <p className="text-[11px] text-[#565C58] mt-2 flex items-center gap-1">
                  <User weight="light" size={12} className="text-[#787F7A]" />
                  <span>{s.parent_name}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#565C58] border-b border-[#E8E2D8]">
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">No Reg</th>
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">Nama Lengkap</th>
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">Panggilan</th>
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">Tgl Lahir</th>
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">JK</th>
                  <th className="text-left p-3.5 text-xs font-bold uppercase tracking-wider">Orang Tua</th>
                  <th className="p-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="p-3.5 text-xs font-mono font-semibold text-[#565C58]">{s.registration_no}</td>
                    <td className="p-3.5 font-bold text-[#1E2320]">{s.full_name}</td>
                    <td className="p-3.5 text-[#565C58]">{s.nickname}</td>
                    <td className="p-3.5 text-[#565C58]">{formatDate(s.birth_date)}</td>
                    <td className="p-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.gender === "L" ? "bg-[#E8EDF2] text-[#283747]" : "bg-[#FAF0E8] text-[#8C4620]"}`}>
                        {s.gender === "L" ? "L" : "P"}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#565C58]">{s.parent_name || "-"}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/reports/student/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3D7A5A] hover:text-[#1E2320] p-1.5 rounded-lg hover:bg-[#F0F4F1] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                          title="Lihat Laporan PDF Siswa"
                          aria-label="Lihat Laporan PDF Siswa"
                        >
                          <Printer weight="light" size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(s)}
                          className="text-[#C9733B] hover:text-[#B8632E] p-1.5 rounded-lg hover:bg-[#FAF0E8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                          aria-label="Hapus Siswa"
                        >
                          <X weight="light" size={16} />
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
            className="fixed inset-0 bg-[#1E2320]/40 backdrop-blur-sm transition-opacity"
            onClick={() => { setShowImport(false); setImportResults(null); }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(30,35,32,0.25)] z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-bold text-[#1E2320] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center">
                  <UploadSimple weight="light" size={18} />
                </div>
                <span>Import Data Calon Siswa</span>
              </h2>
              <button
                type="button"
                onClick={() => { setShowImport(false); setImportResults(null); }}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                aria-label="Tutup"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  Pilih Gelombang *
                </label>
                <select
                  value={importBatchId}
                  onChange={(e) => setImportBatchId(e.target.value)}
                  className="w-full h-11 rounded-xl px-3.5 text-xs sm:text-sm bg-[#FAF8F5] text-[#1E2320] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">(Pilih Gelombang)</option>
                  {batches.filter((b) => b.status !== "locked").map((b) => (
                    <option key={b.id} value={b.id}>{b.batch_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  File Excel (.xlsx)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
                  className="w-full text-xs text-[#1E2320] file:mr-3 file:py-2.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F0F4F1] file:text-[#3D7A5A] hover:file:bg-[#D4E2D8] cursor-pointer"
                />
              </div>

              {importLoading && (
                <p className="text-xs text-[#3D7A5A] text-center py-2 flex items-center justify-center gap-1.5 font-medium">
                  <CircleNotch weight="light" size={16} className="animate-spin" />
                  <span>Memproses data file...</span>
                </p>
              )}

              {/* Validation Results */}
              {importResults && (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 bg-[#F0F4F1] text-[#3D7A5A] border border-[#D4E2D8] rounded-full font-bold shadow-2xs flex items-center gap-1">
                      <CheckCircle weight="bold" size={13} className="text-[#3D7A5A]" />
                      {importResults.filter((r) => r.is_valid).length} valid
                    </span>
                    <span className="px-3 py-1 bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] rounded-full font-bold shadow-2xs flex items-center gap-1">
                      <Warning weight="bold" size={13} />
                      {importResults.filter((r) => !r.is_valid).length} error
                    </span>
                  </div>
                  {importResults.filter((r) => !r.is_valid).map((r) => (
                    <div key={r.row_index} className="bg-[#FAF0E8] rounded-xl p-2.5 text-xs border border-[#F2D8C7]">
                      <span className="font-bold text-[#C9733B]">Baris {r.row_index}:</span>{" "}
                      <span className="text-[#565C58]">{r.errors.join(", ")}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowImport(false); setImportResults(null); }}
                  className="flex-1 h-11 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold rounded-xl border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                {importResults && importResults.some((r) => r.is_valid) && (
                  <button
                    type="button"
                    onClick={confirmImport}
                    disabled={importLoading}
                    className="flex-1 h-11 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                  >
                    {importLoading ? "Mengimport..." : `Import ${importResults.filter((r) => r.is_valid).length} Siswa`}
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
            className="fixed inset-0 bg-[#1E2320]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAddModal(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E2D8] shadow-[0_25px_60px_-15px_rgba(30,35,32,0.25)] z-10 space-y-4 max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h2 className="text-base font-bold text-[#1E2320] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center">
                  <Plus weight="light" size={18} />
                </div>
                <span>Tambah Calon Siswa Baru</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#565C58] hover:text-[#1E2320] hover:bg-[#EBE6DF] flex items-center justify-center text-sm font-bold border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68]"
                aria-label="Tutup"
              >
                <X weight="light" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {([
                { key: "registration_no", label: "No Pendaftaran *", placeholder: "PPDB-2026-001", type: "text" },
                { key: "full_name", label: "Nama Lengkap *", placeholder: "Ahmad Putra Pratama", type: "text" },
                { key: "nickname", label: "Nama Panggilan *", placeholder: "Ahmad", type: "text" },
                { key: "birth_date", label: "Tanggal Lahir *", placeholder: "", type: "date" },
                { key: "parent_name", label: "Nama Orang Tua", placeholder: "Budi Pratama", type: "text" },
                { key: "phone", label: "No WhatsApp", placeholder: "08123456789", type: "tel" },
              ] as const).map((field) => (
                <div key={field.key}>
                  <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(addForm as Record<string, string>)[field.key]}
                    onChange={(e) => setAddForm({ ...addForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full h-11 rounded-xl px-3.5 text-xs sm:text-sm text-[#1E2320] bg-[#FAF8F5] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none transition-all"
                  />
                </div>
              ))}

              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  Jenis Kelamin *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["L", "P"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, gender: g })}
                      className={`h-11 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 ${
                        addForm.gender === g
                          ? "bg-[#C9733B] text-white border-[#C9733B] shadow-xs font-black"
                          : "bg-[#FAF8F5] text-[#565C58] border-[#E5E0D8]"
                      }`}
                    >
                      {g === "L" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1E2320] uppercase tracking-wider block mb-1.5">
                  Gelombang
                </label>
                <select
                  value={addForm.batch_id}
                  onChange={(e) => setAddForm({ ...addForm, batch_id: e.target.value })}
                  className="w-full h-11 rounded-xl px-3.5 text-xs sm:text-sm text-[#1E2320] bg-[#FAF8F5] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">(Tanpa Gelombang)</option>
                  {batches.filter((b) => b.status !== "locked").map((b) => (
                    <option key={b.id} value={b.id}>{b.batch_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold rounded-xl border border-[#E5E0D8] transition-colors focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={addSubmitting}
                  className="flex-1 h-11 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  {addSubmitting ? "Menyimpan..." : "Simpan Data Siswa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

