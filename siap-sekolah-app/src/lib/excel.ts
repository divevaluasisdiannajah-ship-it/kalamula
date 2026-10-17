/**
 * SIAP SEKOLAH — Excel Import/Export Engine
 * 
 * Handles:
 * - Template .xlsx generation with baku headers
 * - Upload parsing & auto-validation
 * - Duplicate detection
 */

import * as XLSX from "xlsx";
import type { ExcelStudentRow, ExcelValidationResult, Student } from "@/types";

// ─── Template Headers (Baku) ───────────────────────────────────

export const TEMPLATE_HEADERS: (keyof ExcelStudentRow)[] = [
  "No_Pendaftaran",
  "Nama_Lengkap",
  "Nama_Panggilan",
  "Tanggal_Lahir",
  "Jenis_Kelamin",
  "Nama_Orang_Tua",
  "No_WhatsApp",
  "Kelompok",
];

const HEADER_LABELS: Record<string, string> = {
  No_Pendaftaran: "No Pendaftaran",
  Nama_Lengkap: "Nama Lengkap",
  Nama_Panggilan: "Nama Panggilan",
  Tanggal_Lahir: "Tanggal Lahir (DD/MM/YYYY)",
  Jenis_Kelamin: "Jenis Kelamin (L/P)",
  Nama_Orang_Tua: "Nama Orang Tua",
  No_WhatsApp: "No WhatsApp",
  Kelompok: "Kelompok (1/2/3)",
};

// ─── Generate Template ─────────────────────────────────────────

export function generateTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  // Create headers
  const headers = TEMPLATE_HEADERS.map((h) => HEADER_LABELS[h] || h);
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  ws["!cols"] = [
    { wch: 16 }, // No_Pendaftaran
    { wch: 28 }, // Nama_Lengkap
    { wch: 16 }, // Nama_Panggilan
    { wch: 20 }, // Tanggal_Lahir
    { wch: 18 }, // Jenis_Kelamin
    { wch: 28 }, // Nama_Orang_Tua
    { wch: 16 }, // No_WhatsApp
    { wch: 18 }, // Kelompok
  ];

  // Add example rows (showing 3 groups, 4-5 kids each)
  const exampleRows = [
    ["PPDB-2026-001", "Ahmad Putra Pratama", "Ahmad", "15/03/2020", "L", "Budi Pratama", "08123456789", "Kelompok 1"],
    ["PPDB-2026-002", "Alula Farzana Ayunindya", "Alula", "22/07/2020", "P", "Hendra Wijaya", "08123456780", "Kelompok 1"],
    ["PPDB-2026-003", "Bilal Ramadhan", "Bilal", "10/05/2020", "L", "Farhan Ramadhan", "08123456781", "Kelompok 2"],
    ["PPDB-2026-004", "Clarissa Aurelia", "Clarissa", "18/09/2020", "P", "Denny Setiawan", "08123456782", "Kelompok 3"],
  ];
  XLSX.utils.sheet_add_aoa(ws, exampleRows, { origin: "A2" });

  XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Parse Uploaded Excel ──────────────────────────────────────

export function parseExcelBuffer(buffer: ArrayBuffer): ExcelStudentRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
  });

  // Map display headers back to field keys
  const headerMap: Record<string, keyof ExcelStudentRow> = {};
  for (const [key, label] of Object.entries(HEADER_LABELS)) {
    headerMap[label] = key as keyof ExcelStudentRow;
  }

  return rawRows.map((raw) => {
    const row: Partial<ExcelStudentRow> = {};
    for (const [rawKey, rawValue] of Object.entries(raw)) {
      const mappedKey = headerMap[rawKey] || rawKey;
      if (TEMPLATE_HEADERS.includes(mappedKey as keyof ExcelStudentRow)) {
        (row as Record<string, string>)[mappedKey] = String(rawValue).trim();
      }
    }
    return row as ExcelStudentRow;
  });
}

// ─── Validate Rows ─────────────────────────────────────────────

