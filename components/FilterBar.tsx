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
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const reset = () => router.push("/");

  const currentType = searchParams.get("type") ?? "";
  const currentSource = searchParams.get("source") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const hasFilters = currentType || currentSource || currentCategory || currentFrom || currentTo;

  const officialSources = sources.filter((s) => s.type === "officiel" || s.type === "europeen");
  const cabinetSources = sources.filter((s) => s.type === "cabinet");

  return (
    <aside className="w-56 shrink-0 space-y-6">

      {/* Type de source */}
      <FilterSection title="Type">
        {[
          { value: "", label: "Tout" },
          { value: "officiel", label: "Officielles" },
          { value: "europeen", label: "Européennes" },
          { value: "cabinet", label: "Cabinets" },
        ].map((opt) => (
          <FilterRadio
            key={opt.value}
            name="type"
            value={opt.value}
            label={opt.label}
            checked={currentType === opt.value}
            onChange={() => updateParam("type", opt.value)}
          />
        ))}
      </FilterSection>

      {/* Sources */}
      <FilterSection title="Sources">
        {officialSources.length > 0 && (
          <p className="text-xs font-medium mb-1" style={{ color: "#aeaeb2" }}>Officielles & UE</p>
        )}
        {officialSources.map((s) => (
          <FilterRadio
            key={s.id}
            name="source"
            value={s.id}
            label={s.name}
            checked={currentSource === s.id}
            onChange={() => updateParam("source", s.id)}
          />
        ))}
        {cabinetSources.length > 0 && (
          <p className="text-xs font-medium mt-3 mb-1" style={{ color: "#aeaeb2" }}>Cabinets</p>
        )}
        {cabinetSources.map((s) => (
          <FilterRadio
            key={s.id}
            name="source"
            value={s.id}
            label={s.name}
            checked={currentSource === s.id}
            onChange={() => updateParam("source", s.id)}
          />
        ))}
      </FilterSection>

      {/* Thèmes */}
      <FilterSection title="Thème">
        <FilterRadio
          name="category"
          value=""
          label="Tous"
          checked={currentCategory === ""}
          onChange={() => updateParam("category", "")}
        />
        {CATEGORIES.map((cat) => (
          <FilterRadio
            key={cat.value}
            name="category"
            value={cat.value}
            label={cat.label}
            checked={currentCategory === cat.value}
            onChange={() => updateParam("category", cat.value)}
          />
        ))}
      </FilterSection>

      {/* Période */}
      <FilterSection title="Période">
        <div className="space-y-2">
          <div>
            <label className="text-xs block mb-1" style={{ color: "#aeaeb2" }}>Du</label>
            <input
              type="date"
              value={currentFrom}
              onChange={(e) => updateParam("from", e.target.value)}
              className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none"
              style={{ border: "1px solid #e5e5ea", background: "#fff", color: "#1d1d1f" }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "#aeaeb2" }}>Au</label>
            <input
              type="date"
              value={currentTo}
              onChange={(e) => updateParam("to", e.target.value)}
              className="w-full text-xs rounded-lg px-2.5 py-1.5 outline-none"
              style={{ border: "1px solid #e5e5ea", background: "#fff", color: "#1d1d1f" }}
            />
          </div>
        </div>
      </FilterSection>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={reset}
          className="w-full text-sm rounded-xl px-3 py-2"
          style={{ color: "#ff3b30", background: "rgba(255,59,48,0.06)", border: "none" }}
        >
          Réinitialiser
        </button>
      )}
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#aeaeb2", letterSpacing: "0.06em" }}>
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterRadio({
  name, value, label, checked, onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: checked ? "#0071e3" : "#c7c7cc",
          background: checked ? "#0071e3" : "transparent",
        }}
      >
        {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <span
        className="text-sm"
        style={{ color: checked ? "#0071e3" : "#1d1d1f", fontWeight: checked ? 500 : 400 }}
      >
        {label}
      </span>
    </label>
  );
}
