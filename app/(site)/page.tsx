import { Check, Crown, Download, FileText, PenLine, Sparkles, Star, Wand2 } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { AI_DAILY_LIMIT, FREE_CV_LIMIT } from "@/lib/constants";
import { getTemplateCatalog } from "@/lib/template-catalog";
import { sampleFor } from "@/lib/sample-cvs";
import { CvPreview } from "@/components/cv-preview";
import { PlanCard } from "@/components/plan-card";
import { TemplateCard } from "@/components/template-card";
import { TIP_SUMMARY_COLUMNS, TipCard, type TipSummary } from "@/components/tip-card";

const STEPS = [
  { icon: PenLine, title: "Décrivez votre parcours", text: "Quelques phrases suffisent, ou collez votre ancien CV." },
  { icon: Wand2, title: "L'IA rédige votre CV", text: "Résumé, expériences, compétences : tout est structuré et reformulé." },
  { icon: Download, title: "Téléchargez en PDF", text: "Choisissez un modèle professionnel, une couleur, et envoyez votre CV." },
];

const AI_FEATURES = [
  { title: "Remplissage automatique", text: "L'IA transforme votre description en CV complet, section par section." },
  { title: "Résumé percutant", text: "Un profil de 3 à 4 phrases qui donne envie de vous rencontrer." },
  { title: "Expériences reformulées", text: "Des puces claires, avec des verbes d'action et vos résultats." },
  { title: "Compétences suggérées", text: "Les mots-clés que les recruteurs recherchent pour votre métier." },
  { title: "Relecture notée", text: "Une note sur 100 et des conseils concrets pour améliorer votre CV." },
  { title: "Honnête", text: "L'IA n'invente jamais d'employeur, de diplôme ni de chiffre." },
];

/** Modèles mis en avant dans l'en-tête (au centre, à gauche, à droite). */
const HERO = [sampleFor("executif"), sampleFor("horizon"), sampleFor("creatif")];

/** Modèles présentés sur l'accueil, après les derniers modèles IA publiés (la galerie complète est sur /modeles). */
const FEATURED = ["moderne", "executif", "horizon", "prestige", "parcours", "mosaique", "elegance", "corporate"];

