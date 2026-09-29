"use client";

import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/offres", label: "Offres d'emploi" },
  { href: "/admin/candidats", label: "Candidats" },
  { href: "/admin/candidatures", label: "Candidatures" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/entreprises", label: "Entreprises" },
  { href: "/admin/plans", label: "Abonnements" },
  { href: "/admin/paiements", label: "Paiements" },
  { href: "/admin/astuces", label: "Contenu" },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="bg-ink text-cream lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0">
      <div className="flex items-center justify-between px-5 py-4 lg:block">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-linear-to-b from-accent-500 from-50% to-brand-600 to-50% text-star-400"><Star className="size-3" fill="currentColor" strokeWidth={0} /></span>
          FE Admin
        </Link>
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-cream/60 hover:text-cream lg:mt-1 lg:block"><ArrowLeft aria-hidden className="size-4" /> Voir le site</Link>
      </div>
      <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
              active(l.href) ? "bg-cream text-ink" : "text-cream/80 hover:bg-white/10 hover:text-cream"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="hidden truncate px-5 pt-6 text-xs text-cream/50 lg:block">{name}</p>
    </aside>
  );
}
