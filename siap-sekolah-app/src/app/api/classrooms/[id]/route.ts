import { NextResponse } from "next/server";
import {
  getClassroomById,
  verifyClassroomPin,
  updateClassroomPin,
} from "@/lib/classroom-store";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classroom = getClassroomById(id);
    if (!classroom) {
      return NextResponse.json(
        { success: false, error: `Kelas ${id} tidak ditemukan` },
        { status: 404 }
      );
    }
    // Return sanitized classroom
    const { pin, ...rest } = classroom;
    return NextResponse.json({
      success: true,
      data: { ...rest, has_pin: Boolean(pin) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Verify PIN
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pin = String(body.pin || "");

    const isValid = verifyClassroomPin(id, pin);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "PIN ruang kelas salah. Coba lagi atau hubungi Admin." },
        { status: 401 }
      );
    }

    const classroom = getClassroomById(id);
    return NextResponse.json({
      success: true,
      message: `Berhasil masuk ${classroom?.name}`,
      data: { classroom_id: classroom?.id, name: classroom?.name },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT: Update PIN (Used by Admin SPMB)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const newPin = String(body.new_pin || "");

    if (!newPin || newPin.length < 4) {
      return NextResponse.json(
        { success: false, error: "PIN harus minimal 4 karakter numerik." },
        { status: 400 }
      );
    }

    const updated = updateClassroomPin(id, newPin);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Kelas ${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `PIN ${id} berhasil diperbarui`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
