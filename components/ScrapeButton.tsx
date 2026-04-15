"use client";

import { useState } from "react";

export function ScrapeButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleScrape = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          setStatus("idle");
          window.location.reload();
        }, 5000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleScrape}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
        style={{
          background: loading ? "#aeaeb2" : "#0071e3",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 1px 3px rgba(0,113,227,0.3)",
        }}
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
            Actualiser
          </>
        )}
      </button>
      {status === "success" && (
        <span className="text-xs font-medium" style={{ color: "#34c759" }}>
          ✓ Lancé — rechargement dans 5s
        </span>
      )}
      {status === "error" && (
        <span className="text-xs" style={{ color: "#ff3b30" }}>Erreur</span>
      )}
    </div>
  );
}
