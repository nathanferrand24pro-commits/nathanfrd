"use client";

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  officiel: { bg: "rgba(0,113,227,0.08)", text: "#0071e3" },
  cabinet: { bg: "rgba(255,149,0,0.1)", text: "#d4720a" },
  europeen: { bg: "rgba(52,199,89,0.1)", text: "#1a8a3a" },
};

interface SourceBadgeProps {
  name: string;
  type: string;
}

export function SourceBadge({ name, type }: SourceBadgeProps) {
  const colors = SOURCE_COLORS[type] ?? SOURCE_COLORS.officiel;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: colors.bg, color: colors.text }}
    >
      {name}
    </span>
  );
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

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: "#f2f2f7", color: "#6e6e73" }}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}
