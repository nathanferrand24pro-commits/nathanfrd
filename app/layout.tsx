import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { NavLinks } from "../components/NavLinks";

export const metadata: Metadata = {
  title: "Veille Juridique — Droit Social",
  description: "Plateforme de veille jurisprudentielle en droit social",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: "#f5f5f7", color: "#1d1d1f" }}>

        {/* Header — Apple style sticky avec blur */}
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "saturate(180%) blur(20px)",
            borderColor: "rgba(0,0,0,0.08)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #0071e3 0%, #004fb3 100%)" }}
              >
                ⚖
              </div>
              <div>
                <span className="font-semibold text-sm" style={{ color: "#1d1d1f", letterSpacing: "-0.01em" }}>
                  Veille Droit Social
                </span>
              </div>
            </Link>

            {/* Nav */}
            <NavLinks />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer Apple-style */}
        <footer className="mt-20 border-t" style={{ borderColor: "#d2d2d7", background: "#f5f5f7" }}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                © 2026 Veille Droit Social — Actualisation quotidienne à 6h00
              </p>
              <p className="text-xs" style={{ color: "#6e6e73" }}>
                Sources : Cour de Cassation · Conseil d'État · Légifrance · EUR-Lex · HUDOC · Juricaf
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
