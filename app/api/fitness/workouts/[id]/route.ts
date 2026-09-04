import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { sets: { include: { exercise: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!workout) {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }
  return NextResponse.json(workout);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: { notes?: string | null; durationMin?: number | null } = {};
  if ("notes" in body) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if ("durationMin" in body) {
    data.durationMin =
      typeof body.durationMin === "number" && body.durationMin > 0 ? body.durationMin : null;
  }

  try {
    const workout = await prisma.workout.update({ where: { id }, data });
    return NextResponse.json(workout);
  } catch {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.workout.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  }
}
