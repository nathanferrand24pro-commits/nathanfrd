"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Jours à dominante cardio : champs distance / FC / RPE en plus.
const CARDIO_DAY_TYPES = ["cardio", "endurance", "hiit"];

// Édition durée + notes (+ métriques cardio selon le jour), et suppression de la séance.
export function WorkoutMeta({
  workoutId,
  dayType,
  initialDurationMin,
  initialNotes,
  initialDistanceKm,
  initialAvgHeartRate,
  initialRpe,
}: {
  workoutId: string;
  dayType: string;
  initialDurationMin: number | null;
  initialNotes: string | null;
  initialDistanceKm: number | null;
  initialAvgHeartRate: number | null;
  initialRpe: number | null;
}) {
  const router = useRouter();
  const isCardio = CARDIO_DAY_TYPES.includes(dayType);
  const [duration, setDuration] = useState(initialDurationMin?.toString() ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [distance, setDistance] = useState(initialDistanceKm?.toString() ?? "");
  const [heartRate, setHeartRate] = useState(initialAvgHeartRate?.toString() ?? "");
  const [rpe, setRpe] = useState(initialRpe?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const body: Record<string, unknown> = {
      durationMin: duration === "" ? null : Number(duration),
      notes,
    };
    if (isCardio) {
      const km = Number(distance.replace(",", "."));
      body.distanceKm = distance === "" || isNaN(km) ? null : km;
      body.avgHeartRate = heartRate === "" ? null : Number(heartRate);
      body.rpe = rpe === "" ? null : Number(rpe);
    }
    const res = await fetch(`/api/fitness/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function remove() {
    if (!confirm("Supprimer définitivement cette séance et toutes ses séries ?")) return;
    const res = await fetch(`/api/fitness/workouts/${workoutId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/fitness/seances");
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Durée (min)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="fit-input px-3 py-2.5 text-base w-full"
            placeholder="60"
          />
        </label>
        {isCardio && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
                Distance (km)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="fit-input px-3 py-2.5 text-base w-full"
                placeholder="8,5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
                FC moyenne (bpm)
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={40}
                max={240}
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="fit-input px-3 py-2.5 text-base w-full"
                placeholder="145"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
                RPE (effort 1–10)
              </span>
              <select
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="fit-input px-3 py-2.5 text-base w-full"
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
          Notes (ressenti, sommeil, échauffement…)
        </span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="fit-input px-3 py-2.5 text-base w-full"
          placeholder="Bonne énergie, +2,5 kg au squat"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="btn-accent px-5 py-2.5 text-sm font-medium min-h-[44px]"
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
        </button>
        <button
          onClick={remove}
          className="text-xs font-medium min-h-[44px] py-2.5 px-3"
          style={{ color: "var(--fit-danger)" }}
        >
          Supprimer la séance
        </button>
      </div>
    </div>
  );
}
