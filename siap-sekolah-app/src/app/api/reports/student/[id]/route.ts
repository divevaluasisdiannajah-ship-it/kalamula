import { NextResponse } from "next/server";
import { findById } from "@/lib/db";
import { buildStudentProfile, generateQualitativeNarrative } from "@/lib/profiles";
import type { Student } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = findById<Student>("students", id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    const profile = buildStudentProfile(student);
    const qualitative = generateQualitativeNarrative(profile);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        narratives: qualitative.narratives,
        stimulations: qualitative.stimulations,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
