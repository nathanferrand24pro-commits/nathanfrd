"use client";

interface SourceBadgeProps {
  name: string;
  type: string;
}

export function SourceBadge({ name, type }: SourceBadgeProps) {
  const isOfficiel = type === "officiel";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${
        isOfficiel ? "bg-blue-800" : "bg-amber-600"
      }`}
    >
      {name}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  licenciement: "Licenciement",
  "contrat-de-travail": "Contrat de travail",
  discrimination: "Discrimination",
  "duree-du-travail": "Durée du travail",
  "securite-sociale": "Sécu. sociale",
  "negociation-collective": "Négociation coll.",
  "sante-travail": "Santé au travail",
  remuneration: "Rémunération",
  "procedure-prudhomale": "Prud'hommes",
  "representation-personnel": "Représentation",
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
