export const runtime = 'edge';
import { NextResponse } from "next/server";
import { findWhere, remove } from "@/lib/db";
import { getSessionFromRequest, requireRole } from "@/lib/auth";
import { getBatchStudentProfiles } from "@/lib/profiles";
import { balanceClasses, buildClassBalanceMetrics } from "@/lib/balancer";
import type { ClassPlacement } from "@/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const batchId = url.searchParams.get("batch_id");

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "batch_id parameter is required" },
        { status: 400 }
      );
    }

    const profiles = getBatchStudentProfiles(batchId);
    const existingPlacements = findWhere<ClassPlacement>(
      "class_placements",
      (cp) => cp.batch_id === batchId
    );

    const studentsA = profiles.filter((p) => {
      const placement = existingPlacements.find((ep) => ep.student_id === p.student.id);
      return placement?.assigned_class === "1A";
    });

    const studentsB = profiles.filter((p) => {
      const placement = existingPlacements.find((ep) => ep.student_id === p.student.id);
      return placement?.assigned_class === "1B";
    });

    const unassigned = profiles.filter(
      (p) => !existingPlacements.some((ep) => ep.student_id === p.student.id)
    );

    const classA = buildClassBalanceMetrics("1A", studentsA);
    const classB = buildClassBalanceMetrics("1B", studentsB);

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        totalStudents: profiles.length,
        classA,
        classB,
        unassigned,
        placements: existingPlacements,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    const auth = requireRole(session, "admin");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json();
    const { batch_id, dry_run = false } = body;

    if (!batch_id) {
      return NextResponse.json(
        { success: false, error: "batch_id parameter is required" },
        { status: 400 }
      );
    }

    const profiles = getBatchStudentProfiles(batch_id);
    if (profiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada siswa pada batch ini" },
        { status: 400 }
      );
    }

    // Run Serpentine balancer algorithm
    const result = balanceClasses(profiles, batch_id);

    // If not dry run, persist to database
    if (!dry_run) {
      // Clear previous auto-placements for this batch
      const currentPlacements = findWhere<ClassPlacement>(
        "class_placements",
        (cp) => cp.batch_id === batch_id
      );
      currentPlacements.forEach((cp) => {
        remove("class_placements", cp.id);
      });

      // Insert new placements
      const { create } = await import("@/lib/db");
      result.placements.forEach((p) => {
        create<ClassPlacement>("class_placements", p);
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

