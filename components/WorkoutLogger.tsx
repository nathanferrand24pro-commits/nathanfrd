"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUP_LABELS, MuscleGroup } from "../lib/fitness";

export interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface LoggedSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
}

export function WorkoutLogger({
  workoutId,
  exercises,
  initialSets,
  suggestedGroups,
}: {
  workoutId: string;
  exercises: ExerciseOption[];
  initialSets: LoggedSet[];
  suggestedGroups: string[];
}) {
  const router = useRouter();
  const [sets, setSets] = useState<LoggedSet[]>(initialSets);
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exercices des groupes du jour en premier dans le sélecteur.
  const sortedExercises = useMemo(() => {
    const rank = (e: ExerciseOption) => (suggestedGroups.includes(e.muscleGroup) ? 0 : 1);
    return [...exercises].sort(
      (a, b) => rank(a) - rank(b) || a.muscleGroup.localeCompare(b.muscleGroup) || a.name.localeCompare(b.name)
    );
  }, [exercises, suggestedGroups]);

  const groupedSets = useMemo(() => {
    const byExercise = new Map<string, LoggedSet[]>();
    for (const s of sets) {
      const list = byExercise.get(s.exerciseName) ?? [];
      list.push(s);
      byExercise.set(s.exerciseName, list);
    }
    return byExercise;
  }, [sets]);

  async function addSet(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          exerciseId,
          reps: Number(reps),
          weightKg: weight === "" ? 0 : Number(weight.replace(",", ".")),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Erreur lors de l'enregistrement");
      setSets((prev) => [
        ...prev,
        {
          id: data.id,
          exerciseId: data.exerciseId,
          exerciseName: data.exercise.name,
          setNumber: data.setNumber,
          reps: data.reps,
          weightKg: data.weightKg,
        },
      ]);
      setReps("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function removeSet(id: string) {
    const res = await fetch(`/api/fitness/sets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSets((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#f5f5f7",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#1d1d1f",
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout de série */}
      <form onSubmit={addSet} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 flex-1 min-w-48">
          <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
            Exercice
          </span>
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
            required
          >
            {sortedExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} — {MUSCLE_GROUP_LABELS[ex.muscleGroup as MuscleGroup] ?? ex.muscleGroup}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 w-24">
          <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
            Répétitions
          </span>
          <input
            type="number"
            min={1}
            max={200}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="8"
            required
          />
        </label>
        <label className="flex flex-col gap-1 w-28">
          <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
            Charge (kg)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
            placeholder="60"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !exerciseId}
          className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
          style={{ background: "#bf4800", color: "#ffffff" }}
        >
          {saving ? "Ajout…" : "+ Ajouter la série"}
        </button>
      </form>
      {error && (
        <p className="text-xs" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}

      {/* Séries enregistrées */}
      {sets.length === 0 ? (
        <p className="text-sm" style={{ color: "#6e6e73" }}>
          Aucune série pour l&apos;instant. Ajoutez votre première série ci-dessus.
        </p>
      ) : (
        <div className="space-y-4">
          {[...groupedSets.entries()].map(([name, exerciseSets]) => (
            <div key={name}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "#1d1d1f" }}>
                {name}
              </h3>
              <ul className="space-y-1.5">
                {exerciseSets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#f5f5f7" }}
                  >
                    <span style={{ color: "#424245" }}>
                      Série {s.setNumber} — {s.reps} rép.
                      {s.weightKg > 0 ? ` × ${s.weightKg} kg` : " (poids du corps)"}
                    </span>
                    <button
                      onClick={() => removeSet(s.id)}
                      className="text-xs font-medium"
                      style={{ color: "#d70015" }}
                      aria-label={`Supprimer la série ${s.setNumber} de ${name}`}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
