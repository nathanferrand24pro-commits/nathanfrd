import Link from "next/link";
import { prisma } from "../../lib/db";
import { ensureDefaultExercises } from "../../lib/fitness-db";
import {
  WEEKLY_PROTOCOL,
  PHASE_INFO,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUPS,
  WEEKLY_SETS_TARGET,
  resolvePhase,
  protocolDayFor,
  DAY_TYPE_LABELS,
  DayType,
  Phase,
} from "../../lib/fitness";
import { NewWorkoutButton } from "../../components/NewWorkoutButton";
import { WaterQuickAdd } from "../../components/WaterQuickAdd";
import { WeightQuickAdd } from "../../components/WeightQuickAdd";
import { PhaseSelector } from "../../components/PhaseSelector";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Séances planifiées par semaine hors jour de récupération.
const PLANNED_SESSIONS_PER_WEEK = 6;
const ADHERENCE_WEEKS = 12; // profondeur d'historique pour le streak
const STRIP_WEEKS = 8; // mini frise

// Écart en jours entre deux dates (minuit local → minuit local).
function dayDiff(a: Date, b: Date): number {
  const am = new Date(a);
  am.setHours(0, 0, 0, 0);
  const bm = new Date(b);
  bm.setHours(0, 0, 0, 0);
  return Math.round((am.getTime() - bm.getTime()) / 86400000);
}

