import Link from "next/link";
import { prisma } from "../../../lib/db";
import {
  DAY_TYPE_LABELS,
  PHASE_INFO,
  WEEKLY_PROTOCOL,
  DayType,
  Phase,
} from "../../../lib/fitness";
import { NewWorkoutButton } from "../../../components/NewWorkoutButton";

export const dynamic = "force-dynamic";

export default async function WorkoutHistoryPage() {
  const workouts = await prisma.workout.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { sets: true },
  });

  return (
    <div className="space-y-6">
      {/* Démarrer une séance d'un autre type */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-1" style={{ color: "var(--fit-ink)" }}>
          Nouvelle séance
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--fit-ink-2)" }}>
          Le tableau de bord propose la séance du jour ; démarrez ici n&apos;importe quel type de
          séance du protocole.
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEKLY_PROTOCOL.filter((d) => d.dayType !== "recuperation").map((day) => (
            <NewWorkoutButton
              key={day.dayType}
              dayType={day.dayType}
              label={`${day.icon} ${DAY_TYPE_LABELS[day.dayType]}`}
            />
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Historique ({workouts.length})
        </h2>
        {workouts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
            Aucune séance enregistrée.
          </p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => {
              const volume = w.sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
              return (
                <li key={w.id}>
                  <Link
                    href={`/fitness/seance/${w.id}`}
                    className="glass-inset flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--fit-ink)" }}>
                        {DAY_TYPE_LABELS[w.dayType as DayType] ?? w.dayType}
                        {w.phase && (
                          <span
                            className="ml-2 text-xs"
                            style={{ color: "var(--fit-accent-strong)" }}
                          >
                            {PHASE_INFO[w.phase as Phase]?.label}
                          </span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-2)" }}>
                        {new Date(w.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {w.sets.length} série{w.sets.length > 1 ? "s" : ""}
                        {volume > 0 && ` · ${volume.toLocaleString("fr-FR")} kg de volume`}
                        {w.durationMin ? ` · ${w.durationMin} min` : ""}
                      </p>
                    </div>
                    <span className="text-sm" style={{ color: "var(--fit-accent-strong)" }}>
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Données */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-1" style={{ color: "var(--fit-ink)" }}>
          Données
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--fit-ink-2)" }}>
          Téléchargez une sauvegarde complète de vos séances, mesures et réglages.
        </p>
        <a
          href="/api/fitness/export"
          download
          className="btn-glass inline-flex items-center px-4 py-2.5 text-sm font-medium min-h-[44px]"
        >
          Exporter mes données (JSON)
        </a>
      </div>
    </div>
  );
}
