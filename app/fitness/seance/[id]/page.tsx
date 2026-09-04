import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import { ensureDefaultExercises } from "../../../../lib/fitness-db";
import { DAY_TYPE_LABELS, PHASE_INFO, DayType, Phase } from "../../../../lib/fitness";
import { WorkoutLogger } from "../../../../components/WorkoutLogger";
import { WorkoutMeta } from "../../../../components/WorkoutMeta";

export const dynamic = "force-dynamic";

// Groupes musculaires travaillés selon le jour du protocole.
const SUGGESTED_GROUPS: Partial<Record<DayType, string[]>> = {
  jambes: ["jambes", "mollets"],
  torse: ["poitrine", "dos", "epaules", "cou", "abdos"],
  bras: ["bras", "mollets", "cou"],
};

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureDefaultExercises();

  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { sets: { include: { exercise: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!workout) notFound();

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  const dayType = workout.dayType as DayType;
  const phase = workout.phase as Phase | null;
  const isResistance = ["jambes", "torse", "bras"].includes(dayType);
  const totalVolume = workout.sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  return (
    <div className="space-y-6">
      <Link href="/fitness" className="text-sm font-medium" style={{ color: "#bf4800" }}>
        ← Tableau de bord
      </Link>

      <div className="rounded-2xl p-6" style={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1d1d1f" }}>
              Séance {DAY_TYPE_LABELS[dayType] ?? workout.dayType}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6e6e73" }}>
              {new Date(workout.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {phase && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(191,72,0,0.08)", color: "#bf4800" }}
            >
              Phase {PHASE_INFO[phase].label.toLowerCase()} · {PHASE_INFO[phase].reps} ·{" "}
              {PHASE_INFO[phase].rest}
            </span>
          )}
        </div>

        {workout.sets.length > 0 && (
          <p className="text-sm mt-3" style={{ color: "#424245" }}>
            {workout.sets.length} série{workout.sets.length > 1 ? "s" : ""}
            {totalVolume > 0 &&
              ` · Volume total : ${totalVolume.toLocaleString("fr-FR")} kg (rép. × charge)`}
          </p>
        )}

        <div className="mt-5">
          <WorkoutMeta
            workoutId={workout.id}
            initialDurationMin={workout.durationMin}
            initialNotes={workout.notes}
          />
        </div>
      </div>

      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          {isResistance ? "Journal des séries" : "Journal (optionnel pour le cardio)"}
        </h2>
        <WorkoutLogger
          workoutId={workout.id}
          exercises={exercises.map((e) => ({
            id: e.id,
            name: e.name,
            muscleGroup: e.muscleGroup,
          }))}
          initialSets={workout.sets.map((s) => ({
            id: s.id,
            exerciseId: s.exerciseId,
            exerciseName: s.exercise.name,
            setNumber: s.setNumber,
            reps: s.reps,
            weightKg: s.weightKg,
          }))}
          suggestedGroups={SUGGESTED_GROUPS[dayType] ?? []}
        />
      </div>
    </div>
  );
}
