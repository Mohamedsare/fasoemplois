"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/espace", label: "Vue d'ensemble", short: "Accueil" },
  { href: "/offres", label: "Trouver un emploi", short: "Emplois" },
  { href: "/espace/candidatures", label: "Mes candidatures", short: "Candid." },
  { href: "/espace/favoris", label: "Favoris", short: "Favoris" },
  { href: "/cv", label: "Mon CV", short: null },
  { href: "/espace/profil", label: "Mon profil", short: "Profil" },
  { href: "/espace/abonnement", label: "Abonnement", short: null },
];

export function SpaceNav({ name }: { name: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/espace" ? pathname === href : pathname.startsWith(href));

  return (
    <>
      <nav aria-label="Mon espace" className="hidden lg:block">
        <div className="sticky top-24 space-y-1">
          <p className="mb-3 truncate px-3 text-sm font-semibold">{name}</p>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`block rounded-full px-3 py-1.5 text-sm ${active(l.href) ? "bg-ink text-white" : "hover:bg-surface"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile : onglets défilants en haut (la barre du bas est la navigation principale) */}
      <nav
        aria-label="Mon espace"
        className="sticky top-16 z-20 -mx-4 -mt-2 border-b border-line bg-white/95 backdrop-blur lg:hidden"
      >
        <ul className="flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
          {LINKS.filter((l) => l.href !== "/offres").map((l) => (
            <li key={l.href} className="shrink-0 snap-start">
              <Link
                href={l.href}
                aria-current={active(l.href) ? "page" : undefined}
                className={`chip py-1.5 ${active(l.href) ? "chip-active" : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
