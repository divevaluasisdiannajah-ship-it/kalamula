import { NextResponse } from "next/server";
import { getAllClassrooms } from "@/lib/classroom-store";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "true";
    const classrooms = getAllClassrooms();

    if (isAdmin) {
      return NextResponse.json({ success: true, data: classrooms });
    }

    // Hide pin for public listing
    const sanitized = classrooms.map(({ pin, ...rest }) => ({
      ...rest,
      has_pin: Boolean(pin),
    }));
    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
