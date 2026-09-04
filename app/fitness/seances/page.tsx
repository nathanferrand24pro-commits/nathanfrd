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

  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  };

  return (
    <div className="space-y-6">
      {/* Démarrer une séance d'un autre type */}
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-1" style={{ color: "#1d1d1f" }}>
          Nouvelle séance
        </h2>
        <p className="text-xs mb-4" style={{ color: "#6e6e73" }}>
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
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          Historique ({workouts.length})
        </h2>
        {workouts.length === 0 ? (
          <p className="text-sm" style={{ color: "#6e6e73" }}>
            Aucune séance enregistrée.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {workouts.map((w) => {
              const volume = w.sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
              return (
                <li key={w.id}>
                  <Link
                    href={`/fitness/seance/${w.id}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#1d1d1f" }}>
                        {DAY_TYPE_LABELS[w.dayType as DayType] ?? w.dayType}
                        {w.phase && (
                          <span className="ml-2 text-xs" style={{ color: "#bf4800" }}>
                            {PHASE_INFO[w.phase as Phase]?.label}
                          </span>
                        )}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6e6e73" }}>
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
                    <span className="text-sm" style={{ color: "#bf4800" }}>
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
