"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks } from "./NavLinks";

// L'en-tête et le pied de page changent selon la section :
// branding Fitness sur /fitness, branding Veille Droit Social ailleurs.

export function SiteHeader() {
  const pathname = usePathname();
  const isFitness = pathname.startsWith("/fitness");

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        borderColor: "rgba(0,0,0,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href={isFitness ? "/fitness" : "/"} className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{
              background: isFitness
                ? "linear-gradient(135deg, #e56000 0%, #a83d00 100%)"
                : "linear-gradient(135deg, #0071e3 0%, #004fb3 100%)",
            }}
          >
            {isFitness ? "🏋" : "⚖"}
          </div>
          <div>
            <span
              className="font-semibold text-sm whitespace-nowrap"
              style={{ color: "#1d1d1f", letterSpacing: "-0.01em" }}
            >
              {isFitness ? (
                <>
                  <span className="sm:hidden">Fitness</span>
                  <span className="hidden sm:inline">Fitness — Protocole Huberman</span>
                </>
              ) : (
                "Veille Droit Social"
              )}
            </span>
          </div>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const isFitness = pathname.startsWith("/fitness");

  return (
    <footer className="mt-20 border-t" style={{ borderColor: "#d2d2d7", background: "#f5f5f7" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {isFitness ? (
            <>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                © 2026 Fitness — Protocole « Foundational Fitness » d&apos;Andrew Huberman
              </p>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                3 séances de musculation + 3 séances cardio par semaine · Alternance mensuelle
                force / hypertrophie
              </p>
            </>
          ) : (
            <>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                © 2026 Veille Droit Social — Actualisation quotidienne à 6h00
              </p>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                Sources : Cour de Cassation · Conseil d&apos;État · Légifrance · EUR-Lex · HUDOC ·
                Juricaf
              </p>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
