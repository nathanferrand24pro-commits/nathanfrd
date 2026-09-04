"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/fitness", label: "Tableau de bord" },
  { href: "/fitness/seances", label: "Historique" },
  { href: "/fitness/exercices", label: "Exercices" },
  { href: "/fitness/progression", label: "Progression" },
];

export function FitnessNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const active =
          tab.href === "/fitness" ? pathname === "/fitness" : pathname.startsWith(tab.href);
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
