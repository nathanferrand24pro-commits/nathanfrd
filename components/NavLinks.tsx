"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Tableau de bord" },
  { href: "/sources", label: "Sources" },
  { href: "/alertes", label: "Alertes" },
  { href: "/fitness", label: "Fitness" },
];

export function NavLinks() {
  const pathname = usePathname();
  // Sur mobile, la section fitness a sa propre barre d'onglets en bas :
  // on masque la navigation du haut pour éviter tout débordement.
  const isFitness = pathname.startsWith("/fitness");
  return (
    <nav
      className={`items-center gap-1 overflow-x-auto whitespace-nowrap ${
        isFitness ? "hidden sm:flex" : "flex"
      }`}
    >
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: active ? "#0071e3" : "#1d1d1f",
              background: active ? "rgba(0,113,227,0.08)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
