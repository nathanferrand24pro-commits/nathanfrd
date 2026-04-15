"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const CATEGORIES = [
  { value: "licenciement", label: "Licenciement" },
  { value: "contrat-de-travail", label: "Contrat de travail" },
  { value: "discrimination", label: "Discrimination" },
  { value: "duree-du-travail", label: "Durée du travail" },
  { value: "securite-sociale", label: "Sécu. sociale" },
  { value: "negociation-collective", label: "Négociation collective" },
  { value: "sante-travail", label: "Santé au travail" },
  { value: "remuneration", label: "Rémunération" },
  { value: "procedure-prudhomale", label: "Prud'hommes" },
  { value: "representation-personnel", label: "Représentation" },
];

interface Source {
  id: string;
  name: string;
  type: string;
}

interface FilterBarProps {
  sources: Source[];
}

export function FilterBar({ sources }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const reset = () => {
    router.push("/");
  };

  const currentType = searchParams.get("type") ?? "";
  const currentSource = searchParams.get("source") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  const hasFilters = currentType || currentSource || currentCategory || currentFrom || currentTo;

  const officialSources = sources.filter((s) => s.type === "officiel");
  const cabinetSources = sources.filter((s) => s.type === "cabinet");

  return (
    <aside className="w-64 shrink-0 space-y-6">
      {/* Type de source */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Type de source
        </h3>
        <div className="space-y-2">
          {[
            { value: "", label: "Toutes les sources" },
            { value: "officiel", label: "Sources officielles" },
            { value: "cabinet", label: "Cabinets d'avocats" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={currentType === opt.value}
                onChange={() => updateParam("type", opt.value)}
                className="text-blue-800"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sources individuelles */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Sources
        </h3>
        <div className="space-y-1">
          <p className="text-xs text-gray-400 font-medium mb-1">Officielles</p>
          {officialSources.map((s) => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="source"
                value={s.id}
                checked={currentSource === s.id}
                onChange={() => updateParam("source", s.id)}
                className="text-blue-800"
              />
              <span className="text-xs text-gray-600">{s.name}</span>
            </label>
          ))}
          <p className="text-xs text-gray-400 font-medium mt-3 mb-1">Cabinets</p>
          {cabinetSources.map((s) => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="source"
                value={s.id}
                checked={currentSource === s.id}
                onChange={() => updateParam("source", s.id)}
                className="text-blue-800"
              />
              <span className="text-xs text-gray-600">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Thèmes */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Thème
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={currentCategory === ""}
              onChange={() => updateParam("category", "")}
              className="text-blue-800"
            />
            <span className="text-sm text-gray-700">Tous les thèmes</span>
          </label>
          {CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={currentCategory === cat.value}
                onChange={() => updateParam("category", cat.value)}
                className="text-blue-800"
              />
              <span className="text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Période
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Du</label>
            <input
              type="date"
              value={currentFrom}
              onChange={(e) => updateParam("from", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Au</label>
            <input
              type="date"
              value={currentTo}
              onChange={(e) => updateParam("to", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={reset}
          className="w-full text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-2 transition-colors"
        >
          Réinitialiser les filtres
        </button>
      )}
    </aside>
  );
}
