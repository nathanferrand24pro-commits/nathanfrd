"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayType } from "../lib/fitness";

export function NewWorkoutButton({
  dayType,
  label,
  primary = false,
  date,
}: {
  dayType: DayType;
  label: string;
  primary?: boolean;
  date?: string; // YYYY-MM-DD — par défaut aujourd'hui
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(date ? { dayType, date } : { dayType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de la création de la séance");
      }
      const workout = await res.json();
      router.push(`/fitness/seance/${workout.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={loading}
        className={
          primary
            ? "btn-accent px-5 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50"
            : "btn-glass px-4 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50"
        }
      >
        {loading ? "Création…" : label}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
