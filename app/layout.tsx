import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";

export const metadata: Metadata = {
  title: "Veille Juridique — Droit Social",
  description: "Plateforme de veille jurisprudentielle en droit social",
  appleWebApp: {
    capable: true,
    title: "Fitness",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body
        className="min-h-full flex flex-col overflow-x-clip"
        style={{ background: "#f5f5f7", color: "#1d1d1f" }}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
