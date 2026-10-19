import { NextResponse } from "next/server";
import {
  getClassroomStudents,
  addClassroomStudent,
  deleteClassroomStudent,
} from "@/lib/classroom-store";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const students = getClassroomStudents(id);
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if bulk import or single student
    if (Array.isArray(body.students)) {
      const added = body.students.map((st: {
        nisn?: string;
        full_name: string;
        nickname?: string;
        gender: "L" | "P";
        learning_group?: string;
        notes?: string;
      }) =>
        addClassroomStudent({
          classroom_id: id,
          nisn: st.nisn || `013${Math.floor(1000000 + Math.random() * 9000000)}`,
          full_name: st.full_name,
          nickname: st.nickname || st.full_name.split(" ")[0],
          gender: st.gender === "P" ? "P" : "L",
          learning_group: st.learning_group || "Kelompok Reguler",
          notes: st.notes || null,
        })
      );
      return NextResponse.json({
        success: true,
        message: `${added.length} siswa berhasil ditambahkan`,
        data: added,
      });
    }

    if (!body.full_name) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap siswa wajib diisi." },
        { status: 400 }
      );
    }

    const student = addClassroomStudent({
      classroom_id: id,
      nisn: body.nisn || `013${Math.floor(1000000 + Math.random() * 9000000)}`,
      full_name: body.full_name,
      nickname: body.nickname || body.full_name.split(" ")[0],
      gender: body.gender === "P" ? "P" : "L",
      learning_group: body.learning_group || "Kelompok Reguler",
      notes: body.notes || null,
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "student_id is required" },
        { status: 400 }
      );
    }
    const ok = deleteClassroomStudent(studentId);
    return NextResponse.json({ success: ok });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
