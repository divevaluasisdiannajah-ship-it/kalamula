export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDB, students as studentsTable } from '@/db';
import { parseExcelBuffer, validateRows, parseDateFlexible, normalizeGender, autoAssignObservationGroups, normalizeGroup } from '@/lib/excel';
import type { Student, ExcelStudentRow } from '@/types';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const previewOnly = url.searchParams.get('preview_only') === 'true';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const batchId = formData.get('batch_id') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }
    if (!batchId) {
      return NextResponse.json({ success: false, error: 'Batch ID wajib diisi' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rows = parseExcelBuffer(arrayBuffer);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'File Excel kosong' }, { status: 400 });
    }

    const db = getDB();
    const existingStudents = (await db.select().from(studentsTable).all()) as Student[];
    const results = validateRows(rows, existingStudents);

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        data: {
          total: results.length,
          valid: results.filter((r) => r.is_valid).length,
          invalid: results.filter((r) => !r.is_valid).length,
          results,
        },
      });
    }

    let imported = 0;
    let skipped = 0;

    const validItems: {
      row: ExcelStudentRow;
      birthDate: string;
      gender: 'L' | 'P';
      observation_group: string | null;
    }[] = [];

    for (const result of results) {
      if (!result.is_valid) { skipped++; continue; }

      const row = result.data;
      const birthDate = parseDateFlexible(row.Tanggal_Lahir?.trim() || '');
      const gender = normalizeGender(row.Jenis_Kelamin?.trim() || '');

      if (!birthDate || !gender) { skipped++; continue; }

      validItems.push({
        row,
        birthDate,
        gender,
        observation_group: normalizeGroup(row.Kelompok),
      });
    }

    // Auto-assign observation groups (Kelompok 1, 2, 3) if missing
    const assignedItems = autoAssignObservationGroups(validItems);

    for (const item of assignedItems) {
      const now = new Date().toISOString();
      const newStudent: Student = {
        id: crypto.randomUUID(),
        registration_no: item.row.No_Pendaftaran.trim(),
        full_name: item.row.Nama_Lengkap.trim(),
        nickname: item.row.Nama_Panggilan.trim(),
        birth_date: item.birthDate,
        gender: item.gender,
        parent_name: item.row.Nama_Orang_Tua?.trim() || null,
        phone: item.row.No_WhatsApp?.trim() || null,
        batch_id: batchId,
        observation_group: item.observation_group || null,
        avatar_seed: Math.random().toString(36).substring(2, 8),
        is_active: true,
        created_at: now,
        updated_at: now,
      };

      await db.insert(studentsTable).values(newStudent);
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: { imported, skipped, total: results.length, errors: results.filter((r) => !r.is_valid) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal mengimport data' }, { status: 500 });
  }
}
