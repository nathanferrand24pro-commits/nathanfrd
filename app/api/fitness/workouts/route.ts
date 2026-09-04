import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { DAY_TYPE_LABELS, DayType, currentPhase } from "../../../../lib/fitness";

export async function GET() {
  const workouts = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: { sets: { include: { exercise: true } } },
  });
  return NextResponse.json(workouts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const dayType = body.dayType as DayType;

  if (!Object.keys(DAY_TYPE_LABELS).includes(dayType)) {
    return NextResponse.json({ error: "Type de séance invalide" }, { status: 400 });
  }

  const date = body.date ? new Date(body.date) : new Date();
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const isResistance = ["jambes", "torse", "bras"].includes(dayType);

  const workout = await prisma.workout.create({
    data: {
      dayType,
      date,
      phase: isResistance ? currentPhase(date) : null,
      durationMin: typeof body.durationMin === "number" ? body.durationMin : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(workout, { status: 201 });
}
