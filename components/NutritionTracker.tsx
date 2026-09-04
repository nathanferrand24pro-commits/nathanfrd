"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MEALS,
  MEAL_LABELS,
  Meal,
  FoodSearchResult,
  toDayParam,
} from "../lib/nutrition";

interface FoodEntry {
  id: string;
  meal: string;
  name: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: string;
}

interface Goal {
  calories: number;
  proteinG: number;
}

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
};

const inputStyle: React.CSSProperties = {
  background: "#f5f5f7",
  border: "1px solid rgba(0,0,0,0.08)",
  color: "#1d1d1f",
};

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toDayParam(d);
}

export function NutritionTracker() {
  const today = toDayParam(new Date());
  const [day, setDay] = useState(today);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goal, setGoal] = useState<Goal>({ calories: 2500, proteinG: 140 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const [entriesRes, goalRes] = await Promise.all([
        fetch(`/api/fitness/food-entries?date=${d}`),
        fetch("/api/fitness/nutrition-goal"),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (goalRes.ok) setGoal(await goalRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(day);
  }, [day, load]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (t, e) => ({
          kcal: t.kcal + e.calories,
          protein: t.protein + e.proteinG,
          carbs: t.carbs + e.carbsG,
          fat: t.fat + e.fatG,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [entries]
  );

  async function removeEntry(id: string) {
    const res = await fetch(`/api/fitness/food-entries/${id}`, { method: "DELETE" });
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const dayLabel = new Date(`${day}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* Navigation par jour */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={card}>
        <button
          onClick={() => setDay(shiftDay(day, -1))}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ color: "#bf4800", background: "rgba(191,72,0,0.08)" }}
          aria-label="Jour précédent"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize" style={{ color: "#1d1d1f" }}>
            {dayLabel}
          </p>
          {day !== today && (
            <button
              onClick={() => setDay(today)}
              className="text-xs font-medium"
              style={{ color: "#bf4800" }}
            >
              Revenir à aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          onClick={() => setDay(shiftDay(day, 1))}
          disabled={day >= today}
          className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
          style={{ color: "#bf4800", background: "rgba(191,72,0,0.08)" }}
          aria-label="Jour suivant"
        >
          →
        </button>
      </div>

      {/* Totaux vs objectifs */}
      <div className="rounded-2xl p-6" style={card}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "#1d1d1f" }}>
            Bilan du jour
          </h2>
          <GoalEditor goal={goal} onSaved={setGoal} />
        </div>
        <div className="space-y-3">
          <ProgressRow
            label="Calories"
            value={Math.round(totals.kcal)}
            target={goal.calories}
            unit="kcal"
          />
          <ProgressRow
            label="Protéines"
            value={Math.round(totals.protein)}
            target={goal.proteinG}
            unit="g"
          />
        </div>
        <p className="text-xs mt-4" style={{ color: "#6e6e73" }}>
          Glucides : {Math.round(totals.carbs)} g · Lipides : {Math.round(totals.fat)} g
        </p>
      </div>

      {/* Ajout d'un aliment */}
      <AddFoodCard day={day} onAdded={(entry) => setEntries((prev) => [...prev, entry])} />

      {/* Entrées par repas */}
      <div className="rounded-2xl p-6" style={card}>
        <h2 className="text-base font-bold mb-4" style={{ color: "#1d1d1f" }}>
          Journal alimentaire
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: "#6e6e73" }}>
            Chargement…
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm" style={{ color: "#6e6e73" }}>
            Rien d&apos;enregistré ce jour. Ajoutez un aliment ci-dessus.
          </p>
        ) : (
          <div className="space-y-5">
            {MEALS.map((meal) => {
              const mealEntries = entries.filter((e) => e.meal === meal);
              if (mealEntries.length === 0) return null;
              const mealKcal = Math.round(mealEntries.reduce((s, e) => s + e.calories, 0));
              return (
                <div key={meal}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: "#1d1d1f" }}>
                      {MEAL_LABELS[meal]}
                    </h3>
                    <span className="text-xs tabular-nums" style={{ color: "#6e6e73" }}>
                      {mealKcal} kcal
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {mealEntries.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                        style={{ background: "#f5f5f7" }}
                      >
                        <div className="min-w-0">
                          <p className="truncate" style={{ color: "#424245" }}>
                            {e.name}
                          </p>
                          <p className="text-xs" style={{ color: "#6e6e73" }}>
                            {e.quantityG} g · {Math.round(e.calories)} kcal · P{" "}
                            {Math.round(e.proteinG)} g
                          </p>
                        </div>
                        <button
                          onClick={() => removeEntry(e.id)}
                          className="text-xs font-medium shrink-0"
                          style={{ color: "#d70015" }}
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  const over = value > target * 1.05;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 shrink-0" style={{ color: "#424245" }}>
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#e8e8ed" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: over ? "#d70015" : "#bf4800" }}
        />
      </div>
      <span
        className="text-xs w-28 text-right tabular-nums shrink-0"
        style={{ color: "#6e6e73" }}
      >
        {value.toLocaleString("fr-FR")} / {target.toLocaleString("fr-FR")} {unit}
      </span>
    </div>
  );
}

function GoalEditor({ goal, onSaved }: { goal: Goal; onSaved: (g: Goal) => void }) {
  const [open, setOpen] = useState(false);
  const [calories, setCalories] = useState(String(goal.calories));
  const [proteinG, setProteinG] = useState(String(goal.proteinG));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCalories(String(goal.calories));
    setProteinG(String(goal.proteinG));
  }, [goal]);

  async function save() {
    setError(null);
    const res = await fetch("/api/fitness/nutrition-goal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calories: Number(calories), proteinG: Number(proteinG) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Erreur");
      return;
    }
    onSaved(data);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium"
        style={{ color: "#bf4800" }}
      >
        Modifier les objectifs
      </button>
    );
  }
  return (
    <div className="flex items-end gap-2 flex-wrap justify-end">
      <label className="flex flex-col gap-1 w-24">
        <span className="text-[10px] font-medium" style={{ color: "#6e6e73" }}>
          kcal / jour
        </span>
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-sm"
          style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1 w-24">
        <span className="text-[10px] font-medium" style={{ color: "#6e6e73" }}>
          protéines (g)
        </span>
        <input
          type="number"
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-sm"
          style={inputStyle}
        />
      </label>
      <button
        onClick={save}
        className="px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: "#bf4800", color: "#ffffff" }}
      >
        OK
      </button>
      {error && (
        <p className="text-xs w-full text-right" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function AddFoodCard({ day, onAdded }: { day: string; onAdded: (e: FoodEntry) => void }) {
  const [meal, setMeal] = useState<Meal>("dejeuner");
  const [mode, setMode] = useState<"recherche" | "manuel">("recherche");

  // Recherche Open Food Facts
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Commun
  const [quantity, setQuantity] = useState("100");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saisie manuelle (valeurs pour la quantité saisie)
  const [manualName, setManualName] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualProtein, setManualProtein] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setSelected(null);
    try {
      const res = await fetch(`/api/fitness/foods/search?q=${encodeURIComponent(query)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Recherche impossible");
      setResults(data.results);
      if (data.results.length === 0) setSearchError("Aucun résultat — essayez la saisie manuelle.");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSearching(false);
    }
  }

  async function add(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/fitness/food-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, meal, date: day }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Erreur lors de l'ajout");
      onAdded(data);
      setSelected(null);
      setResults([]);
      setQuery("");
      setManualName("");
      setManualKcal("");
      setManualProtein("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const qty = Number(quantity) || 0;
  const factor = qty / 100;

  return (
    <div className="rounded-2xl p-6" style={card}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold" style={{ color: "#1d1d1f" }}>
          Ajouter un aliment
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value as Meal)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={inputStyle}
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {MEAL_LABELS[m]}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg overflow-hidden" style={{ background: "#f5f5f7" }}>
            {(["recherche", "manuel"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1.5 text-xs font-medium"
                style={
                  mode === m
                    ? { background: "#bf4800", color: "#ffffff" }
                    : { color: "#6e6e73" }
                }
              >
                {m === "recherche" ? "Rechercher" : "Manuel"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "recherche" ? (
        <div className="space-y-3">
          <form onSubmit={search} className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Poulet, riz basmati, skyr…"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              minLength={2}
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              style={{ background: "#bf4800", color: "#ffffff" }}
            >
              {searching ? "Recherche…" : "Rechercher"}
            </button>
          </form>
          {searchError && (
            <p className="text-xs" style={{ color: "#d70015" }}>
              {searchError}
            </p>
          )}
          {results.length > 0 && !selected && (
            <ul className="space-y-1.5">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => setSelected(r)}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm"
                    style={{ background: "#f5f5f7" }}
                  >
                    <span style={{ color: "#1d1d1f" }}>{r.name}</span>
                    {r.brand && (
                      <span className="ml-1.5 text-xs" style={{ color: "#6e6e73" }}>
                        {r.brand}
                      </span>
                    )}
                    <span className="block text-xs mt-0.5" style={{ color: "#6e6e73" }}>
                      {Math.round(r.per100g.kcal)} kcal · P {r.per100g.proteinG.toFixed(1)} g · G{" "}
                      {r.per100g.carbsG.toFixed(1)} g · L {r.per100g.fatG.toFixed(1)} g — pour 100 g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <div className="rounded-xl p-4" style={{ background: "#f5f5f7" }}>
              <p className="text-sm font-medium" style={{ color: "#1d1d1f" }}>
                {selected.name}
                {selected.brand && (
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "#6e6e73" }}>
                    {selected.brand}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-end gap-3 mt-3">
                <label className="flex flex-col gap-1 w-28">
                  <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
                    Quantité (g)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{ ...inputStyle, background: "#ffffff" }}
                  />
                </label>
                <p className="text-sm py-2" style={{ color: "#424245" }}>
                  = {Math.round(selected.per100g.kcal * factor)} kcal · P{" "}
                  {(selected.per100g.proteinG * factor).toFixed(1)} g
                </p>
                <button
                  onClick={() =>
                    add({
                      name: selected.brand
                        ? `${selected.name} (${selected.brand})`
                        : selected.name,
                      quantityG: qty,
                      calories: selected.per100g.kcal * factor,
                      proteinG: selected.per100g.proteinG * factor,
                      carbsG: selected.per100g.carbsG * factor,
                      fatG: selected.per100g.fatG * factor,
                      source: "openfoodfacts",
                    })
                  }
                  disabled={saving || qty <= 0}
                  className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                  style={{ background: "#bf4800", color: "#ffffff" }}
                >
                  {saving ? "Ajout…" : "+ Ajouter"}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs font-medium py-2"
                  style={{ color: "#6e6e73" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add({
              name: manualName,
              quantityG: qty,
              calories: Number(manualKcal),
              proteinG: Number(manualProtein) || 0,
              source: "manuel",
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 flex-1 min-w-40">
            <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
              Aliment
            </span>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Omelette 3 œufs"
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </label>
          <label className="flex flex-col gap-1 w-24">
            <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
              Quantité (g)
            </span>
            <input
              type="number"
              min={1}
              max={5000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </label>
          <label className="flex flex-col gap-1 w-24">
            <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
              Calories
            </span>
            <input
              type="number"
              min={0}
              max={10000}
              value={manualKcal}
              onChange={(e) => setManualKcal(e.target.value)}
              placeholder="250"
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
              required
            />
          </label>
          <label className="flex flex-col gap-1 w-24">
            <span className="text-xs font-medium" style={{ color: "#6e6e73" }}>
              Protéines (g)
            </span>
            <input
              type="number"
              min={0}
              max={1000}
              value={manualProtein}
              onChange={(e) => setManualProtein(e.target.value)}
              placeholder="20"
              className="rounded-lg px-3 py-2 text-sm"
              style={inputStyle}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
            style={{ background: "#bf4800", color: "#ffffff" }}
          >
            {saving ? "Ajout…" : "+ Ajouter"}
          </button>
        </form>
      )}
      {error && (
        <p className="text-xs mt-2" style={{ color: "#d70015" }}>
          {error}
        </p>
      )}
    </div>
  );
}
