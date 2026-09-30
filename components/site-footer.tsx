import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/cv", label: "Créer mon CV" },
      { href: "/abonnements", label: "Tarifs" },
      { href: "/#comment-ca-marche", label: "Comment ça marche" },
      { href: "/modeles", label: "Modèles de CV" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { href: "/inscription", label: "Créer un compte" },
      { href: "/connexion", label: "Connexion" },
      { href: "/espace", label: "Mon espace" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/astuces", label: "Astuces" },
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/politique-abonnement", label: "Politique d'abonnement" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: `mailto:${BRAND.contactEmail}`, label: BRAND.contactEmail },
      { href: "/mot-de-passe-oublie", label: "Mot de passe oublié" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="no-print relative mt-auto overflow-hidden border-t border-line bg-surface">
      {/* Filigrane : le logo en très grand, derrière le contenu */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[12%] select-none text-center font-script text-[clamp(5rem,20vw,20rem)] leading-none whitespace-nowrap text-ink/10"
      >
        {BRAND.logoFirst} <span className="text-brand-600/15">{BRAND.logoSecond}</span>
      </span>
      <div className="container-page relative grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Créez un CV professionnel en quelques minutes, rédigé avec l&apos;IA et prêt à envoyer.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ink">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
