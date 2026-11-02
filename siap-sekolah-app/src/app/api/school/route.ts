import { NextResponse } from "next/server";
import { getSchoolProfile, updateSchoolProfile } from "@/lib/school-store";

export const runtime = "edge";

export async function GET() {
  try {
    const profile = getSchoolProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = updateSchoolProfile(body);
    return NextResponse.json({
      success: true,
      message: "Identitas sekolah berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
