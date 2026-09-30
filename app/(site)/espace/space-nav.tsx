"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/espace", label: "Vue d'ensemble" },
  { href: "/cv", label: "Mes CV" },
  { href: "/espace/abonnement", label: "Abonnement" },
  { href: "/espace/profil", label: "Mon profil" },
]

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
          {LINKS.map((l) => (
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
