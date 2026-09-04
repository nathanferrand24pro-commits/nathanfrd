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

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          Ajouter un exercice
        </h2>
        <AddExerciseForm />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {MUSCLE_GROUPS.map((group) => {
          const groupExercises = exercises.filter((e) => e.muscleGroup === group);
          if (groupExercises.length === 0) return null;
          return (
            <div key={group} className="rounded-2xl p-6" style={card}>
              <h2 className="text-base font-bold mb-3" style={{ color: "#1d1d1f" }}>
                {MUSCLE_GROUP_LABELS[group]}
              </h2>
              <ul className="space-y-1.5">
                {groupExercises.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#f5f5f7" }}
                  >
                    <span style={{ color: "#424245" }}>{e.name}</span>
                    <span className="text-xs tabular-nums" style={{ color: "#6e6e73" }}>
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
