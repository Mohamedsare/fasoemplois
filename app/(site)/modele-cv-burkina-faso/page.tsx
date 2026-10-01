import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/supabase/env";
import { BUILTIN_CATALOG } from "@/lib/template-catalog";
import { TemplateCard } from "@/components/template-card";
import { Breadcrumbs, CityGrid, Faq, JsonLd, Prose, SeoCta } from "@/components/seo";
import { CITIES_BF } from "@/lib/seo-burkina";

const PATH = "/modele-cv-burkina-faso";
const TITLE = "Modèle de CV Burkina Faso : modèles professionnels gratuits et Premium";
const DESCRIPTION =
  "Modèles de CV A4 pour le Burkina Faso : fonction publique, banque, ONG, santé, numérique. Avec photo, remplis par l'IA, en PDF.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, locale: "fr_BF" },
};

/** Quel modèle pour quel secteur (valeurs = identifiants des modèles du code). */
const BY_SECTOR: { sector: string; why: string; templates: string[] }[] = [
  { sector: "Fonction publique et administration", why: "Sobriété, lecture chronologique, diplômes bien visibles.", templates: ["classique", "corporate"] },
  { sector: "Banque, assurance, microfinance", why: "Structure rigoureuse et résultats chiffrés mis en avant.", templates: ["corporate", "executif"] },
  { sector: "ONG et projets de développement", why: "Frise des missions, projets et bailleurs faciles à suivre.", templates: ["parcours", "moderne"] },
  { sector: "Direction et cadres supérieurs", why: "Allure haut de gamme et colonne de compétences clés.", templates: ["executif", "prestige"] },
  { sector: "Droit, juridique, notariat", why: "Typographie élégante à empattements, mise en page centrée.", templates: ["elegance", "classique"] },
  { sector: "Santé", why: "Dense et clair : services, stages et formations continues.", templates: ["compact", "classique"] },
  { sector: "Numérique, télécoms, informatique", why: "Moderne, compétences techniques en étiquettes, lien vers vos réalisations.", templates: ["epure", "mosaique"] },
  { sector: "Marketing, communication, design", why: "Visuel et coloré, pour montrer votre créativité.", templates: ["horizon", "creatif"] },
  { sector: "BTP, mines, ingénierie", why: "Chantiers et missions présentés comme une frise chronologique.", templates: ["parcours", "compact"] },
  { sector: "Premier emploi et stage", why: "Simple, aéré, met en valeur formation et stages.", templates: ["moderne", "epure"] },
];

const FAQ = [
  {
    q: "Quel est le meilleur modèle de CV au Burkina Faso ?",
    a: "Il n'y a pas un modèle unique : un CV sobre et chronologique convient à l'administration et à la banque, un modèle avec frise chronologique aux ONG et à l'ingénierie, un modèle plus visuel aux métiers de la communication. Dans tous les cas, la lisibilité compte plus que la décoration.",
  },
  {
    q: "Les modèles sont-ils gratuits ?",
    a: `Plusieurs modèles sont gratuits et vous pouvez essayer tous les modèles dans l'éditeur. Les modèles Premium et le téléchargement en PDF sont inclus dans les abonnements ${BRAND.name}, payables par Orange Money.`,
  },
  {
    q: "Puis-je obtenir mon CV au format Word ?",
    a: "Le CV est téléchargé au format PDF, le format attendu par les recruteurs : la mise en page reste identique sur tous les ordinateurs et téléphones, et le texte reste lisible par les logiciels de recrutement. Vous pouvez modifier votre CV en ligne à tout moment.",
  },
  {
    q: "Peut-on changer de modèle après avoir rempli son CV ?",
    a: "Oui. Le contenu est séparé de la mise en page : vous changez de modèle et de couleur en un clic, sans rien ressaisir.",
  },
];

