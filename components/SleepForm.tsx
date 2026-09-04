"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toDayParam } from "../lib/nutrition";

export function SleepForm() {
  const router = useRouter();
  const [date, setDate] = useState(toDayParam(new Date()));
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          bedTime,
          wakeTime,
          quality: quality ? Number(quality) : undefined,
          source: "manuel",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Erreur lors de l'enregistrement");
      // Les heures resservent d'une nuit à l'autre : on ne vide pas les champs,
      // on confirme visuellement.
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1500);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Jour du réveil
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Coucher
          </span>
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Réveil
          </span>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
            required
          />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-2)" }}>
            Qualité
          </span>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
          >
            <option value="">—</option>
            <option value="1">1 · Très mauvaise</option>
            <option value="2">2 · Mauvaise</option>
            <option value="3">3 · Moyenne</option>
            <option value="4">4 · Bonne</option>
            <option value="5">5 · Excellente</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-accent px-5 py-2.5 text-sm font-medium"
        >
          {saving ? "Enregistrement…" : "Enregistrer la nuit"}
        </button>
        <span
          aria-live="polite"
          className="text-sm font-medium"
          style={{ color: "var(--fit-accent-strong)" }}
        >
          {saved ? "Nuit enregistrée ✓" : ""}
        </span>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
