import { Download, GraduationCap, Languages, PenLine, Sparkles, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/supabase/env";
import { SAMPLE_CVS, sampleId } from "@/lib/sample-cvs";
import { CITIES_BF, SECTORS, cityPath, findCity, relatedCities, type City } from "@/lib/seo-burkina";
import { CvPreview } from "@/components/cv-preview";
import { Breadcrumbs, CityGrid, Faq, JsonLd, SeoCta } from "@/components/seo";

// Une page par ville connue ; toute autre adresse renvoie une 404
export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES_BF.map((c) => ({ ville: c.slug }));
}

/** « le mooré, le dioula et le bissa » */
const languageList = (c: City) => {
  const items = c.languages.map((l) => `le ${l.toLowerCase()}`);
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} et ${items.at(-1)}` : items[0];
};

const sectorList = (c: City, n = 3) => c.sectors.slice(0, n).map((s) => SECTORS[s].label.toLowerCase());

export async function generateMetadata(props: PageProps<"/creer-cv/[ville]">): Promise<Metadata> {
  const { ville } = await props.params;
  const c = findCity(ville);
  if (!c) return {};
  const title = `Créer un CV à ${c.name} (Burkina Faso) : modèle gratuit et assistant IA`;
  const description = `CV professionnel pour un emploi ou un stage à ${c.name} : conseils locaux, modèles avec photo et assistant IA. Prêt en quelques minutes.`;
  const path = cityPath(c);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, locale: "fr_BF" },
  };
}

/** Variante de texte stable pour une ville (évite des pages identiques à un mot près). */
const pick = <T,>(c: City, variants: T[]) => variants[[...c.slug].reduce((n, ch) => n + ch.charCodeAt(0), 0) % variants.length];

export default async function CityCvPage(props: PageProps<"/creer-cv/[ville]">) {
  const { ville } = await props.params;
  const c = findCity(ville);
  if (!c) notFound();

  const base = siteUrl();
  const path = cityPath(c);
  const sectors = c.sectors.map((s) => ({ key: s, ...SECTORS[s] }));
  const sample = SAMPLE_CVS.find((s) => sampleId(s) === sectors[0].sample) ?? SAMPLE_CVS[0];
  const english = c.sectors.includes("mines") || c.sectors.includes("ong") || /Ghana|Côte d'Ivoire|Togo|anglais/i.test(c.note ?? "");
  const related = relatedCities(c);

  const intro = pick(c, [
    `Vous cherchez un emploi, un stage ou une mission à ${c.name} ? Un CV clair et bien présenté est la première étape pour décrocher un entretien.`,
    `À ${c.name} comme partout au Burkina Faso, les recruteurs lisent un CV en moins d'une minute : il doit aller droit à l'essentiel.`,
    `Pour postuler à ${c.name}, dans ${c.zone} du Burkina Faso, votre CV doit montrer en un coup d'œil votre métier, vos expériences et vos diplômes.`,
  ]);

  const faq = [
    {
      q: `Comment faire un CV pour trouver un emploi à ${c.name} ?`,
      a: `Indiquez le poste visé en titre, vos expériences de la plus récente à la plus ancienne avec des résultats concrets, vos diplômes et vos langues. À ${c.name}, les secteurs comme ${sectorList(c, 2).join(" et ")} recrutent régulièrement : adaptez votre CV à chaque offre.`,
    },
    {
      q: `Quelles langues indiquer sur un CV à ${c.name} ?`,
      a: `Le français, bien sûr, puis les langues parlées localement, comme ${languageList(c)}${english ? ", et l'anglais, apprécié des ONG, des sociétés minières et des employeurs proches des frontières" : ""}. Précisez votre niveau pour chacune.`,
    },
    {
      q: `Faut-il une photo sur son CV à ${c.name} ?`,
      a: "Oui, c'est l'usage au Burkina Faso. Choisissez une photo récente, sur fond neutre, avec une tenue professionnelle, cadrée au niveau des épaules.",
    },
    {
      q: `Le CV ${BRAND.name} est-il gratuit ?`,
      a: "Vous créez votre CV gratuitement avec l'assistant IA et vous voyez l'aperçu. Le téléchargement en PDF et les modèles Premium sont inclus dans les abonnements, payables par Orange Money.",
    },
  ];

  return (
    <div className="container-page space-y-14 py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Créer un CV à ${c.name}`,
          url: `${base}${path}`,
          inLanguage: "fr-BF",
          about: { "@type": "City", name: c.name, containedInPlace: { "@type": "Country", name: "Burkina Faso" } },
          isPartOf: { "@type": "WebSite", name: BRAND.name, url: base },
        }}
      />

      <div className="space-y-6">
        <Breadcrumbs items={[{ name: "CV au Burkina Faso", path: "/cv-burkina-faso" }, { name: `CV à ${c.name}`, path }]} />
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight sm:text-5xl">Créer un CV à {c.name}</h1>
            <p className="mt-4 text-lg text-muted">{intro}</p>
            {c.note && <p className="mt-3 text-muted">{c.note}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription?suivant=%2Fcv" className="btn-primary h-12 px-6">
                <Sparkles aria-hidden className="size-4" /> Créer mon CV gratuitement
              </Link>
              <Link href="/modele-cv-burkina-faso" className="btn-secondary h-12 px-6">Voir les modèles</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs" aria-hidden>
            <CvPreview cv={sample.cv} photoUrl={sample.photo} />
          </div>
        </div>
      </div>

      <section aria-labelledby="secteurs" className="space-y-5">
        <div>
          <h2 id="secteurs" className="text-2xl font-bold">Les secteurs qui recrutent à {c.name}</h2>
          <p className="mt-1 text-muted">Pour chacun, ce que les recruteurs veulent voir sur votre CV.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => (
            <li key={s.key} className="card p-5">
              <h3 className="font-semibold">{s.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.tip}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="langues" className="card space-y-3 p-6">
          <h2 id="langues" className="flex items-center gap-2 text-xl font-bold"><Languages aria-hidden className="size-5 text-brand-600" /> Les langues à mettre sur votre CV</h2>
          <p className="text-sm leading-relaxed text-muted">
            À {c.name}, parler les langues locales est un vrai atout pour les postes au contact du public : commerce, banque, santé,
            projets de terrain. En plus du français, pensez à indiquer <strong className="text-ink">{languageList(c)}</strong> si vous les
            parlez{english ? ", ainsi que l'anglais, très apprécié ici" : ""}.
          </p>
          <p className="text-sm text-muted">Précisez votre niveau : langue maternelle, courant, intermédiaire ou notions.</p>
        </section>
        <section aria-labelledby="etudiants" className="card space-y-3 p-6">
          <h2 id="etudiants" className="flex items-center gap-2 text-xl font-bold"><GraduationCap aria-hidden className="size-5 text-brand-600" /> Premier emploi et stage</h2>
          <p className="text-sm leading-relaxed text-muted">
            {c.schools.length
              ? `Étudiants et jeunes diplômés de ${c.schools.join(", ")} : `
              : `Jeunes diplômés de ${c.name} : `}
            placez votre formation en premier, détaillez vos stages et votre mémoire, et ajoutez vos engagements associatifs. Un profil
            de trois lignes qui explique ce que vous recherchez fait souvent la différence.
          </p>
          <Link href="/exemple-cv-burkina-faso" className="text-sm font-semibold text-brand-700 hover:underline">Voir des exemples de CV par métier →</Link>
        </section>
      </div>

      <section aria-labelledby="etapes" className="space-y-5">
        <h2 id="etapes" className="text-2xl font-bold">Votre CV en 3 étapes</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: PenLine, title: "Décrivez votre parcours", text: "Quelques phrases suffisent, ou collez votre ancien CV." },
            { icon: Wand2, title: "L'IA rédige votre CV", text: "Profil, expériences et compétences, reformulés et structurés." },
            { icon: Download, title: "Téléchargez en PDF", text: "Choisissez un modèle avec photo et envoyez votre CV." },
          ].map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                <s.icon aria-hidden className="size-5 text-brand-600" />
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Faq items={faq} title={`Questions fréquentes : CV à ${c.name}`} />
      <CityGrid title={`Créer un CV près de ${c.name}`} cities={related} />
      <p className="text-sm text-muted">
        Consultez aussi notre <Link href="/cv-burkina-faso" className="text-brand-700 underline">guide complet pour créer un CV au Burkina Faso</Link>.
      </p>
      <SeoCta title={`Créez votre CV pour postuler à ${c.name}`} text="Décrivez votre parcours, l'IA rédige votre CV professionnel. Choisissez un modèle, ajoutez votre photo, c'est prêt." />
    </div>
  );
}
