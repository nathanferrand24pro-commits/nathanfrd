import { prisma } from "./db";
import { DEFAULT_EXERCISES } from "./fitness";

// Insère les exercices du protocole au premier accès (idempotent).
export async function ensureDefaultExercises() {
  const count = await prisma.exercise.count();
  if (count > 0) return;
  await prisma.exercise.createMany({
    data: DEFAULT_EXERCISES.map((e) => ({ ...e, isDefault: true })),
  });
}
