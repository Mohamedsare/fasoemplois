"use client";

import { FileText, House, Lightbulb, LogIn, Tag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barre d'onglets mobile, façon application native (masquée à partir de md).
 * Masquée aussi dans les parcours ciblés qui ont leur propre barre d'actions.
 */
const HIDDEN_ON = [/^\/cv\/.+/, /^\/paiement/];

export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  const tabs = [
    { href: "/", label: "Accueil", icon: House, active: pathname === "/" },
    { href: "/cv", label: "Mes CV", icon: FileText, active: pathname === "/cv" },
    { href: "/abonnements", label: "Tarifs", icon: Tag, active: pathname.startsWith("/abonnements") },
    { href: "/astuces", label: "Astuces", icon: Lightbulb, active: pathname.startsWith("/astuces") },
    loggedIn
      ? { href: "/espace", label: "Mon espace", icon: UserRound, active: pathname.startsWith("/espace") }
      : {
          href: "/connexion",
          label: "Connexion",
          icon: LogIn,
          active: pathname.startsWith("/connexion") || pathname.startsWith("/inscription") || pathname.startsWith("/mot-de-passe"),
        },
  ];

  return (
    <nav
      id="tabbar"
      aria-label="Navigation principale"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? "text-brand-700" : "text-muted active:text-ink"
              }`}
            >
              <span className={`grid h-7 w-14 place-items-center rounded-full transition-colors ${active ? "bg-brand-50" : ""}`}>
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
