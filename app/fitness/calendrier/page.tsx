import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "../../../lib/db";
import {
  WEEKLY_PROTOCOL,
  DAILY_PROGRAM,
  PHASE_INFO,
  currentPhase,
  DayType,
} from "../../../lib/fitness";
import { toDayParam } from "../../../lib/nutrition";
import { NewWorkoutButton } from "../../../components/NewWorkoutButton";

export const metadata: Metadata = { title: "Calendrier — Fitness Huberman" };
export const dynamic = "force-dynamic";

const DAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function parseMonth(value: string | undefined, fallback: Date): { y: number; m: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m >= 1 && m <= 12) return { y, m: m - 1 };
  }
  return { y: fallback.getFullYear(), m: fallback.getMonth() };
}

function monthParam(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; jour?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const { y, m } = parseMonth(params.mois, today);

  // Jour sélectionné : ?jour=YYYY-MM-DD, sinon aujourd'hui si dans le mois affiché, sinon le 1er.
  let selected: Date;
  if (params.jour && /^\d{4}-\d{2}-\d{2}$/.test(params.jour)) {
    selected = new Date(`${params.jour}T00:00:00`);
  } else if (today.getFullYear() === y && today.getMonth() === m) {
    selected = new Date(y, m, today.getDate());
  } else {
    selected = new Date(y, m, 1);
  }
  if (isNaN(selected.getTime())) selected = new Date(y, m, 1);

  const monthStart = new Date(y, m, 1);
  const monthEnd = new Date(y, m + 1, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // Séances enregistrées du mois, indexées par jour.
  const workouts = await prisma.workout.findMany({
    where: { date: { gte: monthStart, lt: monthEnd } },
    orderBy: { date: "asc" },
    select: { id: true, date: true, dayType: true },
  });
  const workoutsByDay = new Map<number, { id: string; dayType: string }[]>();
  for (const w of workouts) {
    const d = new Date(w.date).getDate();
    const list = workoutsByDay.get(d) ?? [];
    list.push({ id: w.id, dayType: w.dayType });
    workoutsByDay.set(d, list);
  }

  // Grille : semaines commençant le dimanche (comme le protocole).
  const leadingBlanks = monthStart.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prevM = m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
  const nextM = m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };

  // Détail du jour sélectionné.
  const selDay = WEEKLY_PROTOCOL[selected.getDay()];
  const selProgram = DAILY_PROGRAM[selDay.dayType];
  const selPhase = currentPhase(selected);
  const selPhaseInfo = PHASE_INFO[selPhase];
  const selParam = toDayParam(selected);
  const selWorkouts =
    selected.getMonth() === m && selected.getFullYear() === y
      ? (workoutsByDay.get(selected.getDate()) ?? [])
      : [];
  const isToday = selected.toDateString() === today.toDateString();
  const monthPhase = currentPhase(monthStart);

  return (
    <div className="space-y-6">
      {/* Grille du mois */}
      <div className="glass p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/fitness/calendrier?mois=${monthParam(prevM.y, prevM.m)}`}
            className="btn-glass w-10 h-10 flex items-center justify-center text-lg"
            aria-label="Mois précédent"
          >
            ‹
          </Link>
          <div className="text-center">
            <h2 className="text-base font-bold capitalize" style={{ color: "var(--fit-ink)" }}>
              {monthLabel}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-2)" }}>
              Phase {PHASE_INFO[monthPhase].label.toLowerCase()} · {PHASE_INFO[monthPhase].reps}
            </p>
          </div>
          <Link
            href={`/fitness/calendrier?mois=${monthParam(nextM.y, nextM.m)}`}
            className="btn-glass w-10 h-10 flex items-center justify-center text-lg"
            aria-label="Mois suivant"
          >
            ›
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {DAY_INITIALS.map((d, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold py-1"
              style={{ color: "var(--fit-ink-3)" }}
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const date = new Date(y, m, day);
            const dayType = WEEKLY_PROTOCOL[date.getDay()].dayType;
            const done = (workoutsByDay.get(day) ?? []).length > 0;
            const isSel =
              selected.getDate() === day && selected.getMonth() === m && selected.getFullYear() === y;
            const isTodayCell = date.toDateString() === today.toDateString();
            const isResistance = ["jambes", "torse", "bras"].includes(dayType);
            const isRest = dayType === "recuperation";
            return (
              <Link
                key={day}
                href={`/fitness/calendrier?mois=${monthParam(y, m)}&jour=${toDayParam(date)}`}
                className="flex flex-col items-center gap-1 py-1.5 rounded-xl"
                style={{
                  background: isSel ? "var(--fit-accent-soft)" : "transparent",
                  border: isSel
                    ? "1px solid var(--fit-accent-border)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm tabular-nums ${
                    isTodayCell ? "font-bold text-white" : "font-medium"
                  }`}
                  style={{
                    background: isTodayCell ? "var(--fit-accent)" : "transparent",
                    color: isTodayCell ? "#ffffff" : "var(--fit-ink)",
                  }}
                >
                  {day}
                </span>
                {done ? (
                  <span
                    className="text-[10px] font-bold leading-none"
                    style={{ color: "var(--fit-accent-strong)" }}
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full leading-none"
                    style={{
                      background: isResistance
                        ? "var(--fit-accent)"
                        : isRest
                          ? "transparent"
                          : "transparent",
                      border: isResistance
                        ? "none"
                        : isRest
                          ? "1px solid var(--fit-ink-3)"
                          : "1.5px solid var(--fit-accent)",
                      opacity: isRest ? 0.5 : 0.85,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Légende */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 text-[11px]"
          style={{ color: "var(--fit-ink-2)", borderTop: "1px solid rgba(255,255,255,0.6)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--fit-accent)" }} />
            Musculation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ border: "1.5px solid var(--fit-accent)" }}
            />
            Cardio
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ border: "1px solid var(--fit-ink-3)", opacity: 0.5 }}
            />
            Récupération
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-bold" style={{ color: "var(--fit-accent-strong)" }}>
              ✓
            </span>
            Séance enregistrée
          </span>
        </div>
      </div>

      {/* Détail du jour sélectionné */}
      <div className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              {isToday ? "Aujourd'hui — " : ""}
              {DAY_NAMES[selected.getDay()]}{" "}
              {selected.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </p>
            <h2 className="text-xl font-bold mt-1" style={{ color: "var(--fit-ink)" }}>
              {selDay.title}
            </h2>
            <p className="text-sm font-medium mt-0.5" style={{ color: "var(--fit-ink-2)" }}>
              {selDay.subtitle}
              {selProgram.exercices.length > 0 &&
                ` · Phase ${selPhaseInfo.label.toLowerCase()}`}
            </p>
          </div>
          {selProgram.exercices.length > 0 && (
            <span className="pill-accent px-3 py-1 text-xs font-semibold">
              {selPhaseInfo.reps} · {selPhaseInfo.rest}
            </span>
          )}
        </div>

        {/* Échauffement */}
        {selProgram.echauffement && (
          <div className="glass-inset px-4 py-3 mt-4">
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--fit-accent-strong)" }}>
              Échauffement
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
              {selProgram.echauffement}
            </p>
          </div>
        )}

        {/* Exercices de la séance ou contenu cardio */}
        {selProgram.exercices.length > 0 ? (
          <ol className="mt-4 space-y-2">
            {selProgram.exercices.map((ex, i) => (
              <li key={ex.nom} className="glass-inset px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold" style={{ color: "var(--fit-ink)" }}>
                    <span
                      className="inline-block w-5 text-xs font-bold"
                      style={{ color: "var(--fit-ink-3)" }}
                    >
                      {i + 1}.
                    </span>
                    {ex.nom}
                  </p>
                  <p
                    className="text-xs font-medium tabular-nums whitespace-nowrap"
                    style={{ color: "var(--fit-accent-strong)" }}
                  >
                    {selPhase === "force" ? ex.force : ex.hypertrophie}
                  </p>
                </div>
                {ex.note && (
                  <p className="text-xs mt-1 pl-5 leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
                    {ex.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <div className="glass-inset px-4 py-3 mt-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
              {selProgram.cardioDetail}
            </p>
          </div>
        )}

        {/* Action */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {selWorkouts.length > 0 ? (
            <Link
              href={`/fitness/seance/${selWorkouts[0].id}`}
              className="btn-glass px-4 py-2 text-sm font-medium"
            >
              ✓ Voir la séance enregistrée
            </Link>
          ) : selDay.dayType === "recuperation" ? null : (
            <NewWorkoutButton
              dayType={selDay.dayType as DayType}
              label={isToday ? `Démarrer : ${selDay.title}` : `Enregistrer cette séance`}
              primary={isToday}
              date={selParam}
            />
          )}
        </div>
      </div>
    </div>
  );
}
