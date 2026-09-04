"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayType } from "../lib/fitness";

export function NewWorkoutButton({
  dayType,
  label,
  primary = false,
}: {
  dayType: DayType;
  label: string;
  primary?: boolean;
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
        body: JSON.stringify({ dayType }),
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
        className="px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50"
        style={
          primary
            ? { background: "#bf4800", color: "#ffffff" }
            : { background: "rgba(191,72,0,0.08)", color: "#bf4800" }
        }
      >
        {loading ? "Création…" : label}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}
    </div>
  );
}
