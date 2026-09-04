"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Tuile hydratation : total du jour vs objectif + ajouts rapides une main.
export function WaterQuickAdd({
  initialTotalMl,
  goalMl,
}: {
  initialTotalMl: number;
  goalMl: number;
}) {
  const router = useRouter();
  const [totalMl, setTotalMl] = useState(initialTotalMl);
  const [pending, setPending] = useState<number | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(amountMl: number) {
    if (pending !== null) return;
    setPending(amountMl);
    setError(null);
    try {
      const res = await fetch("/api/fitness/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de l'ajout");
      }
      // Resynchronise le total du jour depuis l'API (source de vérité).
      try {
        const sync = await fetch("/api/fitness/water");
        if (sync.ok) {
          const data: { totalMl?: number } = await sync.json();
          if (typeof data.totalMl === "number") setTotalMl(data.totalMl);
          else setTotalMl((t) => t + amountMl);
        } else {
          setTotalMl((t) => t + amountMl);
        }
      } catch {
        setTotalMl((t) => t + amountMl);
      }
      setAdded(amountMl);
      setTimeout(() => setAdded(null), 1500);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setPending(null);
    }
  }

  const pct = goalMl > 0 ? Math.min(100, (totalMl / goalMl) * 100) : 0;
  const reached = totalMl >= goalMl;

  return (
    <div>
      <p className="text-2xl font-bold mt-2" style={{ color: "var(--fit-ink)" }}>
        {(totalMl / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}{" "}
        <span className="text-sm font-medium" style={{ color: "var(--fit-ink-2)" }}>
          / {(goalMl / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} L
        </span>
      </p>
      <div
        className="mt-3 h-2 rounded-full overflow-hidden"
        style={{ background: "var(--fit-track)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: reached ? "var(--fit-accent-strong)" : "var(--fit-accent)",
          }}
        />
      </div>
      <div className="mt-4 flex gap-2">
        {[250, 500].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => add(amount)}
            disabled={pending !== null}
            className="btn-glass flex-1 px-4 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50"
          >
            {added === amount ? "Ajouté ✓" : pending === amount ? "…" : `+${amount} ml`}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