export function validateRows(
  rows: ExcelStudentRow[],
  existingStudents: Student[]
): ExcelValidationResult[] {
  const existingRegNos = new Set(
    existingStudents.map((s) => s.registration_no.toUpperCase())
  );
  const seenInBatch = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let is_duplicate = false;

    // ── Mandatory Fields ──────────────────────────────────────
    if (!row.No_Pendaftaran?.trim()) {
      errors.push("No Pendaftaran wajib diisi");
    }
    if (!row.Nama_Lengkap?.trim()) {
      errors.push("Nama Lengkap wajib diisi");
    }
    if (!row.Nama_Panggilan?.trim()) {
      errors.push("Nama Panggilan wajib diisi");
    }
    if (!row.Tanggal_Lahir?.trim()) {
      errors.push("Tanggal Lahir wajib diisi");
    }
    if (!row.Jenis_Kelamin?.trim()) {
      errors.push("Jenis Kelamin wajib diisi");
    }

    // ── Date Format Validation ────────────────────────────────
    if (row.Tanggal_Lahir?.trim()) {
      const parsed = parseDateFlexible(row.Tanggal_Lahir.trim());
      if (!parsed) {
        errors.push("Format Tanggal Lahir tidak valid. Gunakan DD/MM/YYYY");
      }
    }

    // ── Gender Validation ─────────────────────────────────────
    if (row.Jenis_Kelamin?.trim()) {
      const g = normalizeGender(row.Jenis_Kelamin.trim());
      if (!g) {
        errors.push("Jenis Kelamin harus L (Laki-laki) atau P (Perempuan)");
      }
    }

    // ── Duplicate Check (within file) ─────────────────────────
    if (row.No_Pendaftaran?.trim()) {
      const key = row.No_Pendaftaran.trim().toUpperCase();
      if (seenInBatch.has(key)) {
        errors.push("No Pendaftaran duplikat dalam file ini");
        is_duplicate = true;
      }
      seenInBatch.add(key);

      // Check against existing DB
      if (existingRegNos.has(key)) {
        errors.push("No Pendaftaran sudah terdaftar di database");
        is_duplicate = true;
      }
    }

    // ── Warnings ──────────────────────────────────────────────
    if (!row.Nama_Orang_Tua?.trim()) {
      warnings.push("Nama Orang Tua kosong");
    }
    if (!row.No_WhatsApp?.trim()) {
      warnings.push("No WhatsApp kosong");
    }

    // ── Batch Capacity Warning (Maksimal 15 anak per gelombang) ─
    if (rows.length > 15 && index === 0) {
      warnings.push(
        `Perhatian: Kuota observasi ideal adalah maksimal 15 anak per gelombang (File ini memuat ${rows.length} anak).`
      );
    }

    // ── Normalisasi Kelompok ──────────────────────────────────
    if (row.Kelompok?.trim()) {
      const normalized = normalizeGroup(row.Kelompok);
      if (normalized) {
        row.Kelompok = normalized;
      }
    }

    return {
      row_index: index + 2, // +1 for 0-index, +1 for header row
      data: row,
      is_valid: errors.length === 0,
      errors,
      warnings,
      is_duplicate,
    };
  });
}

// ─── Group Normalizer & Auto-Assignment ────────────────────────

export function normalizeGroup(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/(\d+)/);
  if (match) {
    return `Kelompok ${match[1]}`;
  }
  return trimmed || null;
}

/**
 * Auto-assigns students to observation groups (minimal 4, maksimal 5 per kelompok)
 * Balancing gender (L/P) across the groups.
 * Capacity per wave is max 15 students:
 * - N <= 5: 1 group
 * - N <= 10: 2 groups (e.g. 10 -> 5 & 5)
 * - N >= 11: 3 groups (e.g. 12 -> 4, 4, 4; 15 -> 5, 5, 5)
 */
export function autoAssignObservationGroups<
  T extends { gender?: string; Jenis_Kelamin?: string; observation_group?: string | null; Kelompok?: string }
>(items: T[]): T[] {
  if (!items || items.length === 0) return items;

  const total = items.length;
  let groupCount = 1;
  if (total <= 5) {
    groupCount = 1;
  } else if (total <= 10) {
    groupCount = 2;
  } else {
    groupCount = 3;
  }

  const males: T[] = [];
  const females: T[] = [];
  const others: T[] = [];

  items.forEach((item) => {
    const g = (item.gender || item.Jenis_Kelamin || "").toUpperCase();
    if (g === "L" || g.startsWith("LAKI")) {
      males.push(item);
    } else if (g === "P" || g.startsWith("PEREM") || g.startsWith("WANITA")) {
      females.push(item);
    } else {
      others.push(item);
    }
  });

  let groupIndex = 0;
  const assign = (list: T[]) => {
    list.forEach((item) => {
      const existing = item.observation_group || normalizeGroup(item.Kelompok);
      if (existing) {
        if ("observation_group" in item) item.observation_group = existing;
        if ("Kelompok" in item) item.Kelompok = existing;
      } else {
        const groupLabel = `Kelompok ${(groupIndex % groupCount) + 1}`;
        if ("observation_group" in item) item.observation_group = groupLabel;
        if ("Kelompok" in item) item.Kelompok = groupLabel;
        groupIndex++;
      }
    });
  };

  assign(males);
  assign(females);
  assign(others);

  return items;
}

// ─── Date Parser (Flexible) ───────────────────────────────────

export function parseDateFlexible(dateStr: string): string | null {
  // Try DD/MM/YYYY
  let match = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2015 && year <= 2025) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // Try YYYY-MM-DD
  match = dateStr.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2015 && year <= 2025) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

// ─── Gender Normalizer ─────────────────────────────────────────

export function normalizeGender(input: string): "L" | "P" | null {
  const lower = input.toLowerCase().trim();
  if (lower === "l" || lower === "laki-laki" || lower === "laki" || lower === "male") return "L";
  if (lower === "p" || lower === "perempuan" || lower === "female" || lower === "wanita") return "P";
  return null;
}

// ─── Export Students to Excel ──────────────────────────────────

export function exportStudentsToExcel(students: Student[]): Buffer {
  const wb = XLSX.utils.book_new();

  const headers = TEMPLATE_HEADERS.map((h) => HEADER_LABELS[h] || h);
  const data = students.map((s) => [
    s.registration_no,
    s.full_name,
    s.nickname,
    formatDateDisplay(s.birth_date),
    s.gender,
    s.parent_name || "",
    s.phone || "",
    s.observation_group || "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 16 }, { wch: 28 }, { wch: 16 },
    { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function formatDateDisplay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}