export default function ModeleCvBurkinaPage() {
  const base = siteUrl();
  const label = (v: string) => BUILTIN_CATALOG.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="container-page space-y-14 py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "fr-BF",
          url: `${base}${PATH}`,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: BUILTIN_CATALOG.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: `Modèle de CV ${t.label}`, url: `${base}/modeles` })),
          },
        }}
      />

      <div className="space-y-6">
        <Breadcrumbs items={[{ name: "CV au Burkina Faso", path: "/cv-burkina-faso" }, { name: "Modèles de CV", path: PATH }]} />
        <div className="max-w-3xl">
          <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight sm:text-5xl">Modèle de CV Burkina Faso</h1>
          <p className="mt-4 text-lg text-muted">
            Des modèles de CV professionnels au format A4, pensés pour les recruteurs burkinabè : administration, banque, ONG, santé,
            numérique… Avec photo, en couleur, remplis par l&apos;intelligence artificielle et prêts à télécharger en PDF.
          </p>
        </div>
      </div>

      <section aria-labelledby="galerie" className="space-y-5">
        <h2 id="galerie" className="text-2xl font-bold">Les modèles</h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {BUILTIN_CATALOG.map((t) => (
            <li key={t.value}>
              <TemplateCard template={t}>
                <Link href="/inscription?suivant=%2Fmodeles" className="btn-secondary w-full">Utiliser</Link>
              </TemplateCard>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          De nouveaux modèles sont ajoutés régulièrement : retrouvez-les tous dans la <Link href="/modeles" className="text-brand-700 underline">galerie</Link>.
        </p>
      </section>

      <section aria-labelledby="secteurs" className="space-y-5">
        <h2 id="secteurs" className="text-2xl font-bold">Quel modèle de CV choisir selon votre secteur ?</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-line bg-surface/60 text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Secteur</th>
                <th className="px-4 py-3 font-medium">Modèles conseillés</th>
                <th className="px-4 py-3 font-medium">Pourquoi</th>
              </tr>
            </thead>
            <tbody>
              {BY_SECTOR.map((r) => (
                <tr key={r.sector} className="block border-b border-line px-4 py-3 last:border-0 sm:table-row sm:p-0">
                  <th scope="row" className="block text-left font-semibold sm:table-cell sm:px-4 sm:py-3">{r.sector}</th>
                  <td className="block py-1 text-brand-700 sm:table-cell sm:px-4 sm:py-3">{r.templates.map(label).join(" · ")}</td>
                  <td className="block text-muted sm:table-cell sm:px-4 sm:py-3">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Prose>
        <h2>Ce qui fait un bon modèle de CV</h2>
        <p>
          Un bon modèle met votre parcours en valeur sans le cacher derrière la décoration. Au Burkina Faso, les recruteurs reçoivent de
          nombreux CV par offre : ils lisent d&apos;abord le <strong>titre du poste</strong>, la <strong>dernière expérience</strong> et
          les <strong>diplômes</strong>. Nos modèles placent ces informations là où l&apos;œil les cherche, avec une seule couleur
          d&apos;accent et une typographie lisible, à l&apos;écran comme à l&apos;impression.
        </p>
        <p>
          Tous les modèles produisent un vrai PDF : le texte reste sélectionnable et lisible par les logiciels de tri des candidatures
          utilisés par les grandes entreprises et les organisations internationales.
        </p>
        <h2>Remplir son modèle avec l&apos;aide de l&apos;IA</h2>
        <p>
          Plus besoin de partir d&apos;une page blanche : décrivez votre parcours en quelques phrases, l&apos;assistant {BRAND.name} remplit
          le modèle, reformule vos expériences avec des verbes d&apos;action et propose les compétences attendues dans votre métier.
          Pour vous inspirer, consultez aussi nos <Link href="/exemple-cv-burkina-faso" className="text-brand-700 underline">exemples de CV par métier</Link> et
          notre <Link href="/cv-burkina-faso" className="text-brand-700 underline">guide pour créer un CV au Burkina Faso</Link>.
        </p>
      </Prose>

      <Faq items={FAQ} />
      <CityGrid title="Modèles de CV dans votre ville" cities={CITIES_BF.filter((c) => c.major)} />
      <SeoCta title="Choisissez votre modèle et créez votre CV" text="Plusieurs modèles gratuits, des modèles Premium, 7 couleurs et l'assistant IA pour rédiger le contenu." />
    </div>
  );
}
