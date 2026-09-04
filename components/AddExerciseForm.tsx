"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "../lib/fitness";

export function AddExerciseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, muscleGroup }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Erreur lors de l'ajout");
      setName("");
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
          Nom de l&apos;exercice
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="fit-input px-3 py-2.5 text-base"
          placeholder="Hip thrust"
          required
        />
      </label>
      <label className="flex flex-col gap-1 sm:w-48">
        <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
          Groupe musculaire
        </span>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="fit-input px-3 py-2.5 text-base"
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {MUSCLE_GROUP_LABELS[g]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="btn-accent px-5 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50"
      >
        {saving ? "Ajout…" : added ? "Ajouté ✓" : "+ Ajouter"}
      </button>
      {error && (
        <p className="text-xs w-full" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
