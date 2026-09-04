"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/fitness", label: "Tableau de bord", short: "Accueil", icon: "🏠" },
  { href: "/fitness/seances", label: "Historique", short: "Séances", icon: "🏋️" },
  { href: "/fitness/nutrition", label: "Nutrition", short: "Nutrition", icon: "🍽️" },
  { href: "/fitness/sommeil", label: "Sommeil", short: "Sommeil", icon: "🌙" },
  { href: "/fitness/exercices", label: "Exercices", short: "Exercices", icon: "📋" },
  { href: "/fitness/progression", label: "Progression", short: "Progrès", icon: "📈" },
];

function isActive(pathname: string, href: string) {
  if (href === "/fitness") return pathname === "/fitness" || pathname.startsWith("/fitness/seance/");
  return pathname.startsWith(href);
}

// Onglets desktop (masqués sur mobile, remplacés par la barre du bas).
export function FitnessNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden sm:flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: active ? "#bf4800" : "#1d1d1f",
              background: active ? "rgba(191,72,0,0.08)" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Barre d'onglets fixe en bas, façon app iOS (mobile uniquement).
export function FitnessTabBar() {
  const pathname = usePathname();
  const mobileTabs = tabs.filter((t) => t.href !== "/fitness/exercices");
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        borderColor: "rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex">
        {mobileTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2"
              style={{ color: active ? "#bf4800" : "#6e6e73" }}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
