import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import { ensureDefaultExercises } from "../../../../lib/fitness-db";
import { DAY_TYPE_LABELS, PHASE_INFO, DayType, Phase } from "../../../../lib/fitness";
import { WorkoutLogger, LastExerciseInfo } from "../../../../components/WorkoutLogger";
import { WorkoutMeta } from "../../../../components/WorkoutMeta";

export const dynamic = "force-dynamic";

// Groupes musculaires travaillés selon le jour du protocole.
const SUGGESTED_GROUPS: Partial<Record<DayType, string[]>> = {
  jambes: ["jambes", "mollets"],
  torse: ["poitrine", "dos", "epaules", "cou", "abdos"],
  bras: ["bras", "mollets", "cou"],
};

function formatKg(value: number): string {
  return value.toLocaleString("fr-FR");
}

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

  // « La dernière fois » : séries de travail (hors échauffement) de la dernière
  // séance précédente où chaque exercice apparaît (séance courante exclue).
  const prevSets = await prisma.workoutSet.findMany({
    where: {
      workoutId: { not: workout.id },
      isWarmup: false,
      workout: { date: { lte: workout.date } },
    },
    include: { workout: { select: { date: true } } },
    orderBy: [{ workout: { date: "desc" } }, { setNumber: "asc" }],
  });

  const lastWorkoutFor = new Map<string, string>(); // exerciseId -> workoutId retenu
  const lastSetsFor = new Map<string, typeof prevSets>();
  for (const s of prevSets) {
    const chosen = lastWorkoutFor.get(s.exerciseId);
    if (chosen === undefined) {
      lastWorkoutFor.set(s.exerciseId, s.workoutId);
      lastSetsFor.set(s.exerciseId, [s]);
    } else if (chosen === s.workoutId) {
      lastSetsFor.get(s.exerciseId)!.push(s);
    }
  }

  const lastByExercise: Record<string, LastExerciseInfo> = {};
  for (const [exerciseId, list] of lastSetsFor) {
    list.sort((a, b) => a.setNumber - b.setNumber);
    const repsValues = list.map((s) => s.reps);
    const weightValues = list.map((s) => s.weightKg);
    const repsMin = Math.min(...repsValues);
    const repsMax = Math.max(...repsValues);
    const repsLabel = repsMin === repsMax ? String(repsMax) : `${repsMin}–${repsMax}`;
    const wMin = Math.min(...weightValues);
    const wMax = Math.max(...weightValues);
    const weightLabel =
      wMax <= 0
        ? "poids du corps"
        : wMin === wMax
          ? `${formatKg(wMax)} kg`
          : `${formatKg(wMin)}–${formatKg(wMax)} kg`;
    const dateLabel = new Date(list[0].workout.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    lastByExercise[exerciseId] = {
      summary: `${list.length} × ${repsLabel} @ ${weightLabel} (${dateLabel})`,
      lastWeightKg: weightValues[weightValues.length - 1],
    };
  }

  const dayType = workout.dayType as DayType;
  const phase = workout.phase as Phase | null;
  const isResistance = ["jambes", "torse", "bras"].includes(dayType);

  // Compteur et volume : séries de travail uniquement (échauffements exclus).
  const workingSets = workout.sets.filter((s) => !s.isWarmup);
  const warmupCount = workout.sets.length - workingSets.length;
  const totalVolume = workingSets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/fitness"
        className="inline-flex items-center min-h-[44px] text-sm font-medium"
        style={{ color: "var(--fit-accent-strong)" }}
      >
        ← Tableau de bord
      </Link>

      <div className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--fit-ink)" }}>
              Séance {DAY_TYPE_LABELS[dayType] ?? workout.dayType}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--fit-ink-2)" }}>
              {new Date(workout.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {phase && (
            <span className="pill-accent px-3 py-1 text-xs font-semibold">
              Phase {PHASE_INFO[phase].label.toLowerCase()} · {PHASE_INFO[phase].reps} ·{" "}
              {PHASE_INFO[phase].rest}
            </span>
          )}
        </div>

        {workout.sets.length > 0 && (
          <p className="text-sm mt-3 tabular-nums" style={{ color: "var(--fit-ink-2)" }}>
            {workingSets.length} série{workingSets.length > 1 ? "s" : ""} de travail
            {warmupCount > 0 &&
              ` (+ ${warmupCount} échauffement${warmupCount > 1 ? "s" : ""})`}
            {totalVolume > 0 &&
              ` · Volume total : ${totalVolume.toLocaleString("fr-FR")} kg (rép. × charge)`}
          </p>
        )}

        <div className="mt-5">
          <WorkoutMeta
            workoutId={workout.id}
            dayType={workout.dayType}
            initialDurationMin={workout.durationMin}
            initialNotes={workout.notes}
            initialDistanceKm={workout.distanceKm}
            initialAvgHeartRate={workout.avgHeartRate}
            initialRpe={workout.rpe}
          />
        </div>
      </div>

      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
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
            isWarmup: s.isWarmup,
          }))}
          suggestedGroups={SUGGESTED_GROUPS[dayType] ?? []}
          phase={phase}
          lastByExercise={lastByExercise}
        />
      </div>
    </div>
  );
}
