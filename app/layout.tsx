import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* Header */}
        <header className="bg-blue-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90">
              <span className="text-2xl">⚖️</span>
              <div>
                <div className="font-bold text-lg leading-none">Veille Droit Social</div>
                <div className="text-blue-300 text-xs">Jurisprudence & Doctrine</div>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Tableau de bord
              </Link>
              <Link
                href="/sources"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Sources
              </Link>
              <Link
                href="/alertes"
                className="text-sm text-blue-100 hover:text-white transition-colors"
              >
                Alertes email
              </Link>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-400">
            Veille Juridique Droit Social — Actualisation quotidienne à 6h00
          </div>
        </footer>
      </body>
    </html>
  );
}
