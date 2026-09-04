import Link from "next/link";
import { prisma } from "../../lib/db";
import { ensureDefaultExercises } from "../../lib/fitness-db";
import {
  WEEKLY_PROTOCOL,
  PHASE_INFO,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  WEEKLY_SETS_TARGET,
  currentPhase,
  protocolDayFor,
  DAY_TYPE_LABELS,
  DayType,
} from "../../lib/fitness";
import { NewWorkoutButton } from "../../components/NewWorkoutButton";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default async function FitnessDashboard() {
  await ensureDefaultExercises();

  const now = new Date();
  const today = protocolDayFor(now);
  const phase = currentPhase(now);
  const phaseInfo = PHASE_INFO[phase];

  // Semaine du protocole : du dimanche 00h00 au samedi soir.
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekWorkouts = await prisma.workout.findMany({
    where: { date: { gte: weekStart } },
    include: { sets: { include: { exercise: true } } },
    orderBy: { date: "asc" },
  });

  const recentWorkouts = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    take: 5,
    include: { sets: true },
  });

  // Volume hebdomadaire : séries par groupe musculaire.
  const setsByGroup = new Map<string, number>();
  for (const w of weekWorkouts) {
    for (const s of w.sets) {
      setsByGroup.set(s.exercise.muscleGroup, (setsByGroup.get(s.exercise.muscleGroup) ?? 0) + 1);
    }
  }

  const doneDayTypes = new Set(weekWorkouts.map((w) => w.dayType));
  const todayDone = weekWorkouts.some(
    (w) => new Date(w.date).toDateString() === now.toDateString() && w.dayType === today.dayType
  );

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  return (
    <div className="space-y-6">
      {/* Aujourd'hui + phase */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-2xl p-6" style={card}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#bf4800" }}>
            Aujourd&apos;hui — {DAY_NAMES[now.getDay()]}
          </p>
          <h2 className="text-xl font-bold mt-1" style={{ color: "#1d1d1f" }}>
            {today.icon} {today.title}
          </h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#6e6e73" }}>
            {today.subtitle}
            {today.isResistance && ` · Phase ${phaseInfo.label.toLowerCase()}`}
          </p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "#424245" }}>
            {today.description}
          </p>
          <div className="mt-5">
            {todayDone ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: "rgba(52,199,89,0.12)", color: "#248a3d" }}
              >
                ✓ Séance du jour enregistrée
              </span>
            ) : (
              <NewWorkoutButton
                dayType={today.dayType}
                label={`Démarrer : ${today.title}`}
                primary
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={card}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#bf4800" }}>
            Phase du mois
          </p>
          <h2 className="text-xl font-bold mt-1" style={{ color: "#1d1d1f" }}>
            {phaseInfo.label}
          </h2>
          <ul className="text-sm mt-3 space-y-1.5" style={{ color: "#424245" }}>
            <li>· {phaseInfo.reps}</li>
            <li>· {phaseInfo.sets}</li>
            <li>· {phaseInfo.rest}</li>
          </ul>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "#6e6e73" }}>
            {phaseInfo.description}
          </p>
        </div>
      </div>

      {/* Planning hebdomadaire */}
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          Planning de la semaine
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {WEEKLY_PROTOCOL.map((day, i) => {
            const isToday = i === now.getDay();
            const done = doneDayTypes.has(day.dayType) && i <= now.getDay();
            return (
              <div
                key={day.dayType}
                className="rounded-xl p-3 text-center"
                style={{
                  background: isToday ? "rgba(191,72,0,0.08)" : "#f5f5f7",
                  border: isToday ? "1px solid rgba(191,72,0,0.35)" : "1px solid transparent",
                }}
              >
                <p className="text-[11px] font-semibold uppercase" style={{ color: "#6e6e73" }}>
                  {DAY_NAMES[i].slice(0, 3)}
                </p>
                <p className="text-2xl my-1">{day.icon}</p>
                <p className="text-xs font-medium leading-tight" style={{ color: "#1d1d1f" }}>
                  {DAY_TYPE_LABELS[day.dayType]}
                </p>
                {done && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: "#248a3d" }}>
                    ✓ fait
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume hebdomadaire */}
      <div className="rounded-2xl p-6" style={card}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "#1d1d1f" }}>
            Volume de la semaine
          </h2>
          <p className="text-xs" style={{ color: "#6e6e73" }}>
            Objectif : ~{WEEKLY_SETS_TARGET} séries de travail par groupe musculaire
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {MUSCLE_GROUPS.map((group) => {
            const count = setsByGroup.get(group) ?? 0;
            const pct = Math.min(100, (count / WEEKLY_SETS_TARGET) * 100);
            return (
              <div key={group} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0" style={{ color: "#424245" }}>
                  {MUSCLE_GROUP_LABELS[group]}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "#e8e8ed" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: count >= WEEKLY_SETS_TARGET ? "#34c759" : "#bf4800",
                    }}
                  />
                </div>
                <span className="text-xs w-12 text-right tabular-nums" style={{ color: "#6e6e73" }}>
                  {count}/{WEEKLY_SETS_TARGET}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dernières séances */}
      <div className="rounded-2xl p-6" style={card}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "#1d1d1f" }}>
            Dernières séances
          </h2>
          <Link href="/fitness/seances" className="text-sm font-medium" style={{ color: "#bf4800" }}>
            Tout l&apos;historique →
          </Link>
        </div>
        {recentWorkouts.length === 0 ? (
          <p className="text-sm" style={{ color: "#6e6e73" }}>
            Aucune séance enregistrée pour l&apos;instant. Démarrez la séance du jour ci-dessus.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {recentWorkouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/fitness/seance/${w.id}`}
                  className="flex items-center justify-between py-3 group"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1d1d1f" }}>
                      {DAY_TYPE_LABELS[w.dayType as DayType] ?? w.dayType}
                      {w.phase && (
                        <span className="ml-2 text-xs" style={{ color: "#bf4800" }}>
                          {PHASE_INFO[w.phase as keyof typeof PHASE_INFO]?.label}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#6e6e73" }}>
                      {new Date(w.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {" · "}
                      {w.sets.length} série{w.sets.length > 1 ? "s" : ""}
                      {w.durationMin ? ` · ${w.durationMin} min` : ""}
                    </p>
                  </div>
                  <span className="text-sm" style={{ color: "#bf4800" }}>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
