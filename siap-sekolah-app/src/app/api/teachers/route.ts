import { NextResponse } from "next/server";
import { getAllTeachers, saveTeacher, deleteTeacher } from "@/lib/school-store";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const assignedClass = searchParams.get("class");
    const isEvaluator = searchParams.get("evaluator");

    let teachers = getAllTeachers();

    if (role) {
      teachers = teachers.filter((t) => t.role === role);
    }
    if (assignedClass) {
      teachers = teachers.filter((t) => t.assigned_class?.toUpperCase() === assignedClass.toUpperCase());
    }
    if (isEvaluator === "true") {
      teachers = teachers.filter((t) => t.is_evaluator);
    }

    return NextResponse.json({ success: true, data: teachers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Nama lengkap guru wajib diisi" },
        { status: 400 }
      );
    }

    const saved = saveTeacher({
      name: body.name,
      nip_niy: body.nip_niy || "-",
      gender: body.gender === "P" ? "P" : "L",
      phone: body.phone || "-",
      email: body.email || "",
      role: body.role || "homeroom",
      assigned_class: body.assigned_class || null,
      subject_specialty: body.subject_specialty || null,
      is_evaluator: Boolean(body.is_evaluator),
      evaluator_pos: body.evaluator_pos ? Number(body.evaluator_pos) : null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    });

    return NextResponse.json({
      success: true,
      message: `Data ${saved.name} berhasil disimpan`,
      data: saved,
    });
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
    if (!body.id || !body.name) {
      return NextResponse.json(
        { success: false, error: "ID dan nama guru wajib diisi" },
        { status: 400 }
      );
    }

    const saved = saveTeacher(body);
    return NextResponse.json({
      success: true,
      message: `Data ${saved.name} berhasil diperbarui`,
      data: saved,
    });
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter id wajib disertakan" },
        { status: 400 }
      );
    }

    const ok = deleteTeacher(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
