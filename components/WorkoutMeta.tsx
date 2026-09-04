"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Édition durée + notes, et suppression de la séance.
export function WorkoutMeta({
  workoutId,
  initialDurationMin,
  initialNotes,
}: {
  workoutId: string;
  initialDurationMin: number | null;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState(initialDurationMin?.toString() ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/fitness/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationMin: duration === "" ? null : Number(duration),
        notes,
      }),
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

  const inputStyle: React.CSSProperties = {
    background: "#f5f5f7",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#1d1d1f",
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 w-32">
          <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
            Durée (min)
          </span>
          <input
            type="number"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="60"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-56">
          <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
            Notes (ressenti, sommeil, échauffement…)
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="Bonne énergie, +2,5 kg au squat"
          />
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          style={{ background: "rgba(191,72,0,0.08)", color: "#bf4800" }}
        >
          {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
        </button>
      </div>
      <button onClick={remove} className="text-xs font-medium" style={{ color: "#d70015" }}>
        Supprimer la séance
      </button>
    </div>
  );
}
