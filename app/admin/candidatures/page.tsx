import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setApplicationStatus } from "@/app/actions/applications";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "@/lib/constants";
import { formatDateTime, param, sanitizeSearch } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/form";
import type { Application, ApplicationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Candidatures" };

type Row = Application & {
  job: { id: string; title: string; company: { name: string } | null } | null;
  cv_file: { id: string; name: string } | null;
};

export default async function AdminApplicationsPage(props: PageProps<"/admin/candidatures">) {
  const sp = await props.searchParams;
  const offre = param(sp.offre);
  const statut = param(sp.statut);
  const q = sanitizeSearch(param(sp.q));

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select("*, job:jobs(id, title, company:companies(name)), cv_file:cv_files(id, name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (offre) query = query.eq("job_id", offre);
  if (APPLICATION_STATUSES.includes(statut as ApplicationStatus)) query = query.eq("status", statut);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data: apps } = await query.returns<Row[]>();

  const jobTitle = offre ? apps?.[0]?.job?.title : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Candidatures{jobTitle ? ` · ${jobTitle}` : ""}</h1>

      <Form action="/admin/candidatures" className="flex flex-wrap gap-2">
        {offre && <input type="hidden" name="offre" value={offre} />}
        <input name="q" defaultValue={q} placeholder="Nom ou e-mail…" aria-label="Rechercher" className="input max-w-xs rounded-full" />
        <select name="statut" defaultValue={statut} aria-label="Statut" className="input w-auto rounded-full">
          <option value="">Tous les statuts</option>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>)}
        </select>
        <button type="submit" className="btn-dark">Filtrer</button>
        {(offre || statut || q) && <Link href="/admin/candidatures" className="btn-secondary">Réinitialiser</Link>}
      </Form>

      <ul className="space-y-3">
        {apps?.map((a) => (
          <li key={a.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/candidats/${a.user_id}`} className="font-semibold hover:text-brand-700">{a.full_name}</Link>
                <p className="text-sm text-muted">
                  <a href={`mailto:${a.email}`} className="hover:text-ink">{a.email}</a>
                  {a.phone && <> · <a href={`tel:${a.phone}`} className="hover:text-ink">{a.phone}</a></>}
                </p>
                <p className="text-xs text-muted">
                  {a.job ? <Link href={`/admin/offres/${a.job.id}`} className="underline">{a.job.title}</Link> : "Offre supprimée"}
                  {a.job?.company && ` · ${a.job.company.name}`} · {formatDateTime(a.created_at)}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            {a.message && <p className="whitespace-pre-line rounded-xl bg-surface p-3 text-sm">{a.message}</p>}
            <div className="flex flex-wrap items-center gap-2">
              {a.cv_file && (
                <a href={`/cv/fichier/${a.cv_file.id}`} target="_blank" rel="noreferrer" className="btn-secondary py-1.5 text-xs"><FileText aria-hidden className="size-4" /> {a.cv_file.name}</a>
              )}
              {a.include_online_cv && (
                <Link href={`/admin/candidats/${a.user_id}#cv`} className="btn-secondary py-1.5 text-xs">CV en ligne</Link>
              )}
              <form action={setApplicationStatus.bind(null, a.id)} className="ml-auto flex items-center gap-2">
                <label htmlFor={`status-${a.id}`} className="sr-only">Statut</label>
                <select id={`status-${a.id}`} name="status" defaultValue={a.status} className="input w-auto py-1.5">
                  {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>)}
                </select>
                <SubmitButton className="btn-primary py-1.5" pendingLabel="…">Mettre à jour</SubmitButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
      {!apps?.length && <p className="card p-8 text-center text-sm text-muted">Aucune candidature.</p>}
    </div>
  );
}
