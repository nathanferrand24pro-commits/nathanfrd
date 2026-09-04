"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toDayParam } from "../lib/nutrition";

export function SleepForm() {
  const router = useRouter();
  const [date, setDate] = useState(toDayParam(new Date()));
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Jour du réveil
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Coucher
        </span>
        <input
          type="time"
          value={bedTime}
          onChange={(e) => setBedTime(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Réveil
        </span>
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
          Qualité
        </span>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={inputStyle}
        >
          <option value="">—</option>
          <option value="1">1 · Très mauvaise</option>
          <option value="2">2 · Mauvaise</option>
          <option value="3">3 · Moyenne</option>
          <option value="4">4 · Bonne</option>
          <option value="5">5 · Excellente</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        style={{ background: "#bf4800", color: "#ffffff" }}
      >
        {saving ? "Enregistrement…" : "Enregistrer la nuit"}
      </button>
      {error && (
        <p className="text-xs w-full" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}
    </form>
  );
}