export default async function FitnessDashboard() {
  await ensureDefaultExercises();

  const now = new Date();
  const today = protocolDayFor(now);

  // Phase effective : réglage manuel (FitnessSetting) prioritaire sur l'alternance auto.
  const setting = await prisma.fitnessSetting.findUnique({ where: { id: "default" } });
  const phaseOverride: Phase | null =
    setting?.phaseOverride === "force" || setting?.phaseOverride === "hypertrophie"
      ? setting.phaseOverride
      : null;
  const phase = resolvePhase(now, phaseOverride);
  const phaseInfo = PHASE_INFO[phase];
  const waterGoalMl = setting?.waterGoalMl ?? 2500;

  // Semaine du protocole : du dimanche 00h00 au samedi soir.
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sevenDaysAgo = new Date(dayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const historyStart = new Date(weekStart);
  historyStart.setDate(historyStart.getDate() - 7 * (ADHERENCE_WEEKS - 1));

  const [
    weekWorkouts,
    recentWorkouts,
    todayFood,
    nutritionGoal,
    lastSleep,
    todayWater,
    lastWeight,
    prevWeight,
    historyWorkouts,
  ] = await Promise.all([
    prisma.workout.findMany({
      // Bornée des deux côtés : une séance datée dans le futur ne compte pas.
      where: { date: { gte: weekStart, lt: weekEnd } },
      include: { sets: { include: { exercise: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.workout.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { sets: true },
    }),
    prisma.foodEntry.aggregate({
      where: { date: { gte: dayStart, lt: dayEnd } },
      _sum: { calories: true, proteinG: true },
    }),
    prisma.nutritionGoal.findUnique({ where: { id: "default" } }),
    prisma.sleepEntry.findFirst({ orderBy: { date: "desc" } }),
    prisma.waterEntry.aggregate({
      where: { date: { gte: dayStart, lt: dayEnd } },
      _sum: { amountMl: true },
    }),
    prisma.bodyWeightEntry.findFirst({ orderBy: { date: "desc" } }),
    prisma.bodyWeightEntry.findFirst({
      where: { date: { lte: sevenDaysAgo } },
      orderBy: { date: "desc" },
    }),
    prisma.workout.findMany({
      where: {
        date: { gte: historyStart, lt: weekEnd },
        dayType: { not: "recuperation" },
      },
      select: { date: true },
    }),
  ]);

  const kcalToday = Math.round(todayFood._sum.calories ?? 0);
  const proteinToday = Math.round(todayFood._sum.proteinG ?? 0);
  const kcalGoal = nutritionGoal?.calories ?? 2500;
  const proteinGoal = nutritionGoal?.proteinG ?? 140;
  const waterTotalMl = todayWater._sum.amountMl ?? 0;

  // Volume hebdomadaire : séries de travail par groupe (échauffements exclus).
  const setsByGroup = new Map<string, number>();
  for (const w of weekWorkouts) {
    for (const s of w.sets) {
      if (s.isWarmup) continue;
      setsByGroup.set(s.exercise.muscleGroup, (setsByGroup.get(s.exercise.muscleGroup) ?? 0) + 1);
    }
  }

  // Planning : une case n'est « faite » que si une séance existe à cette date précise.
  const daysWithWorkout = new Set(weekWorkouts.map((w) => new Date(w.date).getDay()));
  const todayWorkout = weekWorkouts.find(
    (w) => new Date(w.date).toDateString() === now.toDateString() && w.dayType === today.dayType
  );

  // Adhérence : nombre de jours entraînés (hors récupération) par semaine,
  // index 0 = semaine courante, sur les ~12 dernières semaines.
  const weekCounts: number[] = new Array(ADHERENCE_WEEKS).fill(0);
  const countedDays = new Set<string>();
  for (const w of historyWorkouts) {
    const d = new Date(w.date);
    const key = d.toDateString();
    if (countedDays.has(key)) continue; // plusieurs séances le même jour = 1
    countedDays.add(key);
    const diff = dayDiff(d, weekStart); // 0..6 semaine courante, négatif avant
    const weekIdx = Math.max(0, Math.ceil(-diff / 7));
    if (weekIdx < ADHERENCE_WEEKS) weekCounts[weekIdx] += 1;
  }
  const thisWeekCount = weekCounts[0];
  let streak = 0;
  for (let i = weekCounts[0] >= 5 ? 0 : 1; i < weekCounts.length; i++) {
    if (weekCounts[i] >= 5) streak += 1;
    else break;
  }
  const stripWeeks = weekCounts.slice(0, STRIP_WEEKS).reverse(); // gauche = plus ancien

  const weightDelta =
    lastWeight && prevWeight && prevWeight.id !== lastWeight.id
      ? lastWeight.weightKg - prevWeight.weightKg
      : null;

  return (
    <div className="space-y-6">
      {/* Aujourd'hui + phase */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-5 sm:p-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Aujourd&apos;hui — {DAY_NAMES[now.getDay()]}
          </p>
          <h2 className="text-xl font-bold mt-1" style={{ color: "var(--fit-ink)" }}>
            {today.icon} {today.title}
          </h2>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--fit-ink-2)" }}>
            {today.subtitle}
            {today.isResistance && ` · Phase ${phaseInfo.label.toLowerCase()}`}
          </p>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
            {today.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            {todayWorkout ? (
              <Link
                href={`/fitness/seance/${todayWorkout.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium"
                style={{
                  background: "var(--fit-accent-soft)",
                  color: "var(--fit-accent-strong)",
                  border: "1px solid var(--fit-accent-border)",
                }}
              >
                ✓ Séance du jour enregistrée →
              </Link>
            ) : (
              <NewWorkoutButton
                dayType={today.dayType}
                label={`Démarrer : ${today.title}`}
                primary
              />
            )}
            <Link
              href="/fitness/calendrier"
              className="inline-flex items-center min-h-[44px] text-sm font-medium"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              Voir le programme du jour →
            </Link>
          </div>
        </div>

        <div className="glass p-5 sm:p-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Phase du mois
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl font-bold" style={{ color: "var(--fit-ink)" }}>
              {phaseInfo.label}
            </h2>
            {phaseOverride && (
              <span className="pill-accent px-3 py-1 text-xs font-semibold">manuel</span>
            )}
          </div>
          <ul className="text-sm mt-3 space-y-1.5" style={{ color: "var(--fit-ink-2)" }}>
            <li>· {phaseInfo.reps}</li>
            <li>· {phaseInfo.sets}</li>
            <li>· {phaseInfo.rest}</li>
          </ul>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--fit-ink-3)" }}>
            {phaseInfo.description}
          </p>
          <PhaseSelector override={phaseOverride} />
        </div>
      </div>

      {/* Nutrition + sommeil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/fitness/nutrition" className="glass p-5 sm:p-6 block">
          <div className="flex items-baseline justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              🍽️ Nutrition du jour
            </p>
            <span className="text-sm" style={{ color: "var(--fit-accent-strong)" }}>
              →
            </span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: "var(--fit-ink)" }}>
            {kcalToday.toLocaleString("fr-FR")}{" "}
            <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
              / {kcalGoal.toLocaleString("fr-FR")} kcal
            </span>
          </p>
          <div
            className="mt-3 h-2 rounded-full overflow-hidden"
            style={{ background: "var(--fit-track)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (kcalToday / kcalGoal) * 100)}%`,
                background:
                  kcalToday > kcalGoal * 1.05 ? "var(--fit-danger)" : "var(--fit-accent)",
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--fit-ink-3)" }}>
            Protéines : {proteinToday} / {proteinGoal} g
          </p>
        </Link>

        <Link href="/fitness/sommeil" className="glass p-5 sm:p-6 block">
          <div className="flex items-baseline justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              🌙 Sommeil
            </p>
            <span className="text-sm" style={{ color: "var(--fit-accent-strong)" }}>
              →
            </span>
          </div>
          {lastSleep ? (
            <>
              <p className="text-2xl font-bold mt-2" style={{ color: "var(--fit-ink)" }}>
                {Math.floor(lastSleep.durationMin / 60)}h
                {String(lastSleep.durationMin % 60).padStart(2, "0")}{" "}
                <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
                  / 8h visées
                </span>
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--fit-ink-3)" }}>
                Nuit du{" "}
                {new Date(lastSleep.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {lastSleep.source === "apple-sante" && " · Apple Santé"}
              </p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: "var(--fit-ink-3)" }}>
              Aucune nuit enregistrée — saisissez votre sommeil ou branchez le Raccourci Apple
              Santé.
            </p>
          )}
        </Link>
      </div>

      {/* Hydratation + poids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass p-5 sm:p-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            💧 Hydratation
          </p>
          <WaterQuickAdd initialTotalMl={waterTotalMl} goalMl={waterGoalMl} />
        </div>

        <div className="glass p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              ⚖️ Poids
            </p>
            <Link
              href="/fitness/progression"
              className="text-sm font-medium"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              Progression →
            </Link>
          </div>
          {lastWeight ? (
            <>
              <p className="text-2xl font-bold mt-2" style={{ color: "var(--fit-ink)" }}>
                {lastWeight.weightKg.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}{" "}
                <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
                  kg
                  {weightDelta !== null &&
                    ` · ${weightDelta > 0 ? "+" : ""}${weightDelta.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    })} kg vs il y a 7 j`}
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--fit-ink-3)" }}>
                Pesée du{" "}
                {new Date(lastWeight.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: "var(--fit-ink-3)" }}>
              Aucune pesée enregistrée — commencez aujourd&apos;hui.
            </p>
          )}
          <WeightQuickAdd />
        </div>
      </div>

      {/* Planning hebdomadaire */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Planning de la semaine
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {WEEKLY_PROTOCOL.map((day, i) => {
            const isToday = i === now.getDay();
            const done = daysWithWorkout.has(i);
            return (
              <div
                key={day.dayType}
                className="glass-inset p-3 text-center"
                style={
                  isToday
                    ? {
                        background: "var(--fit-accent-soft)",
                        border: "1px solid var(--fit-accent-border)",
                      }
                    : undefined
                }
              >
                <p
                  className="text-[11px] font-semibold uppercase"
                  style={{ color: "var(--fit-ink-3)" }}
                >
                  {DAY_NAMES[i].slice(0, 3)}
                </p>
                <p className="text-2xl my-1">{day.icon}</p>
                <p className="text-xs font-medium leading-tight" style={{ color: "var(--fit-ink)" }}>
                  {DAY_TYPE_LABELS[day.dayType]}
                </p>
                {done && (
                  <p
                    className="text-xs mt-1 font-semibold"
                    style={{ color: "var(--fit-accent-strong)" }}
                  >
                    ✓ fait
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Régularité */}
      <div className="glass p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
            Régularité
          </h2>
          <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
            8 dernières semaines
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-inset px-4 py-3">
            <p className="text-2xl font-bold" style={{ color: "var(--fit-ink)" }}>
              {thisWeekCount}
              <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
                {" "}
                / {PLANNED_SESSIONS_PER_WEEK}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
              séances cette semaine
            </p>
          </div>
          <div className="glass-inset px-4 py-3">
            <p className="text-2xl font-bold" style={{ color: "var(--fit-ink)" }}>
              {streak}
              <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
                {" "}
                sem.
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
              d&apos;affilée à ≥ 5 séances
            </p>
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          {stripWeeks.map((count, i) => (
            <div
              key={i}
              className="flex-1 h-8 rounded-lg"
              title={`${count} séance${count > 1 ? "s" : ""}`}
              style={
                count === 0
                  ? { background: "var(--fit-track)" }
                  : {
                      background: "var(--fit-accent)",
                      opacity: 0.25 + (0.75 * Math.min(count, PLANNED_SESSIONS_PER_WEEK)) / PLANNED_SESSIONS_PER_WEEK,
                    }
              }
            />
          ))}
        </div>
        <div
          className="flex justify-between mt-1.5 text-[10px]"
          style={{ color: "var(--fit-ink-3)" }}
        >
          <span>il y a {STRIP_WEEKS} sem.</span>
          <span>cette semaine</span>
        </div>
      </div>

      {/* Volume hebdomadaire */}
      <div className="glass p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
            Volume de la semaine
          </h2>
          <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
            Objectif : ~{WEEKLY_SETS_TARGET} séries de travail par groupe musculaire
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {MUSCLE_GROUPS.map((group) => {
            const count = setsByGroup.get(group) ?? 0;
            const pct = Math.min(100, (count / WEEKLY_SETS_TARGET) * 100);
            return (
              <div key={group} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0" style={{ color: "var(--fit-ink-2)" }}>
                  {MUSCLE_GROUP_LABELS[group]}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--fit-track)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background:
                        count >= WEEKLY_SETS_TARGET
                          ? "var(--fit-accent-strong)"
                          : "var(--fit-accent)",
                    }}
                  />
                </div>
                <span
                  className="text-xs w-12 text-right tabular-nums"
                  style={{ color: "var(--fit-ink-3)" }}
                >
                  {count}/{WEEKLY_SETS_TARGET}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dernières séances */}
      <div className="glass p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
            Dernières séances
          </h2>
          <Link
            href="/fitness/seances"
            className="text-sm font-medium"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Tout l&apos;historique →
          </Link>
        </div>
        {recentWorkouts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fit-ink-3)" }}>
            Aucune séance enregistrée pour l&apos;instant. Démarrez la séance du jour ci-dessus.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentWorkouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/fitness/seance/${w.id}`}
                  className="glass-inset px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--fit-ink)" }}>
                      {DAY_TYPE_LABELS[w.dayType as DayType] ?? w.dayType}
                      {w.phase && (
                        <span className="ml-2 text-xs" style={{ color: "var(--fit-accent-strong)" }}>
                          {PHASE_INFO[w.phase as Phase]?.label}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
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
                  <span className="text-sm" style={{ color: "var(--fit-accent-strong)" }}>
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
