import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Export complet des données fitness (sauvegarde JSON).
export async function GET() {
  const [workouts, exercises, foodEntries, sleepEntries, bodyWeight, water, goal, setting] =
    await Promise.all([
      prisma.workout.findMany({ include: { sets: { include: { exercise: true } } } }),
      prisma.exercise.findMany(),
      prisma.foodEntry.findMany(),
      prisma.sleepEntry.findMany(),
      prisma.bodyWeightEntry.findMany(),
      prisma.waterEntry.findMany(),
      prisma.nutritionGoal.findUnique({ where: { id: "default" } }),
      prisma.fitnessSetting.findUnique({ where: { id: "default" } }),
    ]);

  return new NextResponse(
    JSON.stringify(
      {
        exporteLe: new Date().toISOString(),
        seances: workouts,
        exercices: exercises,
        nutrition: { entrees: foodEntries, objectifs: goal },
        sommeil: sleepEntries,
        poids: bodyWeight,
        hydratation: water,
        reglages: setting,
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="fitness-export.json"',
      },
    }
  );
}
