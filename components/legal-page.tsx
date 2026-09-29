import Link from "next/link";

export const LEGAL_UPDATED_AT = "29 septembre 2026";

const LEGAL_LINKS = [
  { href: "/conditions", label: "Conditions d'utilisation" },
  { href: "/politique-abonnement", label: "Politique d'abonnement" },
  { href: "/confidentialite", label: "Confidentialité" },
];

/** Gabarit commun des pages légales. */
export function LegalPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Informations légales" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {LEGAL_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={current === l.href ? "page" : undefined}
                className={`block rounded-full px-3 py-1.5 text-sm ${current === l.href ? "bg-ink text-white" : "hover:bg-surface"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-3xl space-y-6 leading-relaxed text-ink/90 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        <header>
          <h1 className="text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">Dernière mise à jour : {LEGAL_UPDATED_AT}</p>
        </header>
        {children}
      </article>
    </div>
  );
}

/** Mention visible des informations restant à renseigner avant la mise en ligne. */
export function ToFill({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-star-400/30 px-1 text-ink">[À compléter : {children}]</mark>;
}
