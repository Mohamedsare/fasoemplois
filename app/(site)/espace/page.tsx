import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { profileCompletion, requireUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/queries";
import { formatShortDate } from "@/lib/format";
import { JOB_SUMMARY_COLUMNS, JobCard, type JobSummary } from "@/components/job-card";
import { StatusBadge, SubscriptionBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Mon espace" };

type RecentApp = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job: { id: string; title: string; company: { name: string } | null } | null;
};

export default async function DashboardPage(props: PageProps<"/espace">) {
  const sp = await props.searchParams;
  const user = await requireUser();
  const { profile } = user;
  const supabase = await createClient();

  const [{ data: apps, count: appCount }, { count: favCount }, { count: cvFiles }, { data: cv }, favorites] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, job:jobs(id, title, company:companies(name))", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<RecentApp[]>(),
    supabase.from("favorites").select("job_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("cv_files").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("cvs").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
    getFavoriteIds(user.id),
  ]);

  // Recommandations : préférences du profil, sinon dernières offres
  const appliedIds = (apps ?? []).map((a) => a.job?.id).filter(Boolean) as string[];
  const prefs = [
    profile.pref_categories.length && `category_id.in.(${profile.pref_categories.join(",")})`,
    profile.pref_cities.length && `city.in.(${profile.pref_cities.map((c) => `"${c}"`).join(",")})`,
    profile.pref_contracts.length && `contract_type.in.(${profile.pref_contracts.map((c) => `"${c}"`).join(",")})`,
  ].filter(Boolean) as string[];
  let recoQuery = supabase.from("jobs").select(JOB_SUMMARY_COLUMNS).order("published_at", { ascending: false }).limit(3);
  if (prefs.length) recoQuery = recoQuery.or(prefs.join(","));
  if (appliedIds.length) recoQuery = recoQuery.not("id", "in", `(${appliedIds.join(",")})`);
  let { data: recommended } = await recoQuery.returns<JobSummary[]>();
  if (!recommended?.length && prefs.length) {
    ({ data: recommended } = await supabase
      .from("jobs")
      .select(JOB_SUMMARY_COLUMNS)
      .order("published_at", { ascending: false })
      .limit(3)
      .returns<JobSummary[]>());
  }

  const completion = profileCompletion(profile, Boolean(cv) || (cvFiles ?? 0) > 0);
  const sub = user.subscription;

  return (
    <div className="space-y-8">
      {sp.mdp === "1" && (
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Mot de passe mis à jour.</p>
      )}
      <div>
        <h1 className="text-3xl font-bold">Bonjour {profile.first_name || "et bienvenue"}</h1>
        <p className="mt-1 text-muted">Voici les nouvelles opportunités correspondant à votre profil.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Candidatures" value={String(appCount ?? 0)} href="/espace/candidatures" />
        <Kpi label="Offres enregistrées" value={String(favCount ?? 0)} href="/espace/favoris" />
        <Kpi label="Profil complété" value={`${completion} %`} href="/espace/profil" />
        <Link href="/espace/abonnement" className="card space-y-2 p-4 hover:border-ink/30">
          <p className="text-xs text-muted">Abonnement</p>
          {sub ? <SubscriptionBadge active={sub.isActive} cancelled={sub.status === "cancelled"} /> : <span className="text-sm font-semibold">Aucun</span>}
        </Link>
      </div>

      {completion < 100 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-cream p-5 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-2">
            <p className="font-semibold">Profil complété à {completion} %</p>
            <ProgressBar value={completion} label="Complétion du profil" />
            <p className="text-xs text-muted">Complétez votre profil pour de meilleures recommandations.</p>
          </div>
          <Link href={profile.onboarding_completed_at ? "/espace/profil" : "/bienvenue"} className="btn-secondary">Compléter</Link>
        </div>
      )}

      {!user.isSubscribed && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand-600/50 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            <strong>{sub ? "Votre abonnement a expiré." : "Vous n'avez pas encore d'abonnement."}</strong>{" "}
            Débloquez les offres complètes pour postuler.
          </p>
          <Link href="/abonnements" className="btn-primary">{sub ? "Renouveler" : "Voir les abonnements"}</Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recommandées pour vous</h2>
        {recommended?.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recommended.map((j) => <JobCard key={j.id} job={j} layout="grid" isFavorite={favorites.has(j.id)} />)}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune offre pour le moment.</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Mes candidatures récentes</h2>
          <Link href="/espace/candidatures" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Tout voir <ArrowRight aria-hidden className="size-4" /></Link>
        </div>
        {apps?.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Poste</th>
                  <th className="px-4 py-3 font-medium">Entreprise</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {a.job ? <Link href={`/offres/${a.job.id}`} className="hover:text-brand-700">{a.job.title}</Link> : "Offre supprimée"}
                    </td>
                    <td className="px-4 py-3 text-muted">{a.job?.company?.name}</td>
                    <td className="px-4 py-3 text-muted">{formatShortDate(a.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Vous n&apos;avez pas encore postulé. <Link href="/offres" className="text-brand-700 underline">Explorer les offres</Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="card space-y-1 p-4 hover:border-ink/30">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Link>
  );
}
