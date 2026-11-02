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

// ─── Header Normalizer (Fuzzy Matcher) ─────────────────────────

export function normalizeHeaderKey(rawKey: unknown): keyof ExcelStudentRow | null {
  if (!rawKey) return null;
  const clean = String(rawKey).toLowerCase().replace(/[^a-z0-9]/g, "");

  if (
    clean.includes("pendaftaran") ||
    clean.includes("registrasi") ||
    clean === "noreg" ||
    clean === "nopen" ||
    clean === "nisn" ||
    clean === "no" ||
    clean === "id"
  ) {
    return "No_Pendaftaran";
  }
  if (clean.includes("panggilan") || clean.includes("nickname") || clean === "nick") {
    return "Nama_Panggilan";
  }
  if (
    clean.includes("lengkap") ||
    clean.includes("siswa") ||
    clean.includes("anak") ||
    clean.includes("peserta") ||
    clean === "nama"
  ) {
    return "Nama_Lengkap";
  }
  if (
    clean.includes("lahir") ||
    clean.includes("dob") ||
    clean.includes("birth") ||
    clean === "tgl"
  ) {
    return "Tanggal_Lahir";
  }
  if (
    clean.includes("kelamin") ||
    clean.includes("gender") ||
    clean.includes("sex") ||
    clean === "lp" ||
    clean === "jk"
  ) {
    return "Jenis_Kelamin";
  }
  if (
    clean.includes("orangtua") ||
    clean.includes("ortu") ||
    clean.includes("ayah") ||
    clean.includes("ibu") ||
    clean.includes("wali") ||
    clean.includes("parent")
  ) {
    return "Nama_Orang_Tua";
  }
  if (
    clean.includes("whatsapp") ||
    clean.includes("wa") ||
    clean.includes("hp") ||
    clean.includes("telepon") ||
    clean.includes("telp") ||
    clean.includes("phone") ||
    clean.includes("kontak")
  ) {
    return "No_WhatsApp";
  }
  if (
    clean.includes("kelompok") ||
    clean.includes("grup") ||
    clean.includes("group") ||
    clean.includes("rombel") ||
    clean.includes("kelas")
  ) {
    return "Kelompok";
  }
  return null;
}

// ─── Parse Uploaded Excel ──────────────────────────────────────

export function parseExcelBuffer(buffer: ArrayBuffer): ExcelStudentRow[] {
  const wb = XLSX.read(buffer, { type: "array" });

  // Find the first sheet with content
  let sheetName = wb.SheetNames[0];
  for (const name of wb.SheetNames) {
    const s = wb.Sheets[name];
    if (s && s["!ref"]) {
      sheetName = name;
      break;
    }
  }
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });

  if (rawRows.length === 0) return [];

  // If row 1 was a title header, check if headers start on a lower row
  const firstRowKeys = Object.keys(rawRows[0] || {});
  const recognizedCount = firstRowKeys.filter((k) => normalizeHeaderKey(k) !== null).length;

  let effectiveRows: Record<string, unknown>[] = rawRows;

  if (recognizedCount === 0) {
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
    const headerRowIndex = aoa.findIndex((row) => {
      if (!Array.isArray(row)) return false;
      const matches = row.filter((cell) => normalizeHeaderKey(cell) !== null);
      return matches.length >= 2;
    });

    if (headerRowIndex !== -1) {
      const headerRow = aoa[headerRowIndex] as unknown[];
      const dataRows = aoa.slice(headerRowIndex + 1);
      effectiveRows = dataRows.map((r) => {
        const rowObj: Record<string, unknown> = {};
        if (Array.isArray(r)) {
          r.forEach((cellVal, colIdx) => {
            const h = headerRow[colIdx];
            if (h) rowObj[String(h)] = cellVal;
          });
        }
        return rowObj;
      });
    }
  }

  const results: ExcelStudentRow[] = [];

  for (const raw of effectiveRows) {
    const row: Partial<ExcelStudentRow> = {};
    for (const [rawKey, rawValue] of Object.entries(raw)) {
      const mappedKey = normalizeHeaderKey(rawKey);
      if (mappedKey) {
        if (mappedKey === "Tanggal_Lahir") {
          const parsed = parseDateFlexible(rawValue);
          row[mappedKey] = parsed ? formatDateDisplay(parsed) : String(rawValue ?? "").trim();
        } else {
          row[mappedKey] = String(rawValue ?? "").trim();
        }
      }
    }

    // Ignore empty lines
    const hasAnyData = Object.values(row).some((v) => v && String(v).trim().length > 0);
    if (!hasAnyData) continue;

    // Auto-fill nickname from full name if missing
    if (row.Nama_Lengkap && !row.Nama_Panggilan) {
      row.Nama_Panggilan = row.Nama_Lengkap.trim().split(/\s+/)[0];
    }

    results.push(row as ExcelStudentRow);
  }

  return results;
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

export function parseDateFlexible(val: unknown): string | null {
  if (val === null || val === undefined) return null;

  // 1. Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. Excel numeric serial date code (e.g. 43600 or "43600")
  if (typeof val === "number" || (typeof val === "string" && /^\d{4,5}(\.\d+)?$/.test(val.trim()))) {
    const num = typeof val === "number" ? val : parseFloat(val);
    try {
      const parsed = XLSX.SSF.parse_date_code(num);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, "0");
        const d = String(parsed.d).padStart(2, "0");
        if (y >= 1990 && y <= 2035) {
          return `${y}-${m}-${d}`;
        }
      }
    } catch {
      // fallback to string parsing
    }
  }

  const dateStr = String(val).trim();
  if (!dateStr) return null;

  // 3. DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let match = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1990 && year <= 2035) {
      return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 4. YYYY-MM-DD or YYYY/MM/DD
  match = dateStr.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    const year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1990 && year <= 2035) {
      return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  // 5. 2-digit year: DD/MM/YY or M/D/YY (e.g. 15/05/19 or 5/15/19)
  match = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/);
  if (match) {
    const [, part1, part2, yy] = match;
    const p1 = parseInt(part1, 10);
    const p2 = parseInt(part2, 10);
    const fullYear = 2000 + parseInt(yy, 10);
    let d = p1;
    let m = p2;
    if (p1 <= 12 && p2 > 12) {
      m = p1;
      d = p2;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${fullYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  return null;
}

// ─── Gender Normalizer ─────────────────────────────────────────

export function normalizeGender(input: string): "L" | "P" | null {
  const lower = input.toLowerCase().trim();
  if (
    lower === "l" ||
    lower === "laki-laki" ||
    lower === "laki" ||
    lower === "laki - laki" ||
    lower === "pria" ||
    lower === "cowok" ||
    lower === "male" ||
    lower === "m"
  ) {
    return "L";
  }
  if (
    lower === "p" ||
    lower === "perempuan" ||
    lower === "wanita" ||
    lower === "cewek" ||
    lower === "female" ||
    lower === "f"
  ) {
    return "P";
  }
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
