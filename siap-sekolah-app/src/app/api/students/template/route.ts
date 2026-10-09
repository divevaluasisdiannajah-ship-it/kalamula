export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { generateTemplate } from '@/lib/excel';

export async function GET() {
  try {
    const buffer = generateTemplate();
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=template_data_siswa.xlsx',
        'Content-Length': uint8.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Gagal menghasilkan template' }, { status: 500 });
  }
}

