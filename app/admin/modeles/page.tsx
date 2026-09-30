import { Crown, Eye, EyeOff, PencilLine, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteTemplate, setTemplatePremium, setTemplatePublished } from "@/app/actions/admin-templates";
import { CV_TEMPLATES } from "@/lib/constants";
import { formatNumber, formatRelative } from "@/lib/format";
import { sampleForTemplate } from "@/lib/sample-cvs";
import { toCatalog, type CustomTemplateRow } from "@/lib/template-catalog";
import { CvPreview } from "@/components/cv-preview";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { TemplateBadge } from "@/components/template-card";
import { PageHeader, StatCard } from "../ui";

export const metadata: Metadata = { title: "Modèles" };

export default async function AdminTemplatesPage(props: PageProps<"/admin/modeles">) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const [{ data: rows, error }, { data: usage }] = await Promise.all([
    supabase.from("cv_templates").select("*").order("position").order("created_at", { ascending: false }).returns<CustomTemplateRow[]>(),
    supabase.from("cvs").select("template").like("template", "ia-%").limit(50000).returns<{ template: string }[]>(),
  ]);
  const templates = rows ?? [];
  const used = (id: string) => (usage ?? []).filter((u) => u.template === id).length;
  const published = templates.filter((t) => t.is_published).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Modèles de CV" description="Créez de nouveaux modèles avec l'IA et ajoutez-les à la galerie.">
        <Link href="/admin/modeles/nouveau" className="btn bg-violet-600 text-white hover:bg-violet-700">
          <Wand2 aria-hidden className="size-4" /> Créer un modèle avec l&apos;IA
        </Link>
      </PageHeader>

      {sp.supprime === "1" && (
        <p role="status" className="rounded-xl border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Modèle supprimé. Les CV qui l&apos;utilisaient gardent leur mise en page.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-accent-500/30 bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
          La table des modèles IA n&apos;existe pas encore : appliquez la migration <code>20261006000000_modeles_ia.sql</code> (npm run db:migrate).
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Modèles au total" icon={Sparkles} value={formatNumber(CV_TEMPLATES.length + published)} hint={`${CV_TEMPLATES.length} intégrés + ${published} créés avec l'IA`} />
        <StatCard label="Modèles IA publiés" icon={Eye} tone="brand" value={formatNumber(published)} hint={`${templates.length - published} brouillon(s)`} />
        <StatCard label="CV sur un modèle IA" icon={PencilLine} value={formatNumber(usage?.length ?? 0)} />
        <StatCard label="Modèles IA Premium" icon={Crown} value={formatNumber(templates.filter((t) => t.premium).length)} />
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Créés avec l&apos;IA</h2>
        {templates.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {templates.map((t) => {
              const entry = toCatalog(t);
              const sample = sampleForTemplate(entry);
              return (
                <li key={t.id} className="card flex flex-col overflow-hidden">
                  <Link href={`/admin/modeles/${t.id}`} className="relative block bg-surface p-4" aria-label={`Modifier ${t.name}`}>
                    <div className="pointer-events-none"><CvPreview cv={sample.cv} photoUrl={sample.photo} /></div>
                    <span className={`absolute top-3 left-3 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold shadow-sm ${t.is_published ? "bg-brand-600 text-white" : "bg-white text-muted"}`}>
                      {t.is_published ? "Publié" : "Brouillon"}
                    </span>
                    <TemplateBadge premium={t.premium} className="absolute top-3 right-3 shadow-sm" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-muted">{t.description || "—"}</p>
                      <p className="mt-1 text-xs text-muted">{used(t.id)} CV · modifié {formatRelative(t.updated_at)}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Link href={`/admin/modeles/${t.id}`} className="btn-primary px-3 py-1.5 text-xs"><PencilLine aria-hidden className="size-3.5" /> Modifier</Link>
                      <form action={setTemplatePublished.bind(null, t.id, !t.is_published)}>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                          {t.is_published ? <><EyeOff aria-hidden className="size-3.5" /> Retirer</> : <><Eye aria-hidden className="size-3.5" /> Publier</>}
                        </button>
                      </form>
                      <form action={setTemplatePremium.bind(null, t.id, !t.premium)}>
                        <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">{t.premium ? "Rendre gratuit" : "Passer Premium"}</button>
                      </form>
                      <form action={deleteTemplate.bind(null, t.id)} className="ml-auto">
                        <ConfirmSubmit message={`Supprimer le modèle « ${t.name} » ? Les CV qui l'utilisent gardent leur mise en page.`} className="rounded-full p-2 text-accent-600 hover:bg-accent-500/5">
                          <Trash2 aria-hidden className="size-4" /><span className="sr-only">Supprimer</span>
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Wand2 aria-hidden className="size-9 text-violet-600" />
            <p className="font-semibold">Aucun modèle créé avec l&apos;IA pour le moment</p>
            <p className="max-w-md text-sm text-muted">Décrivez un style (« sobre pour la banque », « créatif pour un graphiste »…) : l&apos;IA dessine le modèle, vous l&apos;ajustez et le publiez.</p>
            <Link href="/admin/modeles/nouveau" className="btn bg-violet-600 text-white hover:bg-violet-700">Créer mon premier modèle</Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Modèles intégrés ({CV_TEMPLATES.length})</h2>
        <ul className="card divide-y divide-line">
          {CV_TEMPLATES.map((t) => (
            <li key={t.value} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="flex-1"><span className="font-medium">{t.label}</span> <span className="text-muted">· {t.description}</span></span>
              <TemplateBadge premium={t.premium} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
