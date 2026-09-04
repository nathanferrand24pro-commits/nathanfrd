import { prisma } from "../../../lib/db";
import { MUSCLE_GROUP_LABELS, MuscleGroup } from "../../../lib/fitness";
import {
  BodyWeightChart,
  ProgressChart,
  ProgressPoint,
} from "../../../components/ProgressChart";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

interface ExerciseProgress {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  points: ProgressPoint[]; // meilleure charge par séance, ordre chronologique
  record: { weight: number; reps: number; date: Date };
}

function fmtKg(v: number): string {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export default async function ProgressionPage() {
  // Séries de travail uniquement : les échauffements sont exclus des stats.
  const sets = await prisma.workoutSet.findMany({
    where: { isWarmup: false },
    include: { exercise: true, workout: true },
    orderBy: { workout: { date: "asc" } },
  });

  // Poids corporel : 90 derniers jours, ordre chronologique.
  const since = new Date();
  since.setDate(since.getDate() - 90);
  since.setHours(0, 0, 0, 0);
  const bodyWeights = await prisma.bodyWeightEntry.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
  });
  const lastEntry = bodyWeights.length > 0 ? bodyWeights[bodyWeights.length - 1] : null;
  let delta30: number | null = null;
  if (lastEntry) {
    const cutoff = new Date(lastEntry.date).getTime() - 30 * DAY_MS;
    const baseline = bodyWeights.find((w) => new Date(w.date).getTime() >= cutoff);
    if (baseline && baseline.id !== lastEntry.id) {
      delta30 = lastEntry.weightKg - baseline.weightKg;
    }
  }

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
      // À charge égale, on garde le nombre de répétitions le plus élevé
      // (même logique que le record ci-dessous).
      if (s.weightKg > last.weight || (s.weightKg === last.weight && s.reps > last.reps)) {
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

  return (
    <div className="space-y-6">
      {/* Poids corporel */}
      <div className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
            Poids corporel
          </h2>
          <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
            90 derniers jours
          </p>
        </div>

        {lastEntry ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 mb-4">
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--fit-ink)" }}>
                {fmtKg(lastEntry.weightKg)} kg
              </p>
              <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
                le{" "}
                {new Date(lastEntry.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {delta30 !== null && (
                <span className="pill-accent px-3 py-1 text-xs font-semibold tabular-nums">
                  {delta30 === 0
                    ? "stable"
                    : `${delta30 > 0 ? "+" : "−"}${fmtKg(Math.abs(delta30))} kg`}{" "}
                  sur 30 j
                </span>
              )}
            </div>

            {bodyWeights.length >= 2 ? (
              <>
                <BodyWeightChart
                  entries={bodyWeights.map((w) => ({
                    date: new Date(w.date).toISOString(),
                    weightKg: w.weightKg,
                  }))}
                />
                <p className="text-[11px] mt-2" style={{ color: "var(--fit-ink-3)" }}>
                  Ligne : moyenne mobile 7 jours · points : pesées
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
                Encore une pesée ou deux et la courbe apparaîtra ici.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
            Aucune pesée enregistrée pour l&apos;instant. Ajoutez votre poids du jour pour suivre
            son évolution ici.
          </p>
        )}
      </div>

      {progressions.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
            Aucune donnée pour l&apos;instant. Enregistrez des séries pendant vos séances de
            musculation pour suivre votre progression ici.
          </p>
        </div>
      ) : (
        <>
          {/* Records personnels */}
          <div className="glass p-5 sm:p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
              Records personnels
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs" style={{ color: "var(--fit-ink-3)" }}>
                    <th className="pb-2 font-medium">Exercice</th>
                    <th className="pb-2 font-medium">Groupe</th>
                    <th className="pb-2 font-medium text-right">Record</th>
                    <th className="pb-2 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--fit-grid)" }}>
                  {progressions.map((p) => (
                    <tr key={p.exerciseId}>
                      <td className="py-2 font-medium" style={{ color: "var(--fit-ink)" }}>
                        {p.name}
                      </td>
                      <td className="py-2" style={{ color: "var(--fit-ink-3)" }}>
                        {MUSCLE_GROUP_LABELS[p.muscleGroup as MuscleGroup] ?? p.muscleGroup}
                      </td>
                      <td
                        className="py-2 text-right tabular-nums"
                        style={{ color: "var(--fit-ink-2)" }}
                      >
                        {p.record.weight > 0
                          ? `${fmtKg(p.record.weight)} kg × ${p.record.reps}`
                          : `${p.record.reps} rép. (poids du corps)`}
                      </td>
                      <td
                        className="py-2 text-right tabular-nums"
                        style={{ color: "var(--fit-ink-3)" }}
                      >
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
              <div key={p.exerciseId} className="glass p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
                    {p.name}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
                    Charge max par séance · {p.points.length} séances
                  </p>
                </div>
                <ProgressChart points={p.points} />
                <details className="mt-2">
                  <summary
                    className="inline-flex items-center min-h-[44px] px-1 text-xs font-medium cursor-pointer select-none"
                    style={{ color: "var(--fit-accent-strong)" }}
                  >
                    Voir les données
                  </summary>
                  <table className="mt-1 text-xs w-full max-w-sm">
                    <thead>
                      <tr className="text-left" style={{ color: "var(--fit-ink-3)" }}>
                        <th className="py-1 font-medium">Date</th>
                        <th className="py-1 font-medium text-right">Charge</th>
                        <th className="py-1 font-medium text-right">Rép.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--fit-grid)" }}>
                      {p.points.map((pt) => (
                        <tr key={pt.date} style={{ color: "var(--fit-ink-2)" }}>
                          <td className="py-1.5">
                            {new Date(pt.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">{fmtKg(pt.weight)} kg</td>
                          <td className="py-1.5 text-right tabular-nums">{pt.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
