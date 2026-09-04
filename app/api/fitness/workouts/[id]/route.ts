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

  const data: {
    notes?: string | null;
    durationMin?: number | null;
    distanceKm?: number | null;
    avgHeartRate?: number | null;
    rpe?: number | null;
  } = {};
  if ("notes" in body) {
    data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  }
  if ("durationMin" in body) {
    data.durationMin =
      typeof body.durationMin === "number" && body.durationMin > 0
        ? Math.round(body.durationMin)
        : null;
  }
  if ("distanceKm" in body) {
    data.distanceKm =
      typeof body.distanceKm === "number" && body.distanceKm > 0 && body.distanceKm <= 500
        ? body.distanceKm
        : null;
  }
  if ("avgHeartRate" in body) {
    data.avgHeartRate =
      typeof body.avgHeartRate === "number" && body.avgHeartRate >= 40 && body.avgHeartRate <= 240
        ? Math.round(body.avgHeartRate)
        : null;
  }
  if ("rpe" in body) {
    data.rpe =
      typeof body.rpe === "number" && body.rpe >= 1 && body.rpe <= 10 ? Math.round(body.rpe) : null;
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
