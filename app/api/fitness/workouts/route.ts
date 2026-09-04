import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { DAY_TYPE_LABELS, DayType, resolvePhase } from "../../../../lib/fitness";

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

  // "YYYY-MM-DD" est interprété en heure locale (minuit), pas en UTC.
  const date =
    typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? new Date(`${body.date}T00:00:00`)
      : body.date
        ? new Date(body.date)
        : new Date();
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const isResistance = ["jambes", "torse", "bras"].includes(dayType);
  const setting = await prisma.fitnessSetting.findUnique({ where: { id: "default" } });

  const workout = await prisma.workout.create({
    data: {
      dayType,
      date,
      phase: isResistance ? resolvePhase(date, setting?.phaseOverride) : null,
      durationMin: typeof body.durationMin === "number" ? body.durationMin : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });
  return NextResponse.json(workout, { status: 201 });
}
