import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { workoutId, exerciseId } = body;
  const reps = Number(body.reps);
  const weightKg = Number(body.weightKg ?? 0);

  if (typeof workoutId !== "string" || typeof exerciseId !== "string") {
    return NextResponse.json({ error: "Séance et exercice requis" }, { status: 400 });
  }
  if (!Number.isInteger(reps) || reps < 1 || reps > 200) {
    return NextResponse.json({ error: "Nombre de répétitions invalide" }, { status: 400 });
  }
  if (isNaN(weightKg) || weightKg < 0 || weightKg > 1000) {
    return NextResponse.json({ error: "Charge invalide" }, { status: 400 });
  }

  const [workout, exercise] = await Promise.all([
    prisma.workout.findUnique({ where: { id: workoutId } }),
    prisma.exercise.findUnique({ where: { id: exerciseId } }),
  ]);
  if (!workout) return NextResponse.json({ error: "Séance non trouvée" }, { status: 404 });
  if (!exercise) return NextResponse.json({ error: "Exercice non trouvé" }, { status: 404 });

  // max + 1 (et non count + 1) : après une suppression, count réutiliserait
  // un numéro de série déjà attribué.
  const maxSet = await prisma.workoutSet.aggregate({
    where: { workoutId, exerciseId },
    _max: { setNumber: true },
  });
  const setNumber = (maxSet._max.setNumber ?? 0) + 1;

  const set = await prisma.workoutSet.create({
    data: { workoutId, exerciseId, setNumber, reps, weightKg, isWarmup: body.isWarmup === true },
    include: { exercise: true },
  });
  return NextResponse.json(set, { status: 201 });
}
