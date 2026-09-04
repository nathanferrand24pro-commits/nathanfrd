import { prisma } from "../../../lib/db";
import { ensureDefaultExercises } from "../../../lib/fitness-db";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "../../../lib/fitness";
import { AddExerciseForm } from "../../../components/AddExerciseForm";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  await ensureDefaultExercises();
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    include: { _count: { select: { sets: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Ajouter un exercice
        </h2>
        <AddExerciseForm />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {MUSCLE_GROUPS.map((group) => {
          const groupExercises = exercises.filter((e) => e.muscleGroup === group);
          if (groupExercises.length === 0) return null;
          return (
            <div key={group} className="glass p-5 sm:p-6">
              <h2 className="text-base font-bold mb-3" style={{ color: "var(--fit-ink)" }}>
                {MUSCLE_GROUP_LABELS[group]}
              </h2>
              <ul className="space-y-1.5">
                {groupExercises.map((e) => (
                  <li
                    key={e.id}
                    className="glass-inset flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span style={{ color: "var(--fit-ink-2)" }}>{e.name}</span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--fit-ink-3)" }}>
                      {e._count.sets} série{e._count.sets > 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
