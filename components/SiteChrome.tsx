"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks } from "./NavLinks";
import { IconDumbbell } from "./FitnessIcons";

// L'en-tête et le pied de page changent selon la section :
// branding Fitness (liquid glass, émeraude sobre) sur /fitness,
// branding Veille Droit Social ailleurs.

export function SiteHeader() {
  const pathname = usePathname();
  const isFitness = pathname.startsWith("/fitness");

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: isFitness ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(170%) blur(24px)",
        WebkitBackdropFilter: "saturate(170%) blur(24px)",
        borderColor: isFitness ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.08)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href={isFitness ? "/fitness" : "/"} className="flex items-center gap-2.5 group">
          {isFitness ? (
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(150deg, #1c8f6b 0%, #0c5a43 100%)",
                boxShadow: "0 3px 10px rgba(21,127,95,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <IconDumbbell className="w-5 h-5" />
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #0071e3 0%, #004fb3 100%)" }}
            >
              ⚖
            </div>
          )}
          <div>
            <span
              className="font-semibold text-sm whitespace-nowrap"
              style={{
                color: isFitness ? "var(--fit-ink)" : "#1d1d1f",
                letterSpacing: "-0.01em",
              }}
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

  if (isFitness) {
    return (
      <footer className="mt-16 mb-24 sm:mb-0 border-t" style={{ borderColor: "rgba(255,255,255,0.6)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
              Fitness — Protocole « Foundational Fitness » d&apos;Andrew Huberman
            </p>
            <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
              3 musculations + 3 cardios par semaine · Alternance force / hypertrophie
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-20 border-t" style={{ borderColor: "#d2d2d7", background: "#f5f5f7" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "#6e6e73" }}>
            © 2026 Veille Droit Social — Actualisation quotidienne à 6h00
          </p>
          <p className="text-xs" style={{ color: "#6e6e73" }}>
            Sources : Cour de Cassation · Conseil d&apos;État · Légifrance · EUR-Lex · HUDOC ·
            Juricaf
          </p>
        </div>
      </div>
    </footer>
  );
}
