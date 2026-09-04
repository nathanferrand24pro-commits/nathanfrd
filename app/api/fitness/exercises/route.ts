import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { ensureDefaultExercises } from "../../../../lib/fitness-db";
import { MUSCLE_GROUPS, MuscleGroup } from "../../../../lib/fitness";

export async function GET() {
  await ensureDefaultExercises();
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(exercises);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const muscleGroup = body.muscleGroup as MuscleGroup;

  if (!name) {
    return NextResponse.json({ error: "Nom de l'exercice requis" }, { status: 400 });
  }
  if (!MUSCLE_GROUPS.includes(muscleGroup)) {
    return NextResponse.json({ error: "Groupe musculaire invalide" }, { status: 400 });
  }

  const existing = await prisma.exercise.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "Cet exercice existe déjà" }, { status: 409 });
  }

  const exercise = await prisma.exercise.create({ data: { name, muscleGroup } });
  return NextResponse.json(exercise, { status: 201 });
}
