"use client";

import { BadgeCheck, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "@/app/actions/auth";

const MAIN_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/cv", label: "Créer mon CV" },
  { href: "/modeles", label: "Modèles" },
  { href: "/abonnements", label: "Tarifs" },
  { href: "/astuces", label: "Astuces" },
];

type Props = {
  user: { firstName: string; isAdmin: boolean; isSubscribed: boolean } | null;
};

export function NavLinks({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Menu mobile ouvert : bloque le défilement de la page et ferme avec Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const linkClass = (href: string) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive(href) ? "bg-ink text-white" : "text-ink hover:bg-surface"
    }`;

  const account = user ? (
    <>
      {user.isSubscribed && (
        <span className="hidden items-center gap-1 rounded-full border border-brand-600 px-2.5 py-0.5 text-xs font-medium text-brand-800 lg:inline-flex">
          <BadgeCheck aria-hidden className="size-3.5" /> Abonné
        </span>
      )}
      {user.isAdmin && (
        <Link href="/admin" className={linkClass("/admin")}>Admin</Link>
      )}
      <Link href="/espace" className={linkClass("/espace")}>
        {user.firstName}
      </Link>
      <form action={signOut}>
        <button type="submit" className="btn-secondary w-full">Déconnexion</button>
      </form>
    </>
  ) : (
    <>
      <Link href="/connexion" className={linkClass("/connexion")}>Connexion</Link>
      <Link href="/inscription" className="btn-primary">Créer un compte</Link>
    </>
  );

  return (
    <>
      <nav aria-label="Navigation principale" className="hidden flex-1 items-center justify-between md:flex">
        <ul className="flex items-center gap-1">
          {MAIN_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkClass(l.href)} aria-current={isActive(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">{account}</div>
      </nav>

      <button
        type="button"
        className="btn-secondary px-3 md:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Ouvrir le menu</span>
        <Menu aria-hidden className="size-5" />
      </button>

      {/* Portail vers <body> : le backdrop-blur du header confinerait un élément `fixed`. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              aria-hidden
              className="absolute inset-0 animate-fade-in bg-ink/40"
              onClick={() => setOpen(false)}
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] animate-drawer-in flex-col bg-white shadow-xl"
            >
              <div className="flex h-16 items-center justify-between border-b border-line px-4">
                <span className="text-sm font-semibold">Menu</span>
                <button
                  type="button"
                  className="btn-secondary px-3"
                  onClick={() => setOpen(false)}
                  autoFocus
                >
                  <span className="sr-only">Fermer le menu</span>
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              <nav
                id="mobile-nav"
                aria-label="Navigation principale"
                className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
                // Referme le menu après un clic sur un lien
                onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
              >
                {MAIN_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                    {l.label}
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">{account}</div>
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
