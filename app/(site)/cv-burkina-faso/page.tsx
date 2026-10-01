import { Check, Sparkles, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/supabase/env";
import { sampleFor } from "@/lib/sample-cvs";
import { CITIES_BF, cityPath } from "@/lib/seo-burkina";
import { CvPreview } from "@/components/cv-preview";
import { Breadcrumbs, CityGrid, Faq, JsonLd, Prose, SeoCta } from "@/components/seo";

const PATH = "/cv-burkina-faso";
const TITLE = "Créer un CV au Burkina Faso : guide complet, modèles et exemples (2026)";
const DESCRIPTION =
  "Comment faire un bon CV au Burkina Faso : format, rubriques, photo, langues, fonction publique et ONG. Créez votre CV gratuitement avec l'IA.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: "article", locale: "fr_BF" },
};

const FAQ = [
  {
    q: "Faut-il mettre une photo sur un CV au Burkina Faso ?",
    a: "Oui, c'est l'usage et la plupart des recruteurs burkinabè l'attendent. Choisissez une photo récente, cadrée au niveau des épaules, sur fond neutre, avec une tenue professionnelle. Évitez les photos de soirée ou recadrées d'une photo de groupe.",
  },
  {
    q: "Combien de pages doit faire un CV ?",
    a: "Une page pour un jeune diplômé ou un profil de moins de cinq ans d'expérience, deux pages au maximum pour un profil expérimenté. Les recruteurs reçoivent beaucoup de candidatures : un CV court et clair est lu en entier.",
  },
  {
    q: "Quel est le format de CV pour la fonction publique au Burkina Faso ?",
    a: "Les concours de la fonction publique demandent surtout un dossier (diplômes légalisés, acte de naissance, certificat de nationalité…). Quand un CV est demandé, préférez un modèle classique et chronologique, avec les intitulés exacts et les dates d'obtention de vos diplômes.",
  },
  {
    q: "Faut-il indiquer les langues nationales sur son CV ?",
    a: "Oui. Le mooré, le dioula, le fulfuldé, le gulmancéma ou le bissa sont de vrais atouts pour les postes au contact du public : commerce, banque, santé, ONG, projets de terrain. Indiquez votre niveau pour chaque langue.",
  },
  {
    q: "Comment faire un CV quand on n'a pas d'expérience ?",
    a: "Mettez en avant vos stages, votre mémoire de fin d'études, vos activités associatives, le bénévolat et les petits boulots. Un résumé de profil de trois lignes qui explique ce que vous recherchez aide aussi beaucoup.",
  },
  {
    q: `${BRAND.name} est-il gratuit ?`,
    a: `Oui : vous créez un CV gratuitement avec l'assistant IA et vous voyez l'aperçu. Le téléchargement en PDF, les modèles Premium et plusieurs CV sont inclus dans les abonnements, payables par Orange Money.`,
  },
];

const DO = [
  "Un titre clair qui reprend le poste visé (ex. « Comptable · SYSCOHADA »)",
  "Un numéro joignable au format +226 et une adresse e-mail professionnelle",
  "Des expériences de la plus récente à la plus ancienne, avec des résultats chiffrés",
  "Les logiciels utilisés localement : Sage, SYSCOHADA, Excel, KoboToolbox…",
  "Vos langues nationales et étrangères, avec le niveau",
];

const DONT = [
  "Une adresse e-mail fantaisiste ou celle d'un proche",
  "Des fautes d'orthographe : faites relire votre CV",
  "Des informations inventées : elles sont vérifiées en entretien",
  "Un CV de quatre pages qui raconte tout votre parcours",
  "Une photo floue, de groupe ou en tenue de soirée",
];

