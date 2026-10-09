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
];

const HEADER_LABELS: Record<string, string> = {
  No_Pendaftaran: "No Pendaftaran",
  Nama_Lengkap: "Nama Lengkap",
  Nama_Panggilan: "Nama Panggilan",
  Tanggal_Lahir: "Tanggal Lahir (DD/MM/YYYY)",
  Jenis_Kelamin: "Jenis Kelamin (L/P)",
  Nama_Orang_Tua: "Nama Orang Tua",
  No_WhatsApp: "No WhatsApp",
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
  ];

  // Add example row
  const exampleRow = [
    "PPDB-2026-001",
    "Ahmad Putra Pratama",
    "Ahmad",
    "15/03/2020",
    "L",
    "Budi Pratama",
    "08123456789",
  ];
  XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: "A2" });

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
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 16 }, { wch: 28 }, { wch: 16 },
    { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 16 },
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
