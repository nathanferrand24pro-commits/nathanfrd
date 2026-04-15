"use client";

import { useState } from "react";

export function ScrapeButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleScrape = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (res.ok) {
        setMessage("Actualisation lancée — les nouvelles décisions apparaîtront dans quelques instants.");
        setTimeout(() => setMessage(""), 6000);
        // Reload page after a delay to show new articles
        setTimeout(() => window.location.reload(), 8000);
      } else {
        setMessage("Erreur lors du lancement de l'actualisation.");
      }
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleScrape}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Actualisation...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser maintenant
          </>
        )}
      </button>
      {message && (
        <p className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
          {message}
        </p>
      )}
    </div>
  );
}