export default function CvBurkinaPage() {
  const sample = sampleFor("classique");
  const base = siteUrl();

  return (
    <article className="container-page space-y-14 py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          inLanguage: "fr-BF",
          mainEntityOfPage: `${base}${PATH}`,
          author: { "@type": "Organization", name: BRAND.name, url: base },
          publisher: { "@type": "Organization", name: BRAND.name, url: base },
          datePublished: "2026-10-01",
          dateModified: "2026-10-01",
          about: { "@type": "Country", name: "Burkina Faso" },
        }}
      />

      <div className="space-y-6">
        <Breadcrumbs items={[{ name: "CV au Burkina Faso", path: PATH }]} />
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight sm:text-5xl">Créer un CV au Burkina Faso</h1>
            <p className="mt-4 text-lg text-muted">
              Le guide complet pour faire un CV qui plaît aux recruteurs burkinabè : format, rubriques, photo, langues, CV pour la
              fonction publique et les ONG. Et un outil gratuit pour le créer en quelques minutes avec l&apos;intelligence artificielle.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription?suivant=%2Fcv" className="btn-primary h-12 px-6">
                <Sparkles aria-hidden className="size-4" /> Créer mon CV gratuitement
              </Link>
              <Link href="/exemple-cv-burkina-faso" className="btn-secondary h-12 px-6">Voir des exemples de CV</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm" aria-hidden>
            <CvPreview cv={sample.cv} photoUrl={sample.photo} />
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Prose>
          <h2>Ce que les recruteurs burkinabè regardent en premier</h2>
          <p>
            À Ouagadougou comme à Bobo-Dioulasso, un recruteur passe en moyenne moins d&apos;une minute sur un CV. Il cherche trois
            choses : le poste que vous visez, votre dernière expérience et vos diplômes. Tout ce qui l&apos;aide à trouver ces informations
            rapidement joue en votre faveur ; tout ce qui le ralentit (mise en page chargée, fautes, informations dispersées) vous pénalise.
          </p>
          <p>
            Au Burkina Faso, l&apos;usage reste proche du CV francophone classique : <strong>photo</strong>, <strong>coordonnées complètes</strong>,
            parcours <strong>chronologique</strong> et une ou deux pages au maximum. Les entreprises internationales, les mines et les
            ONG apprécient en plus un CV orienté résultats et, souvent, une version en anglais.
          </p>

          <h2>Les rubriques indispensables</h2>
          <ol>
            <li><strong>L&apos;en-tête</strong> : nom et prénom, titre du poste visé, téléphone (+226), e-mail, ville. Une photo professionnelle.</li>
            <li><strong>Le profil</strong> : trois à quatre phrases sur ce que vous savez faire et ce que vous recherchez.</li>
            <li><strong>Les expériences professionnelles</strong> : poste, structure, dates, puis trois à cinq réalisations avec des verbes d&apos;action.</li>
            <li><strong>La formation</strong> : diplômes, établissements et années d&apos;obtention (Université Joseph Ki-Zerbo, Université Nazi Boni, 2iE…).</li>
            <li><strong>Les compétences</strong> : techniques (logiciels, normes) et personnelles, regroupées par catégorie.</li>
            <li><strong>Les langues</strong> : français, langues nationales et langues étrangères, avec votre niveau.</li>
            <li><strong>Les centres d&apos;intérêt</strong> : facultatifs, mais utiles s&apos;ils disent quelque chose de vous (bénévolat, sport, associations).</li>
          </ol>

          <h2>Adapter son CV au type de recruteur</h2>
          <h3>Pour la fonction publique et les concours</h3>
          <p>
            Les concours directs et professionnels reposent surtout sur un dossier administratif. Lorsque l&apos;administration ou un projet
            public demande un CV, choisissez un modèle <Link href="/modele-cv-burkina-faso" className="text-brand-700 underline">sobre et classique</Link>,
            indiquez les intitulés exacts de vos diplômes et vos dates, et soignez l&apos;orthographe : la rigueur est jugée dès la lecture.
          </p>
          <h3>Pour les ONG et les organisations internationales</h3>
          <p>
            Les ONG recrutent beaucoup à Ouagadougou, Fada N&apos;Gourma, Kaya, Dori ou Ouahigouya. Elles attendent des réalisations précises :
            projets suivis, budget, nombre de bénéficiaires, bailleurs, outils de suivi-évaluation. Une version anglaise de votre CV est
            souvent demandée pour les postes de coordination.
          </p>
          <h3>Pour les banques, les télécoms et les grandes entreprises</h3>
          <p>
            Ces recruteurs aiment les CV structurés et chiffrés : objectifs atteints, portefeuille géré, projets livrés. Un modèle moderne
            et épuré, avec une colonne de compétences, met bien en valeur ce type de profil.
          </p>
          <h3>Pour un premier emploi ou un stage</h3>
          <p>
            Placez la formation avant l&apos;expérience, détaillez vos stages et votre mémoire, et ajoutez vos engagements associatifs. Un
            profil de trois lignes qui explique votre objectif fait souvent la différence.
          </p>

          <h2>Les erreurs à éviter</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="mb-3 font-semibold text-brand-700">À faire</p>
              <ul className="space-y-2 text-sm">
                {DO.map((d) => <li key={d} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />{d}</li>)}
              </ul>
            </div>
            <div className="card p-5">
              <p className="mb-3 font-semibold text-accent-600">À éviter</p>
              <ul className="space-y-2 text-sm">
                {DONT.map((d) => <li key={d} className="flex gap-2"><X aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-600" />{d}</li>)}
              </ul>
            </div>
          </div>

          <h2>Créer son CV en ligne en quelques minutes</h2>
          <p>
            Avec {BRAND.name}, vous décrivez votre parcours en quelques phrases : l&apos;assistant IA rédige votre profil, reformule vos
            expériences et suggère les compétences recherchées dans votre métier. Il n&apos;invente jamais d&apos;employeur, de diplôme ni
            de chiffre. Vous choisissez ensuite parmi des <Link href="/modeles" className="text-brand-700 underline">modèles professionnels</Link>,
            ajoutez votre photo et téléchargez votre CV en PDF, prêt à être envoyé.
          </p>
          <p>
            Besoin d&apos;inspiration ? Consultez nos <Link href="/exemple-cv-burkina-faso" className="text-brand-700 underline">exemples de CV par métier</Link> :
            comptable, chargé de projet, développeur, juriste, médecin, ingénieur BTP…
          </p>
        </Prose>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Pages liées" className="card space-y-3 p-5 text-sm">
            <p className="font-semibold">À lire aussi</p>
            <ul className="space-y-2">
              <li><Link href="/modele-cv-burkina-faso" className="text-brand-700 hover:underline">Modèles de CV pour le Burkina Faso</Link></li>
              <li><Link href="/exemple-cv-burkina-faso" className="text-brand-700 hover:underline">Exemples de CV par métier</Link></li>
              <li><Link href="/astuces" className="text-brand-700 hover:underline">Conseils pour votre candidature</Link></li>
            </ul>
          </nav>
          <div className="card space-y-3 p-5 text-sm">
            <p className="font-semibold">Grandes villes</p>
            <ul className="space-y-2">
              {CITIES_BF.filter((c) => c.major).map((c) => (
                <li key={c.slug}><Link href={cityPath(c)} className="text-brand-700 hover:underline">Créer un CV à {c.name}</Link></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <Faq items={FAQ} />
      <CityGrid title="Créer son CV dans votre ville" />
      <SeoCta title="Votre CV professionnel, prêt en quelques minutes" text="Décrivez votre parcours, l'IA rédige votre CV. Choisissez un modèle, ajoutez votre photo, c'est prêt." />
    </article>
  );
}
