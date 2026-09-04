"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Phase } from "../lib/fitness";

const OPTIONS: { value: Phase | null; label: string }[] = [
  { value: null, label: "Auto" },
  { value: "force", label: "Force" },
  { value: "hypertrophie", label: "Hypertrophie" },
];

// Segmented control discret : force la phase du cycle ou revient à
// l'alternance automatique (parité du mois).
export function PhaseSelector({ override }: { override: Phase | null }) {
  const router = useRouter();
  const [current, setCurrent] = useState<Phase | null>(override);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function select(value: Phase | null) {
    if (value === current || saving) return;
    const previous = current;
    setCurrent(value);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseOverride: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de l'enregistrement");
      }
      router.refresh();
    } catch (e) {
      setCurrent(previous);
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--fit-ink-3)" }}>
        Cycle
      </p>
      <div className="glass-inset p-1 flex" role="group" aria-label="Choix de la phase du mois">
        {OPTIONS.map((o) => {
          const active = current === o.value;
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => select(o.value)}
              disabled={saving}
              aria-pressed={active}
              className="flex-1 min-w-0 px-1 py-2 min-h-[44px] rounded-full text-xs font-semibold transition-colors disabled:opacity-60"
              style={
                active
                  ? {
                      background: "var(--fit-accent-soft)",
                      color: "var(--fit-accent-strong)",
                      border: "1px solid var(--fit-accent-border)",
                    }
                  : { color: "var(--fit-ink-2)", border: "1px solid transparent" }
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
