"use client";

import { ExternalLink, FileText, LayoutDashboard, Lightbulb, LogOut, ReceiptText, ScrollText, Tags, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { BRAND } from "@/lib/brand";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/paiements", label: "Paiements", icon: ReceiptText, badge: "pending" },
  { href: "/admin/plans", label: "Abonnements", icon: Tags },
  { href: "/admin/cv", label: "CV & modèles", icon: FileText },
  { href: "/admin/astuces", label: "Astuces", icon: Lightbulb },
  { href: "/admin/journal", label: "Journal", icon: ScrollText },
] as const;

export function AdminNav({ name, email, pending }: { name: string; email: string; pending: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="bg-ink text-cream lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          {/* Drapeau du Burkina Faso, comme le logo du site */}
          <span aria-hidden className="relative grid h-6 w-9 shrink-0 place-items-center overflow-hidden rounded-[5px]">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-accent-500" />
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-brand-600" />
            <svg viewBox="0 0 24 24" className="relative size-3.5 text-star-400" fill="currentColor"><path d="M12 2l2.9 8.9H24l-7.5 5.4 2.9 8.9L12 19.8l-7.4 5.4 2.9-8.9L0 10.9h9.1z" /></svg>
          </span>
          <span className="leading-tight">
            <span className="block font-bold">{BRAND.name}</span>
            <span className="block text-[0.6875rem] tracking-widest text-cream/50 uppercase">Administration</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 lg:mt-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-cream/60 hover:text-cream">
            Voir le site <ExternalLink aria-hidden className="size-3.5" />
          </Link>
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="grid size-8 place-items-center rounded-full text-cream/60 hover:bg-white/10 hover:text-cream" aria-label="Se déconnecter">
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {LINKS.map((l) => {
          const isActive = active(l.href);
          const count = "badge" in l && pending > 0 ? pending : 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                isActive ? "bg-cream font-semibold text-ink" : "text-cream/75 hover:bg-white/10 hover:text-cream"
              }`}
            >
              <l.icon aria-hidden className="size-4 shrink-0" />
              {l.label}
              {count > 0 && (
                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#ff7900] px-1.5 text-[0.6875rem] font-bold text-white">
                  {count}
                  <span className="sr-only"> à vérifier</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/10 px-5 py-4 lg:block">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-cream/50">{email}</p>
        <form action={signOut} className="mt-3">
          <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-cream/60 hover:text-cream">
            <LogOut aria-hidden className="size-3.5" /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
