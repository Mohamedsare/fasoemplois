import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "@/lib/constants";
import { formatDateTime, formatShortDate, param } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { CompanyLogo, EmptyState } from "@/components/ui";
import type { ApplicationEvent, ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Mes candidatures" };

type AppRow = {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job: { id: string; title: string; company: { name: string; logo_url: string | null } | null } | null;
};

export default async function ApplicationsPage(props: PageProps<"/espace/candidatures">) {
  const sp = await props.searchParams;
  const filter = APPLICATION_STATUSES.includes(param(sp.statut) as ApplicationStatus) ? (param(sp.statut) as ApplicationStatus) : null;
  const user = await requireUser("/espace/candidatures");
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("id, status, created_at, job:jobs(id, title, company:companies(name, logo_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (filter) query = query.eq("status", filter);
  const { data: apps } = await query.returns<AppRow[]>();

  const selected = apps?.find((a) => a.id === param(sp.id)) ?? apps?.[0];
  const { data: events } = selected
    ? await supabase
        .from("application_events")
        .select("*")
        .eq("application_id", selected.id)
        .order("created_at")
        .returns<ApplicationEvent[]>()
    : { data: null };

  const href = (changes: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { statut: filter, id: null, ...changes };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/espace/candidatures?${s}` : "/espace/candidatures";
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Mes candidatures</h1>

      <ul className="flex flex-wrap gap-2" aria-label="Filtrer par statut">
        <li><Link href={href({ statut: null })} className={`chip ${!filter ? "chip-active" : ""}`}>Toutes</Link></li>
        {APPLICATION_STATUSES.map((s) => (
          <li key={s}>
            <Link href={href({ statut: s })} className={`chip ${filter === s ? "chip-active" : ""}`}>
              {APPLICATION_STATUS_LABELS[s]}
            </Link>
          </li>
        ))}
      </ul>

      {!apps?.length ? (
        <EmptyState
          title={filter ? "Aucune candidature avec ce statut." : "Vous n'avez pas encore postulé."}
          text="Trouvez une offre qui vous correspond et postulez en quelques clics."
          action={<Link href="/offres" className="btn-primary">Explorer les opportunités</Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <ul className="space-y-2">
            {apps.map((a) => (
              <li key={a.id}>
                <Link
                  href={href({ id: a.id })}
                  aria-current={selected?.id === a.id ? "true" : undefined}
                  className={`card flex items-center gap-3 p-4 ${selected?.id === a.id ? "border-2 border-ink" : "hover:border-ink/30"}`}
                >
                  <CompanyLogo name={a.job?.company?.name ?? "?"} url={a.job?.company?.logo_url} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.job?.title ?? "Offre supprimée"}</span>
                    <span className="text-xs text-muted">{a.job?.company?.name} · {formatShortDate(a.created_at)}</span>
                  </span>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>

          {selected && (
            <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
              <div>
                <p className="font-semibold">{selected.job?.title ?? "Offre supprimée"}</p>
                <p className="text-xs text-muted">{selected.job?.company?.name}</p>
              </div>
              <StatusBadge status={selected.status} />
              <ol className="space-y-3 border-l-2 border-line pl-4 text-sm">
                {(events ?? []).map((e) => (
                  <li key={e.id}>
                    <p className="font-semibold">{APPLICATION_STATUS_LABELS[e.status]}</p>
                    <p className="text-xs text-muted">{formatDateTime(e.created_at)}</p>
                  </li>
                ))}
                {!["retenue", "refusee"].includes(selected.status) && (
                  <li className="text-muted">
                    <p>○ Décision</p>
                    <p className="text-xs">en attente</p>
                  </li>
                )}
              </ol>
              {selected.job && (
                <Link href={`/offres/${selected.job.id}`} className="text-sm text-brand-700 underline">Voir l&apos;offre</Link>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
