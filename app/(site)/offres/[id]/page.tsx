import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { getFavoriteIds, getMinPrice } from "@/lib/queries";
import { EXPERIENCE_LABELS, SECTION_LABELS, SECTION_ORDER } from "@/lib/constants";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { RichText } from "@/components/rich-text";
import { CompanyLogo, LockBadge } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { FavoriteButton } from "@/components/favorite-button";
import { JOB_SUMMARY_COLUMNS, jobMeta, type JobSummary } from "@/components/job-card";
import type { ApplicationStatus, Company, Job, JobSection, JobSectionKind } from "@/lib/types";
import { ShareButton } from "./share-button";

const UUID_RE = /^[0-9a-f-]{36}$/i;

type JobDetail = Job & { company: Company | null; category: { name: string; slug: string } | null };

const getJob = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*, company:companies(*), category:categories(name, slug)")
    .eq("id", id)
    .maybeSingle<JobDetail>();
  return data;
});

export async function generateMetadata(props: PageProps<"/offres/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getJob(id);
  return job
    ? { title: `${job.title} — ${job.company?.name ?? ""}`, description: job.summary.slice(0, 160) }
    : { title: "Offre introuvable" };
}

export default async function JobPage(props: PageProps<"/offres/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [job, user] = await Promise.all([getJob(id), getCurrentUser()]);
  if (!job) notFound();

  const supabase = await createClient();
  const [{ data: sections }, { data: outline }, { data: similar }, favorites, minPrice, application] = await Promise.all([
    // La RLS ne renvoie que les sections publiques aux non-abonnés
    supabase.from("job_sections").select("*").eq("job_id", job.id).returns<JobSection[]>(),
    supabase
      .rpc("job_outline", { p_job_id: job.id })
      .then((r) => ({ data: (r.data ?? []) as { kind: JobSectionKind; is_public: boolean }[] })),
    supabase
      .from("jobs")
      .select(JOB_SUMMARY_COLUMNS)
      .neq("id", job.id)
      .eq("category_id", job.category_id ?? "00000000-0000-0000-0000-000000000000")
      .order("published_at", { ascending: false })
      .limit(3)
      .returns<JobSummary[]>(),
    getFavoriteIds(user?.id),
    getMinPrice(),
    user
      ? supabase
          .from("applications")
          .select("status, created_at")
          .eq("job_id", job.id)
          .eq("user_id", user.id)
          .maybeSingle<{ status: ApplicationStatus; created_at: string }>()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const visible = SECTION_ORDER.map((kind) => sections?.find((s) => s.kind === kind)).filter(
    (s): s is JobSection => Boolean(s),
  );
  const lockedKinds = (outline ?? [])
    .filter((o) => !visible.some((v) => v.kind === o.kind))
    .map((o) => o.kind)
    .sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
  const locked = lockedKinds.length > 0 && !user?.isSubscribed;

  const expired = job.deadline ? new Date(job.deadline) < new Date(new Date().toDateString()) : false;
  const companyName = job.company?.name ?? "Entreprise";
  const justUnlocked = sp.debloque === "1" && user?.isSubscribed;

  return (
    <div className="pb-24 lg:pb-0">
      {justUnlocked && (
        <div className="border-b border-brand-600/40 bg-brand-50">
          <p className="container-page flex items-center gap-2 py-3 text-sm text-brand-800" role="status">
            <span aria-hidden className="grid size-6 place-items-center rounded-full bg-brand-600 text-white"><Check aria-hidden className="size-3.5" /></span>
            Offre débloquée — vous pouvez postuler.
          </p>
        </div>
      )}

      <div className="container-page py-8">
        <nav aria-label="Fil d'Ariane" className="text-xs text-muted">
          <Link href="/offres" className="hover:text-ink">Offres</Link>
          {job.category && (
            <>
              {" › "}
              <Link href={`/offres?categorie=${job.category.slug}`} className="hover:text-ink">{job.category.name}</Link>
            </>
          )}
          {" › "}<span className="text-ink">{job.title}</span>
        </nav>

        {/* En-tête */}
        <header className="mt-4 flex flex-col gap-4 border-b border-dashed border-line pb-6 sm:flex-row sm:items-center">
          <CompanyLogo name={companyName} url={job.company?.logo_url} size={60} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{job.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {companyName} · {jobMeta(job)}
              {job.published_at && ` · publiée ${formatRelative(job.published_at)}`}
              {job.deadline && ` · limite ${formatDate(job.deadline)}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ApplyButton job={job} user={user} locked={locked} expired={expired} applied={Boolean(application)} />
            <FavoriteButton jobId={job.id} isFavorite={favorites.has(job.id)} />
            <ShareButton title={job.title} />
          </div>
        </header>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
          <article className="min-w-0 space-y-8">
            {application && (
              <div className="card flex flex-wrap items-center gap-3 bg-surface p-4 text-sm">
                <span>Vous avez postulé le {formatDate(application.created_at)}.</span>
                <StatusBadge status={application.status} />
                <Link href="/espace/candidatures" className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                  Suivre mes candidatures <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            )}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">À propos du poste</h2>
              {job.summary && <RichText text={job.summary} />}
              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s) => <span key={s} className="chip">{s}</span>)}
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3 pt-2 text-sm sm:grid-cols-4">
                <Info label="Contrat" value={job.contract_type} />
                <Info label="Lieu" value={job.city} />
                <Info label="Expérience" value={job.experience_level ? EXPERIENCE_LABELS[job.experience_level] : "—"} />
                <Info label="Salaire" value={job.salary ?? "Non précisé"} />
              </dl>
            </section>

            {visible.map((s) => (
              <section key={s.kind} className="space-y-3">
                <h2 className="text-lg font-semibold">{SECTION_LABELS[s.kind]}</h2>
                <RichText text={s.content} />
              </section>
            ))}

            {locked && (
              <div className="relative">
                {/* Placeholder visuel : aucune donnée réservée n'est envoyée au navigateur */}
                <div aria-hidden className="space-y-6 opacity-60 blur-[3px] select-none [mask-image:linear-gradient(#000_30%,transparent)]">
                  {lockedKinds.map((kind) => (
                    <div key={kind} className="space-y-2">
                      <p className="font-semibold">{SECTION_LABELS[kind]}</p>
                      <div className="h-2.5 w-full rounded bg-line" />
                      <div className="h-2.5 w-11/12 rounded bg-line" />
                      <div className="h-2.5 w-3/4 rounded bg-line" />
                    </div>
                  ))}
                </div>
                <Paywall jobId={job.id} user={user} minPrice={minPrice} lockedKinds={lockedKinds} />
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <div className="card space-y-3 p-5">
              <h2 className="text-sm font-semibold text-muted">Entreprise</h2>
              <div className="flex items-center gap-3">
                <CompanyLogo name={companyName} url={job.company?.logo_url} size={44} />
                <div>
                  <p className="font-semibold">{companyName}</p>
                  {job.company?.city && <p className="text-xs text-muted">{job.company.city}</p>}
                </div>
              </div>
              {job.company?.description && <p className="text-sm text-muted">{job.company.description}</p>}
            </div>
            {job.deadline && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-muted">Date limite</h2>
                <p className="mt-1 font-semibold">{formatDate(job.deadline)}</p>
              </div>
            )}
            {similar?.length ? (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Offres similaires</h2>
                {similar.map((j) => (
                  <Link key={j.id} href={`/offres/${j.id}`} className="card block p-3 text-sm hover:border-ink/30">
                    <span className="font-medium">{j.title}</span>
                    <span className="block text-xs text-muted">{j.company?.name} · {j.contract_type}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {/* Mobile : barre de déblocage collante */}
      {locked && minPrice !== null && (
        <div id="mobile-actionbar" className="fixed inset-x-0 bottom-(--tabbar-h) z-30 flex items-center gap-3 border-t border-line bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
          <div className="flex-1">
            <p className="text-sm font-bold">{formatNumber(minPrice)} FCFA / mois</p>
            <p className="text-xs text-muted">mensuel · sans engagement</p>
          </div>
          <Link href={unlockHref(job.id, user)} className="btn-primary">Débloquer l&apos;offre</Link>
        </div>
      )}
    </div>
  );
}

function unlockHref(jobId: string, user: CurrentUser | null) {
  const choose = `/abonnements/choisir?offre=${jobId}`;
  return user ? choose : `/inscription?suivant=${encodeURIComponent(choose)}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ApplyButton({
  job,
  user,
  locked,
  expired,
  applied,
}: {
  job: Job;
  user: CurrentUser | null;
  locked: boolean;
  expired: boolean;
  applied: boolean;
}) {
  if (applied) return <Link href="/espace/candidatures" className="btn-secondary">Candidature envoyée <Check aria-hidden className="size-4" /></Link>;
  if (expired) return <span className="btn-secondary cursor-default opacity-70">Candidatures closes</span>;
  if (!user?.isSubscribed || locked) {
    return <Link href={unlockHref(job.id, user)} className="btn-primary">Postuler maintenant</Link>;
  }
  return <Link href={`/offres/${job.id}/postuler`} className="btn-primary">Postuler maintenant</Link>;
}

function Paywall({
  jobId,
  user,
  minPrice,
  lockedKinds,
}: {
  jobId: string;
  user: CurrentUser | null;
  minPrice: number | null;
  lockedKinds: JobSectionKind[];
}) {
  const expired = Boolean(user?.subscription && !user.subscription.isActive);
  const content = !user
    ? { title: "Débloquez cette opportunité", text: "Créez votre compte pour consulter l'offre complète et les informations pour envoyer votre candidature.", cta: "Créer mon compte" }
    : expired
      ? { title: "Votre abonnement a expiré", text: "Renouvelez-le pour consulter cette offre. Vos données (profil, CV, candidatures) sont conservées.", cta: "Renouveler" }
      : { title: "Débloquez cette opportunité", text: "Cette offre est réservée aux membres avec un abonnement actif.", cta: "Débloquer cette offre" };

  return (
    <div className="absolute inset-x-0 top-6 mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-ink/15 bg-white p-6 text-center shadow-xl">
      <LockBadge />
      <h2 className="text-lg font-bold">{content.title}</h2>
      <p className="text-sm text-muted">{content.text}</p>
      <p className="text-xs text-muted">
        Contenu réservé : {lockedKinds.map((k) => SECTION_LABELS[k]).join(", ")}.
      </p>
      {minPrice !== null && <p className="text-lg font-bold text-brand-700">À partir de {formatNumber(minPrice)} FCFA / mois</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={unlockHref(jobId, user)} className="btn-primary">{content.cta}</Link>
        <Link href="/abonnements" className="btn-secondary">Comparer les abonnements</Link>
      </div>
      <p className="text-xs text-muted">Abonnement mensuel · sans engagement</p>
    </div>
  );
}
