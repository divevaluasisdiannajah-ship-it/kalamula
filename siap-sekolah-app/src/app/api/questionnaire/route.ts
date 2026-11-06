export const runtime = "edge";

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDB, assessmentConfigs } from "@/db";
import { DEFAULT_QUESTIONS, type QuestionnaireQuestion } from "@/types/questionnaire";

const CONFIG_ID = "cfg-parent-questionnaire";

export async function GET() {
  try {
    const db = getDB();
    const config = (await db
      .select()
      .from(assessmentConfigs)
      .where(eq(assessmentConfigs.id, CONFIG_ID))
      .get()) as any;

    if (!config || !config.indicators_json) {
      return NextResponse.json({
        success: true,
        data: DEFAULT_QUESTIONS,
        is_default: true,
      });
    }

    const parsed: QuestionnaireQuestion[] = JSON.parse(config.indicators_json);
    return NextResponse.json({
      success: true,
      data: parsed.length > 0 ? parsed : DEFAULT_QUESTIONS,
      is_default: false,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: DEFAULT_QUESTIONS,
      error: err?.message,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: "Format pertanyaan tidak valid." },
        { status: 400 }
      );
    }

    const db = getDB();
    const now = new Date().toISOString();

    const existing = (await db
      .select()
      .from(assessmentConfigs)
      .where(eq(assessmentConfigs.id, CONFIG_ID))
      .get()) as any;

    if (existing) {
      await db
        .update(assessmentConfigs)
        .set({
          pos_name: "Kuesioner Orang Tua",
          pos_description: "Daftar pertanyaan riwayat perkembangan anak untuk wali murid",
          indicators_json: JSON.stringify(questions),
          updated_at: now,
        })
        .where(eq(assessmentConfigs.id, CONFIG_ID));
    } else {
      await db.insert(assessmentConfigs).values({
        id: CONFIG_ID,
        version: "1.0.0",
        pos_number: 0,
        pos_name: "Kuesioner Orang Tua",
        pos_description: "Daftar pertanyaan riwayat perkembangan anak untuk wali murid",
        indicators_json: JSON.stringify(questions),
        red_flags_json: "[]",
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Daftar pertanyaan kuesioner berhasil disimpan.",
      data: questions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Gagal menyimpan kuesioner." },
      { status: 500 }
    );
  }
}
