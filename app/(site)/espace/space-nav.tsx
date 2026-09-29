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

      {/* Mobile : barre de navigation en bas */}
      <nav aria-label="Mon espace" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-white py-2 lg:hidden">
        {LINKS.filter((l) => l.short).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className={`px-2 py-1 text-xs ${active(l.href) ? "font-bold text-brand-700" : "text-muted"}`}
          >
            {l.short}
          </Link>
        ))}
      </nav>
    </>
  );
}
