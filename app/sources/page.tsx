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
  _count: { articles: number };
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data: Source[]) => {
        setSources(data);
        setLoading(false);
      });
  }, []);

  const toggleSource = async (id: string, active: boolean) => {
    await fetch(`/api/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active } : s))
    );
  };

  const officialSources = sources.filter((s) => s.type === "officiel");
  const cabinetSources = sources.filter((s) => s.type === "cabinet");

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Gestion des sources
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Activez ou désactivez les sources de veille. Les sources désactivées ne
        seront pas incluses dans l&apos;actualisation quotidienne.
      </p>

      <SourceGroup
        title="Sources officielles"
        badge="officiel"
        sources={officialSources}
        onToggle={toggleSource}
      />

      <SourceGroup
        title="Cabinets d'avocats"
        badge="cabinet"
        sources={cabinetSources}
        onToggle={toggleSource}
        className="mt-8"
      />
    </div>
  );
}

function SourceGroup({
  title,
  badge,
  sources,
  onToggle,
  className = "",
}: {
  title: string;
  badge: string;
  sources: Source[];
  onToggle: (id: string, active: boolean) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span
          className={`text-xs px-2 py-0.5 rounded text-white font-medium ${
            badge === "officiel" ? "bg-blue-800" : "bg-amber-600"
          }`}
        >
          {sources.length}
        </span>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`flex items-center justify-between px-5 py-4 ${
              !source.active ? "opacity-50" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{source.name}</p>
              <div className="flex items-center gap-4 mt-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 hover:underline truncate"
                >
                  {source.url}
                </a>
                <span className="text-xs text-gray-400 shrink-0">
                  {source._count.articles} article(s)
                </span>
                {source.lastScrapedAt && (
                  <span className="text-xs text-gray-400 shrink-0">
                    Dernière MAJ:{" "}
                    {new Date(source.lastScrapedAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </span>
                )}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={source.active}
                onChange={(e) => onToggle(source.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-800" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
