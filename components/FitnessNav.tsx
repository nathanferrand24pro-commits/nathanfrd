"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconCalendar,
  IconDumbbell,
  IconMeal,
  IconMoon,
  IconChart,
  IconList,
} from "./FitnessIcons";

const tabs = [
  { href: "/fitness", label: "Tableau de bord", short: "Accueil", Icon: IconHome },
  { href: "/fitness/calendrier", label: "Calendrier", short: "Calendrier", Icon: IconCalendar },
  { href: "/fitness/seances", label: "Séances", short: "Séances", Icon: IconDumbbell },
  { href: "/fitness/nutrition", label: "Nutrition", short: "Nutrition", Icon: IconMeal },
  { href: "/fitness/sommeil", label: "Sommeil", short: "Sommeil", Icon: IconMoon },
  { href: "/fitness/exercices", label: "Exercices", short: "Exercices", Icon: IconList },
  { href: "/fitness/progression", label: "Progression", short: "Progrès", Icon: IconChart },
];

function isActive(pathname: string, href: string) {
  if (href === "/fitness") return pathname === "/fitness";
  if (href === "/fitness/seances")
    return pathname.startsWith("/fitness/seances") || pathname.startsWith("/fitness/seance/");
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
            className={`px-3 py-1.5 text-sm font-medium ${active ? "pill-accent" : "rounded-full"}`}
            style={active ? undefined : { color: "var(--fit-ink-2)" }}
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
  const mobileTabs = tabs.filter(
    (t) => t.href !== "/fitness/exercices" && t.href !== "/fitness/seances"
  );
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 glass-strong"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "none",
        borderRadius: 0,
      }}
    >
      <div className="flex">
        {mobileTabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2"
              style={{ color: active ? "var(--fit-accent-strong)" : "var(--fit-ink-2)" }}
            >
              <tab.Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{tab.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