const FAQ = [
  { q: "Est-ce vraiment gratuit ?", a: `Oui : vous créez ${FREE_CV_LIMIT} CV gratuitement, avec l'assistant IA. Le téléchargement en PDF est réservé aux abonnés.` },
  { q: "Comment payer ?", a: "Par Orange Money : vous envoyez le montant du plan choisi, puis saisissez l'ID de la transaction. Votre abonnement est activé après vérification." },
  { q: "L'IA peut-elle inventer des informations ?", a: "Non. Elle reformule et structure ce que vous lui donnez ; quand un chiffre manque, elle écrit « [à préciser] » pour que vous le complétiez." },
  { q: "Mon CV sera-t-il lisible par les logiciels de recrutement ?", a: "Oui : le PDF contient du vrai texte, sélectionnable, dans une mise en page sobre au format A4." },
  { q: "Puis-je avoir plusieurs CV ?", a: "Oui, avec un abonnement : un CV par type de poste visé, jusqu'à 8 selon le plan." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [user, plans, catalog, { data: tips }] = await Promise.all([
    getCurrentUser(),
    getAvailablePlans(),
    getTemplateCatalog(),
    supabase
      .from("tips")
      .select(TIP_SUMMARY_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3)
      .returns<TipSummary[]>(),
  ]);
  const start = user ? "/cv" : "/inscription?suivant=%2Fcv";
  const premiumCount = catalog.filter((t) => t.premium).length;
  const featured = [
    ...catalog.filter((t) => t.custom).slice(0, 2),
    ...FEATURED.map((v) => catalog.find((t) => t.value === v)).filter((t) => t !== undefined),
  ].slice(0, 8);

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-cream">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              <Sparkles aria-hidden className="size-3.5" /> Propulsé par l&apos;IA
            </span>
            <h1 className="mt-4 text-[2rem] leading-tight font-bold tracking-tight sm:text-5xl">
              Votre CV professionnel, prêt en quelques minutes.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg lg:mx-0">
              Décrivez votre parcours : l&apos;assistant IA rédige votre CV, vous choisissez un modèle soigné et vous le
              téléchargez en PDF.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={start} className="btn-primary w-full py-3 text-base sm:w-auto sm:px-6">
                <Sparkles aria-hidden className="size-4" /> Créer mon CV gratuitement
              </Link>
              <Link href="/modeles" className="btn-secondary w-full py-3 text-base sm:w-auto sm:px-6">Voir les modèles</Link>
            </div>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted lg:justify-start">
              <span className="inline-flex items-center gap-1"><Check aria-hidden className="size-3.5 text-brand-600" /> {FREE_CV_LIMIT} CV gratuit</span>
              <span className="inline-flex items-center gap-1"><Check aria-hidden className="size-3.5 text-brand-600" /> Assistant IA inclus</span>
              <span className="inline-flex items-center gap-1"><Check aria-hidden className="size-3.5 text-brand-600" /> Sans carte bancaire</span>
            </p>
          </div>

          {/* Aperçu : CV d'exemple en éventail */}
          <div className="relative mx-auto h-[380px] w-full max-w-[420px] sm:h-[460px]" aria-hidden>
            <div className="absolute top-8 left-0 w-[58%] -rotate-6 opacity-90">
              <CvPreview cv={HERO[1].cv} photoUrl={HERO[1].photo} />
            </div>
            <div className="absolute top-8 right-0 w-[58%] rotate-6 opacity-90">
              <CvPreview cv={HERO[2].cv} photoUrl={HERO[2].photo} />
            </div>
            <div className="absolute top-0 left-1/2 w-[64%] -translate-x-1/2">
              <CvPreview cv={HERO[0].cv} photoUrl={HERO[0].photo} />
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="container-page scroll-mt-20 py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Comment ça marche</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                <s.icon aria-hidden className="size-5 text-brand-600" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Assistant IA */}
      <section className="bg-linear-to-br from-violet-50 to-fuchsia-50 py-14 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700"><Sparkles aria-hidden className="size-4" /> L&apos;assistant IA</span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Un conseiller carrière à vos côtés, à chaque étape</h2>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AI_FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl border border-violet-100 bg-white p-5">
                <h3 className="flex items-center gap-2 font-semibold"><Star aria-hidden className="size-4 fill-violet-500 text-violet-500" /> {f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Modèles */}
      <section id="modeles" className="container-page scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-star-400">
            <Crown aria-hidden className="size-3.5" /> {premiumCount} modèles Premium
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{catalog.length} modèles professionnels, 7 couleurs</h2>
          <p className="mt-2 text-muted">
            Conçus pour chaque métier, au format A4, lisibles par les recruteurs comme par les logiciels de recrutement.
            {" "}{catalog.length - premiumCount} modèles gratuits, les autres inclus dans les abonnements.
          </p>
        </div>
        <ul className="-mx-4 mt-8 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featured.map((t) => (
            <li key={t.value} className="w-[70%] shrink-0 snap-start sm:w-auto">
              <TemplateCard template={t} />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/modeles" className="btn-primary w-full py-3 sm:w-auto sm:px-6">Voir les {catalog.length} modèles</Link>
          <Link href={start} className="btn-secondary w-full py-3 sm:w-auto sm:px-6">Créer mon CV</Link>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-surface py-14 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Des tarifs simples</h2>
            <p className="mt-2 text-muted">Mensuel, sans engagement. Paiement par Orange Money.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card flex flex-col gap-4 p-6">
              <h3 className="font-bold">Gratuit</h3>
              <p><span className="text-3xl font-bold">0</span> <span className="text-sm text-muted">FCFA</span></p>
              <ul className="flex-1 space-y-2 text-sm">
                {[`${FREE_CV_LIMIT} CV`, `Assistant IA (${AI_DAILY_LIMIT.free} demandes / jour)`, `${catalog.length - premiumCount} modèles gratuits et 7 couleurs`, "Aperçu en ligne"].map((f) => (
                  <li key={f} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />{f}</li>
                ))}
                <li className="flex gap-2 text-muted"><FileText aria-hidden className="mt-0.5 size-4 shrink-0" />Téléchargement PDF réservé aux abonnés</li>
              </ul>
              <Link href={start} className="btn-secondary w-full">Commencer</Link>
            </div>
            {plans.slice(0, 3).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                href={user ? `/paiement?plan=${plan.id}` : `/inscription?suivant=${encodeURIComponent(`/paiement?plan=${plan.id}`)}`}
                current={user?.subscription?.isActive && user.subscription.plan_id === plan.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-14 sm:py-20">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-2">
          {FAQ.map((item) => (
            <details key={item.q} className="card group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Astuces */}
      {tips?.length ? (
        <section className="container-page pb-14 sm:pb-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold sm:text-2xl">Conseils pour votre CV</h2>
            <Link href="/astuces" className="text-sm font-semibold text-brand-700 hover:underline">Toutes les astuces →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {tips.map((tip) => <TipCard key={tip.id} tip={tip} />)}
          </div>
        </section>
      ) : null}

      {/* Appel final */}
      <section className="bg-ink text-white">
        <div className="container-page flex flex-col items-center gap-5 py-14 text-center">
          <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">Prêt à créer le CV qui vous ouvrira des portes ?</h2>
          <Link href={start} className="btn w-full bg-star-400 py-3 text-base text-ink hover:bg-star-400/90 sm:w-auto sm:px-8">
            <Sparkles aria-hidden className="size-4" /> Créer mon CV avec {BRAND.name}
          </Link>
        </div>
      </section>
    </>
  );
}
