"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Saisie rapide de la pesée du jour (une pesée par jour, la nouvelle remplace).
export function WeightQuickAdd() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const weightKg = Number(value.replace(",", "."));
    if (!value.trim() || isNaN(weightKg)) {
      setError("Poids invalide");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/body-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de l'enregistrement");
      }
      setValue("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pesée du jour (kg)"
          aria-label="Poids du jour en kilogrammes"
          className="fit-input px-3 py-2.5 text-base flex-1 min-w-0"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-accent px-5 py-2.5 text-sm font-medium min-h-[44px] whitespace-nowrap"
        >
          {saved ? "Ajouté ✓" : saving ? "…" : "OK"}
        </button>
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
