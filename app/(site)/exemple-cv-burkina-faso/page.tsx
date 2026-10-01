import { Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/supabase/env";
import { SAMPLE_CVS, sampleId } from "@/lib/sample-cvs";
import { CvPreview } from "@/components/cv-preview";
import { Breadcrumbs, CityGrid, Faq, JsonLd, SeoCta } from "@/components/seo";
import { CITIES_BF } from "@/lib/seo-burkina";

const PATH = "/exemple-cv-burkina-faso";
const TITLE = "Exemples de CV au Burkina Faso par métier (comptable, ONG, banque, santé…)";
const DESCRIPTION =
  "12 exemples de CV pour le Burkina Faso : comptable, chargé de projet, développeur, juriste, médecin, BTP, banque… et les compétences clés.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, locale: "fr_BF" },
};

/** Commentaires des exemples (personnes fictives de lib/sample-cvs.ts). */
const NOTES: Record<string, { job: string; anchor: string; points: string[]; keywords: string[] }> = {
  awa: {
    job: "comptable",
    anchor: "comptable",
    points: ["Le titre annonce le métier et la norme maîtrisée (SYSCOHADA).", "Les réalisations sont chiffrées : 40 PME suivies, clôtures en 5 jours.", "Les logiciels utilisés localement (Sage) figurent en compétences."],
    keywords: ["SYSCOHADA", "Sage", "Déclarations fiscales", "Rapprochements bancaires", "États financiers"],
  },
  issa: {
    job: "chargé de projet en développement rural",
    anchor: "charge-de-projet",
    points: ["Le budget et le nombre de coopératives donnent l'échelle du projet.", "Le suivi-évaluation et le reporting aux bailleurs sont explicites.", "Les compétences sont regroupées par catégorie : lecture rapide."],
    keywords: ["Cadre logique", "Suivi-évaluation", "Reporting bailleurs", "KoboToolbox", "Animation"],
  },
  mariam: {
    job: "développeuse web",
    anchor: "developpeur",
    points: ["Un lien vers les réalisations (GitHub) appuie les compétences.", "Les technologies sont listées clairement, sans jargon inutile.", "L'impact est mesuré : 20 000 clients, temps de chargement divisé par trois."],
    keywords: ["React", "Next.js", "TypeScript", "PostgreSQL", "Paiement mobile"],
  },
  boukary: {
    job: "directeur administratif et financier",
    anchor: "daf",
    points: ["Les montants pilotés montrent le niveau de responsabilité.", "Le parcours progresse logiquement : audit, contrôle de gestion, direction.", "Le diplôme d'expertise comptable est mis en certification."],
    keywords: ["Stratégie financière", "Levée de fonds", "Contrôle de gestion", "IFRS", "ERP"],
  },
  aminata: {
    job: "juriste d'affaires",
    anchor: "juriste",
    points: ["La spécialité (OHADA, contrats) apparaît dès le profil.", "Les missions sont concrètes : 30 opérations de sociétés accompagnées.", "Un modèle élégant et sobre, adapté aux métiers du droit."],
    keywords: ["Droit OHADA", "Droit des sociétés", "Contrats commerciaux", "Contentieux", "Conformité"],
  },
  salimata: {
    job: "responsable marketing digital",
    anchor: "marketing",
    points: ["Les résultats sont chiffrés : communauté multipliée par six.", "Les outils publicitaires et la certification Google Ads rassurent.", "Un modèle coloré qui reflète un métier créatif."],
    keywords: ["Stratégie digitale", "Meta Ads", "Google Ads", "Création de contenu", "Analyse de données"],
  },
  adama: {
    job: "ingénieur génie civil",
    anchor: "ingenieur-btp",
    points: ["Chaque chantier est décrit par son ouvrage, son montant et l'équipe encadrée.", "La sécurité (zéro accident) est un argument fort dans le BTP.", "La frise chronologique montre la progression de carrière."],
    keywords: ["Béton armé", "VRD", "AutoCAD", "MS Project", "Sécurité de chantier"],
  },
  rasmane: {
    job: "designer graphique",
    anchor: "designer",
    points: ["Le portfolio en ligne est mis en avant dès l'en-tête.", "Les projets variés (marques, festival, applications) montrent la polyvalence.", "Les logiciels sont présentés en étiquettes faciles à repérer."],
    keywords: ["Figma", "Illustrator", "Photoshop", "Identité visuelle", "UI design"],
  },
  fatimata: {
    job: "responsable des ressources humaines",
    anchor: "rh",
    points: ["L'effectif géré et le nombre de sites donnent la mesure du poste.", "La baisse du turnover est un résultat concret et rare sur un CV.", "La certification en droit du travail renforce la crédibilité."],
    keywords: ["Recrutement", "Gestion des talents", "Paie", "Droit du travail", "Formation"],
  },
  aicha: {
    job: "médecin",
    anchor: "medecin",
    points: ["Les services et le volume de consultations sont précisés.", "Les programmes de santé publique valorisent l'engagement.", "Un modèle compact qui tient sur une page malgré un parcours long."],
    keywords: ["Médecine générale", "Urgences", "Santé maternelle", "Échographie", "Santé publique"],
  },
  ibrahim: {
    job: "chargé de clientèle en banque",
    anchor: "banque",
    points: ["Le portefeuille et l'encours chiffrent la responsabilité.", "La croissance annuelle du produit net bancaire prouve les résultats.", "Les compétences sont groupées : banque, commercial, outils."],
    keywords: ["Analyse de crédit", "Financement des PME", "Prospection", "Conformité", "CRM"],
  },
  moussa: {
    job: "responsable logistique",
    anchor: "logistique",
    points: ["Entrepôts, flotte et fournisseurs donnent l'échelle des opérations.", "La réduction des ruptures de stock est un résultat mesurable.", "Les achats selon les procédures des bailleurs intéressent les ONG."],
    keywords: ["Supply chain", "Gestion des stocks", "Achats", "Transport", "Sage X3"],
  },
};

