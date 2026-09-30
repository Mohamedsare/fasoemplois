import { Crown, Eye, FileDown, FileText, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CV_TEMPLATES } from "@/lib/constants";
import { daysAgoIso, formatNumber, formatRelative, param, sanitizeSearch } from "@/lib/format";
import { TemplateBadge } from "@/components/template-card";
import type { Cv, CvTemplate } from "@/lib/types";
import { PageHeader, Pagination, StatCard, buildHref, pageParam } from "../ui";

export const metadata: Metadata = { title: "CV & modèles" };

const PER_PAGE = 25;

type Row = Pick<Cv, "id" | "title" | "full_name" | "headline" | "template" | "user_id" | "updated_at"> & {
  profile: { full_name: string; email: string | null } | null;
};

export default async function AdminCvPage(props: PageProps<"/admin/cv">) {
  const sp = await props.searchParams;
  const q = sanitizeSearch(param(sp.q));
  const template = CV_TEMPLATES.find((t) => t.value === param(sp.modele))?.value ?? "";
  const page = pageParam(sp.page);
  const since = daysAgoIso(30);
  const supabase = await createClient();

  let query = supabase
    .from("cvs")
    .select("id, title, full_name, headline, template, user_id, updated_at, profile:profiles(full_name, email)", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (template) query = query.eq("template", template);
  if (q) query = query.or(`full_name.ilike.%${q}%,title.ilike.%${q}%,headline.ilike.%${q}%`);

  const [{ data: cvs, count: total }, { data: all }, { count: created30 }, { data: downloads }] = await Promise.all([
    query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1).returns<Row[]>(),
    supabase.from("cvs").select("template").limit(50000).returns<{ template: CvTemplate }[]>(),
    supabase.from("cvs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("pdf_downloads").select("template").gte("created_at", since).limit(50000).returns<{ template: CvTemplate }[]>(),
  ]);

  const cvCount = all?.length ?? 0;
  const byTemplate = CV_TEMPLATES.map((t) => ({
    ...t,
    cvs: (all ?? []).filter((c) => c.template === t.value).length,
    downloads: (downloads ?? []).filter((d) => d.template === t.value).length,
  })).sort((a, b) => b.cvs - a.cvs || b.downloads - a.downloads);
  const max = Math.max(1, ...byTemplate.map((t) => t.cvs));
  const premiumShare = cvCount ? Math.round((byTemplate.filter((t) => t.premium).reduce((n, t) => n + t.cvs, 0) / cvCount) * 100) : 0;
  const href = (params: { page?: number }) => buildHref("/admin/cv", { q, modele: template, page: params.page });

  return (
    <div className="space-y-6">
      <PageHeader title="CV & modèles" description="Utilisation du créateur de CV et popularité des modèles." />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="CV créés" icon={FileText} value={formatNumber(cvCount)} hint={`${formatNumber(created30 ?? 0)} ces 30 derniers jours`} />
        <StatCard label="PDF téléchargés" icon={FileDown} tone="brand" value={formatNumber(downloads?.length ?? 0)} hint="30 derniers jours" />
        <StatCard label="Modèles Premium" icon={Crown} value={`${premiumShare} %`} hint="des CV utilisent un modèle Premium" />
        <StatCard label="Modèle n°1" icon={Sparkles} value={byTemplate[0]?.cvs ? byTemplate[0].label : "—"} hint={byTemplate[0]?.cvs ? `${formatNumber(byTemplate[0].cvs)} CV` : "pas encore de CV"} />
      </dl>

      <section className="card p-5">
        <h2 className="font-semibold">Popularité des modèles</h2>
        <p className="mb-4 text-xs text-muted">Nombre de CV par modèle (tous) et téléchargements PDF (30 derniers jours).</p>
        <ul className="space-y-2.5">
          {byTemplate.map((t) => (
            <li key={t.value} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_7rem_7rem]">
              <Link href={buildHref("/admin/cv", { modele: t.value })} className="flex items-center gap-1.5 truncate font-medium hover:text-brand-700">
                {t.label}
                {t.premium && <Crown aria-label="Premium" className="size-3.5 shrink-0 text-star-400" />}
              </Link>
              <span className="h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden>
                <span className={`block h-full rounded-full ${t.premium ? "bg-ink" : "bg-brand-600"}`} style={{ width: `${(t.cvs / max) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{formatNumber(t.cvs)} CV</span>
              <span className="hidden text-right text-muted tabular-nums sm:block">{formatNumber(t.downloads)} PDF</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-lg font-semibold">Tous les CV</h2>
          <Form action="/admin/cv" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label htmlFor="modele" className="sr-only">Modèle</label>
            <select id="modele" name="modele" defaultValue={template} className="input sm:w-44">
              <option value="">Tous les modèles</option>
              {CV_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}{t.premium ? " (Premium)" : ""}</option>)}
            </select>
            <input name="q" defaultValue={q} placeholder="Nom, titre du CV, métier…" aria-label="Rechercher" className="input sm:w-64" />
            <button type="submit" className="btn-dark">Filtrer</button>
          </Form>
        </div>

        <ul className="card divide-y divide-line">
          {cvs?.map((c) => {
            const t = CV_TEMPLATES.find((x) => x.value === c.template);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="truncate font-medium">{c.full_name || "Sans nom"} <span className="font-normal text-muted">· {c.title}</span></p>
                  <p className="truncate text-xs text-muted">
                    {c.headline || "—"} · compte{" "}
                    <Link href={`/admin/utilisateurs/${c.user_id}`} className="underline hover:text-ink">{c.profile?.full_name || c.profile?.email || "utilisateur"}</Link>
                  </p>
                </div>
                {t && (
                  <span className="flex items-center gap-2 text-xs">
                    {t.label} <TemplateBadge premium={t.premium} />
                  </span>
                )}
                <span className="w-28 text-xs text-muted">{formatRelative(c.updated_at)}</span>
                <Link href={`/cv/${c.id}/apercu`} target="_blank" className="btn-secondary px-3 py-1.5 text-xs"><Eye aria-hidden className="size-3.5" /> Aperçu</Link>
              </li>
            );
          })}
          {!cvs?.length && <li className="p-10 text-center text-sm text-muted">Aucun CV.</li>}
        </ul>
        <Pagination page={page} perPage={PER_PAGE} total={total ?? 0} href={(n) => href({ page: n })} />
      </section>
    </div>
  );
}
