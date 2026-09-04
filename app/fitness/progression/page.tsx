import { prisma } from "../../../lib/db";
import { MUSCLE_GROUP_LABELS, MuscleGroup } from "../../../lib/fitness";
import { ProgressChart, ProgressPoint } from "../../../components/ProgressChart";

export const dynamic = "force-dynamic";

interface ExerciseProgress {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  points: ProgressPoint[]; // meilleure charge par séance, ordre chronologique
  record: { weight: number; reps: number; date: Date };
}

export default async function ProgressionPage() {
  const sets = await prisma.workoutSet.findMany({
    include: { exercise: true, workout: true },
    orderBy: { workout: { date: "asc" } },
  });

  // Meilleure série (charge max) par exercice et par séance.
  const byExercise = new Map<string, ExerciseProgress>();
  for (const s of sets) {
    let entry = byExercise.get(s.exerciseId);
    if (!entry) {
      entry = {
        exerciseId: s.exerciseId,
        name: s.exercise.name,
        muscleGroup: s.exercise.muscleGroup,
        points: [],
        record: { weight: s.weightKg, reps: s.reps, date: s.workout.date },
      };
      byExercise.set(s.exerciseId, entry);
    }
    const dateIso = new Date(s.workout.date).toISOString();
    const last = entry.points[entry.points.length - 1];
    if (last && last.date === dateIso) {
      if (s.weightKg > last.weight) {
        last.weight = s.weightKg;
        last.reps = s.reps;
      }
    } else {
      entry.points.push({ date: dateIso, weight: s.weightKg, reps: s.reps });
    }
    if (
      s.weightKg > entry.record.weight ||
      (s.weightKg === entry.record.weight && s.reps > entry.record.reps)
    ) {
      entry.record = { weight: s.weightKg, reps: s.reps, date: s.workout.date };
    }
  }

  const progressions = [...byExercise.values()].sort(
    (a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name)
  );

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  if (progressions.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center" style={card}>
        <p className="text-sm" style={{ color: "#6e6e73" }}>
          Aucune donnée pour l&apos;instant. Enregistrez des séries pendant vos séances de
          musculation pour suivre votre progression ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Records personnels */}
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          Records personnels
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: "#6e6e73" }}>
                <th className="pb-2 font-medium">Exercice</th>
                <th className="pb-2 font-medium">Groupe</th>
                <th className="pb-2 font-medium text-right">Record</th>
                <th className="pb-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              {progressions.map((p) => (
                <tr key={p.exerciseId}>
                  <td className="py-2 font-medium" style={{ color: "#1d1d1f" }}>
                    {p.name}
                  </td>
                  <td className="py-2" style={{ color: "#6e6e73" }}>
                    {MUSCLE_GROUP_LABELS[p.muscleGroup as MuscleGroup] ?? p.muscleGroup}
                  </td>
                  <td className="py-2 text-right tabular-nums" style={{ color: "#424245" }}>
                    {p.record.weight > 0
                      ? `${p.record.weight} kg × ${p.record.reps}`
                      : `${p.record.reps} rép. (poids du corps)`}
                  </td>
                  <td className="py-2 text-right tabular-nums" style={{ color: "#6e6e73" }}>
                    {new Date(p.record.date).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courbes par exercice */}
      {progressions
        .filter((p) => p.points.length >= 2 && p.points.some((pt) => pt.weight > 0))
        .map((p) => (
          <div key={p.exerciseId} className="rounded-2xl p-6" style={card}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "#1d1d1f" }}>
                {p.name}
              </h2>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                Charge max par séance · {p.points.length} séances
              </p>
            </div>
            <ProgressChart points={p.points} />
            <details className="mt-3">
              <summary className="text-xs cursor-pointer" style={{ color: "#bf4800" }}>
                Voir les données
              </summary>
              <table className="mt-2 text-xs w-full max-w-sm">
                <thead>
                  <tr className="text-left" style={{ color: "#6e6e73" }}>
                    <th className="py-1 font-medium">Date</th>
                    <th className="py-1 font-medium text-right">Charge</th>
                    <th className="py-1 font-medium text-right">Rép.</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {p.points.map((pt) => (
                    <tr key={pt.date} style={{ color: "#424245" }}>
                      <td className="py-1">{new Date(pt.date).toLocaleDateString("fr-FR")}</td>
                      <td className="py-1 text-right tabular-nums">{pt.weight} kg</td>
                      <td className="py-1 text-right tabular-nums">{pt.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        ))}
    </div>
  );
}
