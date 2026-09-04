import { prisma } from "./db";
import { DEFAULT_EXERCISES } from "./fitness";

// Insère les exercices du protocole au premier accès (idempotent).
export async function ensureDefaultExercises() {
  const count = await prisma.exercise.count();
  if (count > 0) return;
  try {
    await prisma.exercise.createMany({
      data: DEFAULT_EXERCISES.map((e) => ({ ...e, isDefault: true })),
    });
  } catch {
    // Deux requêtes concurrentes au premier accès : la seconde insertion viole
    // l'unicité du nom — les exercices sont déjà là, rien à faire.
  }
}
