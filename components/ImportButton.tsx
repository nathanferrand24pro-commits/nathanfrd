"use client";

import { useState } from "react";

export function ImportButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error" | "duplicate"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/articles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as { title?: string; error?: string };

      if (res.status === 201) {
        setResult({ type: "success", message: `✓ Importé : "${data.title}"` });
        setUrl("");
        setTimeout(() => {
          setOpen(false);
          setResult(null);
          window.location.reload();
        }, 2000);
      } else if (res.status === 409) {
        setResult({ type: "duplicate", message: "Cet article est déjà dans la base." });
      } else {
        setResult({ type: "error", message: data.error ?? "Erreur d'import" });
      }
    } catch {
      setResult({ type: "error", message: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
        style={{
          background: "#f2f2f7",
          color: "#1d1d1f",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Importer une URL
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setResult(null); } }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg" style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}>
                  Importer un article
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#6e6e73" }}>
                  Collez une URL de Légifrance, Cour de Cassation, EUR-Lex, etc.
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); setResult(null); }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#f2f2f7", color: "#6e6e73" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.legifrance.gouv.fr/juri/id/..."
                autoFocus
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  border: "1.5px solid #e5e5ea",
                  background: "#f9f9f9",
                  color: "#1d1d1f",
                  fontFamily: "monospace",
                  fontSize: "13px",
                }}
              />

              {/* Sources acceptées */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "legifrance.gouv.fr",
                  "courdecassation.fr",
                  "conseil-etat.fr",
                  "eur-lex.europa.eu",
                  "hudoc.echr.coe.int",
                  "juricaf.org",
                  "flichygrange.com",
                  "fromont-briens.com",
                  "capstan.fr",
                ].map((domain) => (
                  <span
                    key={domain}
                    className="text-xs px-2 py-0.5 rounded-md"
                    style={{ background: "#f2f2f7", color: "#aeaeb2" }}
                  >
                    {domain}
                  </span>
                ))}
              </div>

              {result && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background:
                      result.type === "success"
                        ? "rgba(52,199,89,0.1)"
                        : result.type === "duplicate"
                        ? "rgba(255,149,0,0.1)"
                        : "rgba(255,59,48,0.1)",
                    color:
                      result.type === "success"
                        ? "#1a8a3a"
                        : result.type === "duplicate"
                        ? "#b87400"
                        : "#d00",
                  }}
                >
                  {result.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: loading || !url.trim() ? "#aeaeb2" : "#0071e3",
                  color: "#fff",
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Import en cours…" : "Importer"}
              </button>
            </form>

            {/* Conseil PISTE */}
            <div
              className="mt-5 rounded-xl p-4"
              style={{ background: "rgba(0,113,227,0.05)", border: "1px solid rgba(0,113,227,0.15)" }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: "#0071e3" }}>
                💡 Pour une veille automatique complète
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#6e6e73" }}>
                Inscrivez-vous gratuitement sur{" "}
                <a
                  href="https://piste.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0071e3", textDecoration: "underline" }}
                >
                  piste.gouv.fr
                </a>{" "}
                → abonnez-vous aux APIs <strong>Légifrance</strong> et{" "}
                <strong>Judilibre</strong> → ajoutez vos clés dans{" "}
                <code
                  className="px-1 py-0.5 rounded"
                  style={{ background: "#f2f2f7", fontSize: "11px" }}
                >
                  .env.local
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
