"use client";

import { useEffect, useState } from "react";

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  scraper: string;
  active: boolean;
  lastScrapedAt: string | null;
  lastError: string | null;
  _count: { articles: number };
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  officiel: { label: "Officielle", color: "#0071e3", bg: "rgba(0,113,227,0.08)" },
  europeen: { label: "Européenne", color: "#1a8a3a", bg: "rgba(52,199,89,0.1)" },
  cabinet: { label: "Cabinet", color: "#d4720a", bg: "rgba(255,149,0,0.1)" },
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data: Source[]) => { setSources(data); setLoading(false); });
  }, []);

  const toggleSource = async (id: string, active: boolean) => {
    await fetch(`/api/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
  };

  const groups = [
    { title: "Sources officielles françaises", types: ["officiel"] },
    { title: "Sources européennes", types: ["europeen"] },
    { title: "Cabinets d'avocats", types: ["cabinet"] },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#fff" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#1d1d1f", letterSpacing: "-0.03em" }}>
          Sources
        </h1>
        <p className="text-base" style={{ color: "#6e6e73" }}>
          Gérez les sources de veille. Les sources en rouge n&apos;ont pas pu être scrapées.
        </p>
      </div>

      {/* Conseil PISTE */}
      <div
        className="rounded-2xl p-5 mb-8 flex gap-4"
        style={{ background: "rgba(0,113,227,0.05)", border: "1px solid rgba(0,113,227,0.15)" }}
      >
        <div className="text-2xl">💡</div>
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: "#0071e3" }}>
            Accès complet à Légifrance & Cour de Cassation
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#6e6e73" }}>
            Créez un compte gratuit sur{" "}
            <a href="https://piste.gouv.fr" target="_blank" rel="noopener noreferrer"
              style={{ color: "#0071e3", textDecoration: "underline" }}>
              piste.gouv.fr
            </a>{" "}
            → abonnez-vous aux APIs <strong>Légifrance</strong> et <strong>Judilibre</strong> →
            ajoutez dans votre fichier{" "}
            <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#fff", fontFamily: "monospace" }}>
              .env.local
            </code>{" "}
            :
          </p>
          <pre
            className="mt-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: "#fff", color: "#1d1d1f", fontFamily: "monospace" }}
          >
{`PISTE_CLIENT_ID=votre_client_id
PISTE_CLIENT_SECRET=votre_client_secret`}
          </pre>
        </div>
      </div>

      {groups.map((group) => {
        const groupSources = sources.filter((s) => group.types.includes(s.type));
        if (groupSources.length === 0) return null;
        return (
          <div key={group.title} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#aeaeb2", letterSpacing: "0.06em" }}>
              {group.title}
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {groupSources.map((source, idx) => {
                const typeStyle = TYPE_LABELS[source.type] ?? TYPE_LABELS.officiel;
                const hasError = !!source.lastError;
                return (
                  <div
                    key={source.id}
                    className="px-5 py-4 flex items-center gap-4"
                    style={{
                      borderTop: idx > 0 ? "1px solid #f2f2f7" : "none",
                      opacity: source.active ? 1 : 0.5,
                      background: hasError && source.active ? "rgba(255,59,48,0.02)" : "transparent",
                    }}
                  >
                    {/* Type badge */}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0"
                      style={{ background: typeStyle.bg, color: typeStyle.color }}
                    >
                      {typeStyle.label}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm" style={{ color: "#1d1d1f" }}>{source.name}</p>
                        {hasError && source.active && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,59,48,0.1)", color: "#d00" }}>
                            Erreur
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs truncate max-w-[200px]" style={{ color: "#0071e3" }}>
                          {source.url}
                        </a>
                        <span className="text-xs" style={{ color: "#aeaeb2" }}>
                          {source._count.articles} article(s)
                        </span>
                        {source.lastScrapedAt && (
                          <span className="text-xs" style={{ color: "#aeaeb2" }}>
                            MAJ {new Date(source.lastScrapedAt).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      {hasError && source.active && (
                        <p className="text-xs mt-1 truncate" style={{ color: "#d00" }}>
                          {source.lastError}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={source.active}
                        onChange={(e) => toggleSource(source.id, e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="w-10 h-6 rounded-full relative transition-colors"
                        style={{ background: source.active ? "#0071e3" : "#e5e5ea" }}
                      >
                        <div
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                          style={{ left: source.active ? "22px" : "4px" }}
                        />
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
