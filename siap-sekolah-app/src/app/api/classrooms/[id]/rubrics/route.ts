import { NextResponse } from "next/server";
import {
  getClassroomObjectives,
  addClassroomObjective,
} from "@/lib/classroom-store";
import type { DeepLearningDimensionId } from "@/types";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectives = getClassroomObjectives(id);
    return NextResponse.json({ success: true, data: objectives });
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

    if (!body.subject || !body.tp_title || !body.dimension_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Mata pelajaran, judul TP, dan Dimensi Deep Learning wajib diisi.",
        },
        { status: 400 }
      );
    }

    const newObj = addClassroomObjective({
      classroom_id: id,
      subject: String(body.subject).trim(),
      tp_code: body.tp_code ? String(body.tp_code).trim() : `TP-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      tp_title: String(body.tp_title).trim(),
      tp_description: String(body.tp_description || "").trim(),
      dimension_id: body.dimension_id as DeepLearningDimensionId,
      target_term: body.target_term || "Semester 1",
      is_active: true,
    });

    return NextResponse.json({ success: true, data: newObj });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
