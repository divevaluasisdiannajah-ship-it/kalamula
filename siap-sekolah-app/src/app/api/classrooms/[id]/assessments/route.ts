import { NextResponse } from "next/server";
import {
  getClassroomAssessments,
  saveClassroomAssessment,
} from "@/lib/classroom-store";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessments = getClassroomAssessments(id);
    return NextResponse.json({ success: true, data: assessments });
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

    if (!body.student_id || !body.objective_id || !body.score_level) {
      return NextResponse.json(
        {
          success: false,
          error: "student_id, objective_id, dan score_level (1-4) wajib diisi.",
        },
        { status: 400 }
      );
    }

    const saved = saveClassroomAssessment({
      classroom_id: id,
      student_id: String(body.student_id),
      objective_id: String(body.objective_id),
      score_level: Number(body.score_level) as 1 | 2 | 3 | 4,
      anecdotal_note: body.anecdotal_note || null,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