const FAQ = [
  {
    q: "Puis-je copier un exemple de CV ?",
    a: "Inspirez-vous de la structure et de la façon de présenter les réalisations, mais écrivez votre propre parcours : un recruteur repère vite un CV générique. L'assistant IA vous aide à reformuler vos vraies expériences.",
  },
  {
    q: "Ces exemples sont-ils de vraies personnes ?",
    a: "Non. Ce sont des profils fictifs, rédigés pour illustrer de bonnes pratiques adaptées au marché de l'emploi burkinabè.",
  },
  {
    q: "Comment adapter mon CV à chaque offre ?",
    a: `Reprenez les mots-clés de l'offre dans votre titre, votre profil et vos compétences, et mettez en premier les expériences les plus proches du poste. Avec un abonnement ${BRAND.name}, vous pouvez garder plusieurs CV, un par type de poste.`,
  },
];

export default function ExempleCvBurkinaPage() {
  const base = siteUrl();
  const examples = SAMPLE_CVS.map((s) => ({ ...s, id: sampleId(s), note: NOTES[sampleId(s)] })).filter((e) => e.note);

  return (
    <div className="container-page space-y-12 py-8 sm:py-12">
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
            itemListElement: examples.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: `Exemple de CV de ${e.note.job}`, url: `${base}${PATH}#${e.note.anchor}` })),
          },
        }}
      />

      <div className="space-y-6">
        <Breadcrumbs items={[{ name: "CV au Burkina Faso", path: "/cv-burkina-faso" }, { name: "Exemples de CV", path: PATH }]} />
        <div className="max-w-3xl">
          <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight sm:text-5xl">Exemples de CV au Burkina Faso</h1>
          <p className="mt-4 text-lg text-muted">
            {examples.length} exemples de CV rédigés pour le marché de l&apos;emploi burkinabè, du premier emploi au poste de direction. Pour
            chaque métier : ce qui rend le CV efficace et les compétences clés à citer.
          </p>
        </div>
        <nav aria-label="Métiers" className="flex flex-wrap gap-2">
          {examples.map((e) => (
            <a key={e.id} href={`#${e.note.anchor}`} className="chip min-h-9 px-3 text-sm capitalize">{e.note.job}</a>
          ))}
        </nav>
      </div>

      <div className="space-y-10">
        {examples.map((e, i) => (
          <section key={e.id} id={e.note.anchor} aria-labelledby={`h-${e.id}`} className="card scroll-mt-24 grid gap-6 overflow-hidden p-5 sm:p-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-10">
            <div className={`mx-auto w-full max-w-xs lg:max-w-none ${i % 2 ? "lg:order-2" : ""}`}>
              <CvPreview cv={e.cv} photoUrl={e.photo} />
            </div>
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Exemple {i + 1}</p>
                <h2 id={`h-${e.id}`} className="mt-1 text-2xl font-bold">Exemple de CV de {e.note.job}</h2>
                <p className="mt-1 text-sm text-muted">{e.cv.full_name} · {e.cv.headline} · {e.cv.city}</p>
              </div>
              <div>
                <h3 className="font-semibold">Pourquoi ce CV fonctionne</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {e.note.points.map((p) => (
                    <li key={p} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Compétences clés à citer</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {e.note.keywords.map((k) => <li key={k} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">{k}</li>)}
                </ul>
              </div>
              <Link href="/inscription?suivant=%2Fcv" className="btn-primary h-11 w-full sm:w-auto">
                <Sparkles aria-hidden className="size-4" /> Créer mon CV de {e.note.job}
              </Link>
            </div>
          </section>
        ))}
      </div>

      <p className="text-sm text-muted">
        Ces exemples utilisent nos <Link href="/modele-cv-burkina-faso" className="text-brand-700 underline">modèles de CV</Link>. Pour aller plus
        loin, lisez notre <Link href="/cv-burkina-faso" className="text-brand-700 underline">guide pour créer un CV au Burkina Faso</Link>.
      </p>

      <Faq items={FAQ} />
      <CityGrid title="Exemples et modèles de CV dans votre ville" cities={CITIES_BF.filter((c) => c.major)} />
      <SeoCta title="Votre CV, aussi efficace que ces exemples" text="Décrivez votre parcours : l'IA rédige un CV structuré et chiffré, dans le modèle de votre choix." />
    </div>
  );
}
