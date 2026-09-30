import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getFavoriteIds, getMinPrice } from "@/lib/queries";
import { formatNumber } from "@/lib/format";
import { JobSearchForm } from "@/components/job-search-form";
import { JOB_SUMMARY_COLUMNS, JobCard, type JobSummary } from "@/components/job-card";
import { TIP_SUMMARY_COLUMNS, TipCard, type TipSummary } from "@/components/tip-card";

const STEPS = [
  { title: "Recherchez", text: "Parcourez les offres par métier, ville ou catégorie." },
  { title: "Consultez l'aperçu", text: "Découvrez le poste, l'entreprise et les compétences attendues." },
  { title: "Abonnez-vous", text: "Débloquez les offres complètes dès quelques centaines de FCFA par mois." },
  { title: "Postulez", text: "Envoyez votre CV en ligne et suivez vos candidatures." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const [user, categories, minPrice, { data: jobs }, { data: tips }] = await Promise.all([
    getCurrentUser(),
    getCategories(),
    getMinPrice(),
    supabase
      .from("jobs")
      .select(JOB_SUMMARY_COLUMNS)
      .order("published_at", { ascending: false })
      .limit(6)
      .returns<JobSummary[]>(),
    supabase
      .from("tips")
      .select(TIP_SUMMARY_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3)
      .returns<TipSummary[]>(),
  ]);
  const favorites = await getFavoriteIds(user?.id);

  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="container-page flex flex-col items-center py-16 text-center sm:py-20">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Votre prochain emploi est peut-être ici.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Découvrez des offres d&apos;emploi et de stage au Burkina Faso et trouvez l&apos;opportunité qui vous correspond.
          </p>
          <div className="mt-8 w-full max-w-3xl">
            <JobSearchForm />
          </div>
          {categories.length > 0 && (
            <ul className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Catégories">
              {categories.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/offres?categorie=${c.slug}`} className="chip hover:border-ink">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Offres récentes */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Offres récentes</h2>
          <Link href="/offres" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Voir toutes <ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        {jobs?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} layout="grid" isFavorite={favorites.has(job.id)} />
            ))}
          </div>
        ) : (
          <p className="card p-8 text-center text-muted">Aucune offre pour le moment.</p>
        )}
      </section>

      {/* Bandeau abonnement */}
      {!user?.isSubscribed && minPrice !== null && (
        <section className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-cream p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-lg font-bold">Abonnements dès {formatNumber(minPrice)} FCFA / mois</p>
              <p className="text-sm text-muted">Débloquez les offres complètes et postulez.</p>
            </div>
            <Link href="/abonnements" className="btn-secondary">Voir les abonnements</Link>
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="container-page scroll-mt-20 py-14">
        <h2 className="mb-6 text-2xl font-bold">Comment ça marche</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-5">
              <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Astuces */}
      {tips?.length ? (
        <section className="bg-surface py-14">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold">Astuces pour votre recherche</h2>
              <Link href="/astuces" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Toutes les astuces <ArrowRight aria-hidden className="size-4" /></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {tips.map((tip) => <TipCard key={tip.id} tip={tip} />)}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
