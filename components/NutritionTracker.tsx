"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  // Jour dont le chargement est le plus récent : les réponses d'un load()
  // plus ancien sont ignorées (deux taps rapides sur ← / →).
  const requestedDayRef = useRef(today);

  const load = useCallback(async (d: string) => {
    requestedDayRef.current = d;
    setLoading(true);
    try {
      const [entriesRes, goalRes] = await Promise.all([
        fetch(`/api/fitness/food-entries?date=${d}`),
        fetch("/api/fitness/nutrition-goal"),
      ]);
      const entriesData: FoodEntry[] | null = entriesRes.ok
        ? await entriesRes.json()
        : null;
      const goalData: Goal | null = goalRes.ok ? await goalRes.json() : null;
      // Réponse obsolète : un jour plus récent a été demandé entre-temps.
      if (requestedDayRef.current !== d) return;
      if (entriesData) setEntries(entriesData);
      if (goalData) setGoal(goalData);
    } finally {
      if (requestedDayRef.current === d) setLoading(false);
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

  async function removeEntry(entry: FoodEntry) {
    if (!confirm(`Supprimer « ${entry.name} » ?`)) return;
    const res = await fetch(`/api/fitness/food-entries/${entry.id}`, {
      method: "DELETE",
    });
    if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  const dayLabel = new Date(`${day}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* Navigation par jour */}
      <div className="glass flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setDay(shiftDay(day, -1))}
          className="btn-glass w-11 h-11 flex items-center justify-center text-lg shrink-0"
          aria-label="Jour précédent"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize" style={{ color: "var(--fit-ink)" }}>
            {dayLabel}
          </p>
          {day !== today && (
            <button
              onClick={() => setDay(today)}
              className="text-xs font-medium px-3 py-2"
              style={{ color: "var(--fit-accent-strong)" }}
            >
              Revenir à aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          onClick={() => setDay(shiftDay(day, 1))}
          disabled={day >= today}
          className="btn-glass w-11 h-11 flex items-center justify-center text-lg shrink-0 disabled:opacity-30"
          aria-label="Jour suivant"
        >
          →
        </button>
      </div>

      {/* Totaux vs objectifs */}
      <div className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
            Bilan du jour
          </h2>
          <GoalEditor goal={goal} onSaved={setGoal} />
        </div>
        {loading ? (
          <div className="space-y-3" aria-label="Chargement du bilan">
            <div
              className="h-2.5 rounded-full animate-pulse"
              style={{ background: "var(--fit-track)" }}
            />
            <div
              className="h-2.5 rounded-full animate-pulse"
              style={{ background: "var(--fit-track)" }}
            />
            <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
              Chargement…
            </p>
          </div>
        ) : (
          <>
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
            <p className="text-xs mt-4" style={{ color: "var(--fit-ink-2)" }}>
              Glucides : {Math.round(totals.carbs)} g · Lipides : {Math.round(totals.fat)} g
            </p>
          </>
        )}
      </div>

      {/* Ajout d'un aliment */}
      <AddFoodCard day={day} onAdded={(entry) => setEntries((prev) => [...prev, entry])} />

      {/* Entrées par repas */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Journal alimentaire
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: "var(--fit-ink-3)" }}>
            Chargement…
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fit-ink-2)" }}>
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
                    <h3 className="text-sm font-semibold" style={{ color: "var(--fit-ink)" }}>
                      {MEAL_LABELS[meal]}
                    </h3>
                    <span className="text-xs tabular-nums" style={{ color: "var(--fit-ink-3)" }}>
                      {mealKcal} kcal
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {mealEntries.map((e) => (
                      <li
                        key={e.id}
                        className="glass-inset flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate" style={{ color: "var(--fit-ink-2)" }}>
                            {e.name}
                          </p>
                          <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
                            {e.quantityG} g · {Math.round(e.calories)} kcal · P{" "}
                            {Math.round(e.proteinG)} g
                          </p>
                        </div>
                        <button
                          onClick={() => removeEntry(e)}
                          className="shrink-0 px-3 py-2.5 min-h-[44px] text-xs font-medium"
                          style={{ color: "var(--fit-danger)" }}
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
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = value > target * 1.05;
  const reached = !over && value >= target;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 shrink-0" style={{ color: "var(--fit-ink-2)" }}>
        {label}
      </span>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ background: "var(--fit-track)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: over
              ? "var(--fit-danger)"
              : reached
                ? "var(--fit-accent-strong)"
                : "var(--fit-accent)",
          }}
        />
      </div>
      <span
        className="text-xs w-28 text-right tabular-nums shrink-0"
        style={{ color: "var(--fit-ink-3)" }}
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
        className="text-xs font-medium px-3 py-2.5 min-h-[44px]"
        style={{ color: "var(--fit-accent-strong)" }}
      >
        Modifier les objectifs
      </button>
    );
  }
  return (
    <div className="glass-inset w-full px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 w-28">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
            kcal / jour
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 w-28">
          <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
            protéines (g)
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            className="fit-input px-3 py-2.5 text-base"
          />
        </label>
        <button onClick={save} className="btn-accent px-5 py-2.5 text-sm font-medium">
          OK
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="btn-glass px-4 py-2.5 text-sm font-medium"
        >
          Annuler
        </button>
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
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
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

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
      // Feedback bref « Ajouté ✓ » sur le bouton.
      setAdded(true);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      addedTimerRef.current = setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const addLabel = saving ? "Ajout…" : added ? "Ajouté ✓" : "+ Ajouter";
  const qty = Number(quantity) || 0;
  const factor = qty / 100;

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
          Ajouter un aliment
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={meal}
            onChange={(e) => setMeal(e.target.value as Meal)}
            className="fit-input px-3 py-2.5 text-base"
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {MEAL_LABELS[m]}
              </option>
            ))}
          </select>
          <div className="glass-inset flex p-1">
            {(["recherche", "manuel"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-2 rounded-lg text-xs font-medium"
                style={
                  mode === m
                    ? { background: "var(--fit-accent)", color: "#ffffff" }
                    : { color: "var(--fit-ink-2)" }
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
              className="fit-input flex-1 min-w-0 px-3 py-2.5 text-base"
              minLength={2}
              required
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-accent px-4 py-2.5 text-sm font-medium shrink-0"
            >
              {searching ? "Recherche…" : "Rechercher"}
            </button>
          </form>
          {searchError && (
            <p className="text-xs" style={{ color: "var(--fit-danger)" }}>
              {searchError}
            </p>
          )}
          {results.length > 0 && !selected && (
            <ul className="space-y-1.5">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => setSelected(r)}
                    className="glass-inset w-full text-left px-4 py-3 text-sm"
                  >
                    <span style={{ color: "var(--fit-ink)" }}>{r.name}</span>
                    {r.brand && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--fit-ink-3)" }}>
                        {r.brand}
                      </span>
                    )}
                    <span className="block text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
                      {Math.round(r.per100g.kcal)} kcal · P {r.per100g.proteinG.toFixed(1)} g · G{" "}
                      {r.per100g.carbsG.toFixed(1)} g · L {r.per100g.fatG.toFixed(1)} g — pour 100 g
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <div className="glass-inset px-4 py-3">
              <p className="text-sm font-medium" style={{ color: "var(--fit-ink)" }}>
                {selected.name}
                {selected.brand && (
                  <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--fit-ink-3)" }}>
                    {selected.brand}
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-end gap-3">
                  <label className="flex flex-col gap-1 w-28">
                    <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
                      Quantité (g)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={5000}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="fit-input px-3 py-2.5 text-base"
                    />
                  </label>
                  <p className="text-sm py-2.5" style={{ color: "var(--fit-ink-2)" }}>
                    = {Math.round(selected.per100g.kcal * factor)} kcal · P{" "}
                    {(selected.per100g.proteinG * factor).toFixed(1)} g
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                    className="btn-accent px-5 py-2.5 text-sm font-medium"
                  >
                    {addLabel}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="btn-glass px-4 py-2.5 text-sm font-medium"
                  >
                    Annuler
                  </button>
                </div>
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
          className="space-y-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
              Aliment
            </span>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Omelette 3 œufs"
              className="fit-input px-3 py-2.5 text-base"
              required
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
                Quantité (g)
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={5000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="fit-input w-full px-3 py-2.5 text-base"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
                Calories
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={10000}
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
                placeholder="250"
                className="fit-input w-full px-3 py-2.5 text-base"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--fit-ink-3)" }}>
                Protéines (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={1000}
                step="any"
                value={manualProtein}
                onChange={(e) => setManualProtein(e.target.value)}
                placeholder="20"
                className="fit-input w-full px-3 py-2.5 text-base"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-accent w-full sm:w-auto px-5 py-2.5 text-sm font-medium"
          >
            {addLabel}
          </button>
        </form>
      )}
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--fit-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
