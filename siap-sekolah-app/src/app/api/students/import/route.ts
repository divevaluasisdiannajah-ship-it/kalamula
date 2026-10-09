import { NextResponse } from 'next/server';
import { findAll, create, generateId } from '@/lib/db';
import { parseExcelBuffer, validateRows, parseDateFlexible, normalizeGender } from '@/lib/excel';
import type { Student } from '@/types';

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

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer();
    const rows = parseExcelBuffer(arrayBuffer);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'File Excel kosong' }, { status: 400 });
    }

    // Validate against existing students
    const existingStudents = findAll<Student>('students');
    const results = validateRows(rows, existingStudents);

    // Preview mode: return validation results only
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

    // Import valid rows
    let imported = 0;
    let skipped = 0;

    for (const result of results) {
      if (!result.is_valid) {
        skipped++;
        continue;
      }

      const row = result.data;
      const birthDate = parseDateFlexible(row.Tanggal_Lahir?.trim() || '');
      const gender = normalizeGender(row.Jenis_Kelamin?.trim() || '');

      if (!birthDate || !gender) {
        skipped++;
        continue;
      }

      const newStudent: Student = {
        id: generateId(),
        registration_no: row.No_Pendaftaran.trim(),
        full_name: row.Nama_Lengkap.trim(),
        nickname: row.Nama_Panggilan.trim(),
        birth_date: birthDate,
        gender,
        parent_name: row.Nama_Orang_Tua?.trim() || null,
        phone: row.No_WhatsApp?.trim() || null,
        batch_id: batchId,
        avatar_seed: Math.random().toString(36).substring(2, 8),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      create<Student>('students', newStudent);
      imported++;
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped,
        total: results.length,
        errors: results.filter((r) => !r.is_valid),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal mengimport data' }, { status: 500 });
  }
}
