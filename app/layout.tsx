import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";

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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
