"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "../lib/fitness";

export function AddExerciseForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [saving, setSaving] = useState(false);
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#f5f5f7",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#1d1d1f",
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 flex-1 min-w-48">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Nom de l&apos;exercice
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
          placeholder="Hip thrust"
          required
        />
      </label>
      <label className="flex flex-col gap-1 w-44">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Groupe musculaire
        </span>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
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
        className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        style={{ background: "#bf4800", color: "#ffffff" }}
      >
        {saving ? "Ajout…" : "+ Ajouter"}
      </button>
      {error && (
        <p className="text-xs w-full" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}
    </form>
  );
}
