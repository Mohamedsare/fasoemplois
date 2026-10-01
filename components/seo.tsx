import { ChevronRight, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { siteUrl } from "@/lib/supabase/env";
import { CITIES_BF, cityPath, type City } from "@/lib/seo-burkina";

/** Données structurées schema.org (lues par Google pour les résultats enrichis). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Échappe « < » pour qu'aucun contenu ne puisse fermer la balise <script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Fil d'Ariane visible + données structurées BreadcrumbList. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const base = siteUrl();
  const all = [{ name: "Accueil", path: "/" }, ...items];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base}${it.path === "/" ? "" : it.path}` })),
        }}
      />
      <nav aria-label="Fil d'Ariane" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight aria-hidden className="size-3" />}
              {i < all.length - 1 ? (
                <Link href={it.path} className="hover:text-ink hover:underline">{it.name}</Link>
              ) : (
                <span aria-current="page" className="text-ink">{it.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Questions fréquentes visibles + données structurées FAQPage. */
export function Faq({ items, title = "Questions fréquentes" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <section aria-labelledby="faq" className="space-y-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <h2 id="faq" className="text-2xl font-bold">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <details key={item.q} className="card group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              <h3 className="text-base font-medium">{item.q}</h3>
              <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Appel à l'action principal des pages SEO. */
export function SeoCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl bg-ink px-6 py-10 text-center text-white sm:px-10">
      <h2 className="mx-auto max-w-2xl text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-white/75">{text}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/inscription?suivant=%2Fcv" className="btn h-12 bg-star-400 px-6 text-ink hover:bg-star-400/90">
          <Sparkles aria-hidden className="size-4" /> Créer mon CV gratuitement
        </Link>
        <Link href="/modeles" className="btn h-12 border border-white/25 px-6 text-white hover:bg-white/10">Voir les modèles</Link>
      </div>
      <p className="mt-4 text-xs text-white/60">1 CV gratuit avec l&apos;assistant IA · sans carte bancaire · paiement Orange Money</p>
    </section>
  );
}

/** Grille de liens vers les pages des villes (maillage interne). */
export function CityGrid({ cities = CITIES_BF, title }: { cities?: City[]; title: string }) {
  return (
    <section aria-label={title} className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link href={cityPath(c)} className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm hover:border-brand-600 hover:text-brand-700">
              <MapPin aria-hidden className="size-4 shrink-0 text-brand-600" />
              <span className="truncate">CV à {c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Corps de texte long (guides) : typographie lisible. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-[0.975rem] leading-relaxed text-ink/85 [&_strong]:text-ink [&>h2]:mt-10 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-ink [&>h3]:mt-6 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-ink [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:mt-1.5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mt-1.5">
      {children}
    </div>
  );
}
