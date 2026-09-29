import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import { bulkJobs, deleteJob, duplicateJob, setJobStatus } from "@/app/actions/admin";
import { DISPLAY_STATUS, displayStatus } from "@/lib/job-status";
import { formatShortDate, param, sanitizeSearch } from "@/lib/format";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Company, Job } from "@/lib/types";

export const metadata: Metadata = { title: "Offres d'emploi" };

const PER_PAGE = 20;

type Row = Pick<Job, "id" | "title" | "city" | "contract_type" | "status" | "published_at" | "deadline"> & {
  company: { name: string } | null;
  category: { name: string } | null;
  applications: { count: number }[];
};

export default async function AdminJobsPage(props: PageProps<"/admin/offres">) {
  const sp = await props.searchParams;
  const q = sanitizeSearch(param(sp.q));
  const statut = param(sp.statut);
  const categorie = param(sp.categorie);
  const entreprise = param(sp.entreprise);
  const page = Math.max(1, Number(param(sp.page)) || 1);

  const supabase = await createClient();
  const [categories, { data: companies }] = await Promise.all([
    getCategories(),
    supabase.from("companies").select("id, name").order("name").returns<Pick<Company, "id" | "name">[]>(),
  ]);

  let query = supabase
    .from("jobs")
    .select("id, title, city, contract_type, status, published_at, deadline, company:companies(name), category:categories(name), applications(count)", { count: "exact" });
  if (q) query = query.ilike("title", `%${q}%`);
  if (statut === "programme") query = query.eq("status", "publie").gt("published_at", new Date().toISOString());
  else if (statut === "publie") query = query.eq("status", "publie").lte("published_at", new Date().toISOString());
  else if (statut) query = query.eq("status", statut);
  if (categorie) query = query.eq("category_id", categorie);
  if (entreprise) query = query.eq("company_id", entreprise);

  const from = (page - 1) * PER_PAGE;
  const { data: jobs, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PER_PAGE - 1)
    .returns<Row[]>();
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = new URLSearchParams(Object.entries({ q, statut, categorie, entreprise }).filter(([, v]) => v));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1 text-2xl font-bold">Offres d&apos;emploi</h1>
        <a href={`/admin/offres/export?${qs}`} className="btn-secondary">Exporter</a>
        <Link href="/admin/offres/nouvelle" className="btn-primary">+ Nouvelle offre</Link>
      </div>

      <Form action="/admin/offres" className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" defaultValue={q} placeholder="Rechercher une offre…" className="input max-w-xs rounded-full" />
        <select name="statut" defaultValue={statut} aria-label="Statut" className="input w-auto rounded-full">
          <option value="">Statut</option>
          {Object.entries(DISPLAY_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="categorie" defaultValue={categorie} aria-label="Catégorie" className="input w-auto rounded-full">
          <option value="">Catégorie</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="entreprise" defaultValue={entreprise} aria-label="Entreprise" className="input w-auto rounded-full">
          <option value="">Entreprise</option>
          {companies?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="btn-dark">Filtrer</button>
      </Form>

      {/* Actions groupées : les cases à cocher sont reliées à ce formulaire via l'attribut form */}
      <form id="bulk-form" action={bulkJobs} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 py-2 text-sm">
        <span className="text-muted">Sélection :</span>
        <button type="submit" name="bulk" value="desactiver" className="underline hover:text-brand-700">Désactiver</button>
        <button type="submit" name="bulk" value="archiver" className="underline hover:text-brand-700">Archiver</button>
        <ConfirmSubmit name="bulk" value="supprimer" message="Supprimer définitivement les offres sélectionnées ?" className="text-accent-600 underline">
          Supprimer
        </ConfirmSubmit>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left text-xs">
              <th className="w-8 px-3 py-3"><span className="sr-only">Sélection</span></th>
              <th className="px-3 py-3">Titre</th>
              <th className="px-3 py-3">Entreprise</th>
              <th className="px-3 py-3">Catégorie</th>
              <th className="px-3 py-3">Lieu</th>
              <th className="px-3 py-3">Contrat</th>
              <th className="px-3 py-3">Publication</th>
              <th className="px-3 py-3">Limite</th>
              <th className="px-3 py-3">Cand.</th>
              <th className="px-3 py-3">Statut</th>
              <th className="w-10 px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {jobs?.map((j) => {
              const ds = displayStatus(j);
              const s = DISPLAY_STATUS[ds];
              return (
                <tr key={j.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="ids" value={j.id} form="bulk-form" aria-label={`Sélectionner ${j.title}`} className="size-4 accent-brand-600" />
                  </td>
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/admin/offres/${j.id}`} className="hover:text-brand-700">{j.title}</Link>
                  </td>
                  <td className="px-3 py-2">{j.company?.name}</td>
                  <td className="px-3 py-2 text-muted">{j.category?.name ?? "—"}</td>
                  <td className="px-3 py-2">{j.city}</td>
                  <td className="px-3 py-2">{j.contract_type}</td>
                  <td className="px-3 py-2">{j.published_at ? formatShortDate(j.published_at) : "—"}</td>
                  <td className="px-3 py-2">{j.deadline ? formatShortDate(j.deadline) : "—"}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/candidatures?offre=${j.id}`} className="underline">{j.applications[0]?.count ?? 0}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${s.className}`}>
                      <s.icon aria-hidden className="size-3.5" />{s.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded-full px-2 text-lg leading-none hover:bg-surface" aria-label="Actions">…</summary>
                      <div className="absolute right-0 z-20 mt-1 flex w-44 flex-col rounded-xl border border-line bg-white p-1 text-sm shadow-lg">
                        <Link href={`/admin/offres/${j.id}`} className="rounded-lg px-3 py-1.5 hover:bg-surface">Modifier</Link>
                        <form action={duplicateJob.bind(null, j.id)}>
                          <button type="submit" className="w-full rounded-lg px-3 py-1.5 text-left hover:bg-surface">Dupliquer</button>
                        </form>
                        <Link href={`/admin/candidatures?offre=${j.id}`} className="rounded-lg px-3 py-1.5 hover:bg-surface">Voir candidatures</Link>
                        <form action={setJobStatus.bind(null, j.id, j.status === "publie" ? "brouillon" : "publie")}>
                          <button type="submit" className="w-full rounded-lg px-3 py-1.5 text-left hover:bg-surface">
                            {j.status === "publie" ? "Désactiver" : "Publier maintenant"}
                          </button>
                        </form>
                        <form action={deleteJob.bind(null, j.id)}>
                          <ConfirmSubmit message={`Supprimer « ${j.title} » et ses candidatures ?`} className="w-full rounded-lg px-3 py-1.5 text-left text-accent-600 hover:bg-accent-500/5">
                            Supprimer
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!jobs?.length && <p className="p-8 text-center text-sm text-muted">Aucune offre.</p>}
      </div>

      <div className="flex items-center text-sm">
        <span className="text-muted">
          {total ? `${from + 1}–${Math.min(from + PER_PAGE, total)} sur ${total}` : "0 offre"}
        </span>
        <div className="ml-auto flex gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(qs);
            if (p > 1) params.set("page", String(p));
            return (
              <Link key={p} href={`/admin/offres?${params}`} aria-current={p === page ? "page" : undefined} className={`chip ${p === page ? "chip-active" : ""}`}>
                {p}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
