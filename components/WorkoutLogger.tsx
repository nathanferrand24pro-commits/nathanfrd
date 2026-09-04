"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUP_LABELS, MuscleGroup, Phase } from "../lib/fitness";

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
  isWarmup: boolean;
}

// Résumé de la dernière séance où un exercice a été travaillé.
export interface LastExerciseInfo {
  summary: string; // ex. "3 × 8 @ 60 kg (12/08)"
  lastWeightKg: number;
}

const REST_PRESETS = [90, 120, 180, 240] as const;

// Repos par défaut selon la phase du mois (force = repos longs).
function defaultRestFor(phase: Phase | null): number {
  if (phase === "force") return 180;
  if (phase === "hypertrophie") return 90;
  return 120;
}

function formatClock(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function WorkoutLogger({
  workoutId,
  exercises,
  initialSets,
  suggestedGroups,
  phase,
  lastByExercise,
}: {
  workoutId: string;
  exercises: ExerciseOption[];
  initialSets: LoggedSet[];
  suggestedGroups: string[];
  phase: Phase | null;
  lastByExercise: Record<string, LastExerciseInfo>;
}) {
  const router = useRouter();
  const [sets, setSets] = useState<LoggedSet[]>(initialSets);

  // Exercices des groupes du jour en premier dans le sélecteur.
  const sortedExercises = useMemo(() => {
    const rank = (e: ExerciseOption) => (suggestedGroups.includes(e.muscleGroup) ? 0 : 1);
    return [...exercises].sort(
      (a, b) => rank(a) - rank(b) || a.muscleGroup.localeCompare(b.muscleGroup) || a.name.localeCompare(b.name)
    );
  }, [exercises, suggestedGroups]);

  const [exerciseId, setExerciseId] = useState(sortedExercises[0]?.id ?? "");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState(() => {
    const info = lastByExercise[sortedExercises[0]?.id ?? ""];
    return info && info.lastWeightKg > 0 ? String(info.lastWeightKg) : "";
  });
  const [isWarmup, setIsWarmup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Minuteur de repos (état client uniquement, pas de son) ---
  const [restDuration, setRestDuration] = useState(() => defaultRestFor(phase));
  const [remaining, setRemaining] = useState<number | null>(null); // null = jamais démarré
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining === null) return;
    if (remaining <= 0) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  function startRest() {
    setRemaining(restDuration);
    setRunning(true);
  }

  function addThirtySeconds() {
    setRemaining((r) => (r ?? 0) + 30);
    setRunning(true);
  }

  const lastInfo = lastByExercise[exerciseId];

  function onSelectExercise(id: string) {
    setExerciseId(id);
    // Pré-remplit la charge avec la dernière charge utilisée sur cet exercice.
    const info = lastByExercise[id];
    setWeight(info && info.lastWeightKg > 0 ? String(info.lastWeightKg) : "");
  }

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
          isWarmup,
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
          isWarmup: data.isWarmup === true,
        },
      ]);
      // Réinitialise le formulaire (la charge reste, utile pour la série suivante).
      setReps("");
      setIsWarmup(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      startRest();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function removeSet(s: LoggedSet) {
    if (!confirm(`Supprimer la série ${s.setNumber} de ${s.exerciseName} ?`)) return;
    const res = await fetch(`/api/fitness/sets/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      setSets((prev) => prev.filter((x) => x.id !== s.id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Minuteur de repos */}
      {remaining !== null && (
        <div className="glass-inset px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--fit-ink-3)" }}
              >
                Repos
              </p>
              {remaining > 0 ? (
                <p
                  className="text-4xl font-bold tabular-nums leading-tight"
                  style={{ color: running ? "var(--fit-ink)" : "var(--fit-ink-3)" }}
                >
                  {formatClock(remaining)}
                </p>
              ) : (
                <p
                  className="text-lg font-bold animate-pulse leading-tight"
                  style={{ color: "var(--fit-accent-strong)" }}
                >
                  Repos terminé — série suivante !
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="btn-glass px-4 py-2.5 text-sm font-medium min-h-[44px]"
                >
                  {running ? "Pause" : "Reprendre"}
                </button>
              )}
              <button
                type="button"
                onClick={addThirtySeconds}
                className="btn-glass px-4 py-2.5 text-sm font-medium min-h-[44px]"
              >
                +30 s
              </button>
              <button
                type="button"
                onClick={startRest}
                className="btn-glass px-4 py-2.5 text-sm font-medium min-h-[44px]"
              >
                Réinitialiser
              </button>
              <label className="flex items-center gap-2">
                <span className="sr-only">Durée de repos par défaut</span>
                <select
                  value={restDuration}
                  onChange={(e) => setRestDuration(Number(e.target.value))}
                  className="fit-input px-3 py-2.5 text-base"
                  aria-label="Durée de repos par défaut"
                >
                  {REST_PRESETS.map((s) => (
                    <option key={s} value={s}>
                      {formatClock(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout de série — empilé pour rester confortable au pouce */}
      <form onSubmit={addSet} className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Exercice
          </span>
          <select
            value={exerciseId}
            onChange={(e) => onSelectExercise(e.target.value)}
            className="fit-input px-3 py-2.5 text-base w-full"
            required
          >
            {sortedExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} — {MUSCLE_GROUP_LABELS[ex.muscleGroup as MuscleGroup] ?? ex.muscleGroup}
              </option>
            ))}
          </select>
        </label>

        {/* La dernière fois que cet exercice a été travaillé */}
        {lastInfo && (
          <p className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            <span style={{ color: "var(--fit-accent-strong)" }}>La dernière fois :</span>{" "}
            <span className="tabular-nums">{lastInfo.summary}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
              Répétitions
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="fit-input px-3 py-2.5 text-base w-full"
              placeholder="8"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
              Charge (kg)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="fit-input px-3 py-2.5 text-base w-full"
              placeholder="60"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
            className="w-5 h-5 rounded"
            style={{ accentColor: "var(--fit-accent)" }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Échauffement (exclu du volume)
          </span>
        </label>

        <button
          type="submit"
          disabled={saving || !exerciseId}
          className="btn-accent px-5 py-2.5 text-sm font-medium min-h-[44px] w-full sm:w-auto"
        >
          {saving ? "Ajout…" : added ? "Ajouté ✓" : "+ Ajouter la série"}
        </button>
      </form>
      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}

      {/* Séries enregistrées */}
      {sets.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
          Aucune série pour l&apos;instant. Ajoutez votre première série ci-dessus.
        </p>
      ) : (
        <div className="space-y-4">
          {[...groupedSets.entries()].map(([name, exerciseSets]) => (
            <div key={name}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--fit-ink)" }}>
                {name}
              </h3>
              <ul className="space-y-1.5">
                {exerciseSets.map((s) => (
                  <li
                    key={s.id}
                    className="glass-inset px-3 py-2 flex items-center justify-between gap-2 text-sm"
                    style={{ opacity: s.isWarmup ? 0.55 : 1 }}
                  >
                    <span style={{ color: "var(--fit-ink-2)" }}>
                      Série {s.setNumber} — {s.reps} rép.
                      {s.weightKg > 0
                        ? ` × ${s.weightKg.toLocaleString("fr-FR")} kg`
                        : " (poids du corps)"}
                      {s.isWarmup && (
                        <span className="italic" style={{ color: "var(--fit-ink-3)" }}>
                          {" "}
                          · échauffement
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => removeSet(s)}
                      className="text-xs font-medium min-h-[44px] py-2.5 px-3 shrink-0"
                      style={{ color: "var(--fit-danger)" }}
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
