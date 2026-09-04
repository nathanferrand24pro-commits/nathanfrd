// Suivi calorique — types et helpers partagés client/serveur.

export const MEALS = ["petit-dejeuner", "dejeuner", "diner", "collation"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABELS: Record<Meal, string> = {
  "petit-dejeuner": "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collations",
};

// Valeurs nutritionnelles pour 100 g, renvoyées par la recherche d'aliments.
export interface FoodSearchResult {
  name: string;
  brand: string | null;
  per100g: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

// "2026-09-04" → Date à minuit (heure locale du serveur).
export function parseDayParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDayParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
