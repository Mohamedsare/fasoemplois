import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Plateforme",
    links: [
      { href: "/offres", label: "Offres d'emploi" },
      { href: "/abonnements", label: "Abonnements" },
      { href: "/#comment-ca-marche", label: "Comment ça marche" },
    ],
  },
  {
    title: "Candidats",
    links: [
      { href: "/inscription", label: "Créer un compte" },
      { href: "/cv", label: "Créer mon CV" },
      { href: "/espace", label: "Mon espace" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/astuces", label: "Astuces" },
      { href: "/astuces/eviter-les-arnaques", label: "Éviter les arnaques" },
      { href: "/conditions", label: "Conditions d'utilisation" },
      { href: "/politique-abonnement", label: "Politique d'abonnement" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "mailto:contact@fasoemploi.bf", label: "contact@fasoemploi.bf" },
      { href: "/mot-de-passe-oublie", label: "Mot de passe oublié" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print relative mt-auto overflow-hidden border-t border-line bg-surface">
      {/* Filigrane : le logo en très grand, derrière le contenu */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[12%] select-none text-center font-script text-[clamp(5rem,20vw,20rem)] leading-none whitespace-nowrap text-ink/10"
      >
        Faso <span className="text-brand-600/15">Emploi</span>
      </span>
      <div className="container-page relative grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Les meilleures opportunités d&apos;emploi au Burkina Faso, sélectionnées pour vous.
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
        © {new Date().getFullYear()} Faso Emploi. Tous droits réservés.
      </div>
    </footer>
  );
}
