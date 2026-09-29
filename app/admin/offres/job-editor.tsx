"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { saveJob } from "@/app/actions/admin";
import { FormAlert, useFormAction } from "@/components/form";
import { MarkdownEditor } from "@/components/markdown-editor";
import { RichText } from "@/components/rich-text";
import { LockBadge } from "@/components/ui";
import { CITIES, CONTRACT_TYPES, EXPERIENCE_LABELS, SECTION_LABELS, SECTION_ORDER } from "@/lib/constants";
import { DISPLAY_STATUS, displayStatus } from "@/lib/job-status";
import type { Category, Company, Job, JobSection, JobSectionKind } from "@/lib/types";

type Props = {
  job: Job | null;
  sections: JobSection[];
  companies: Pick<Company, "id" | "name">[];
  categories: Category[];
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function JobEditor({ job, sections, companies, categories }: Props) {
  const { state, onSubmit, pending } = useFormAction(saveJob.bind(null, job?.id ?? null));
  const e = state?.fieldErrors ?? {};

  const [title, setTitle] = useState(job?.title ?? "");
  const [companyId, setCompanyId] = useState(job?.company_id ?? "");
  const [city, setCity] = useState(job?.city ?? "");
  const [contract, setContract] = useState<string>(job?.contract_type ?? "");
  const [summary, setSummary] = useState(job?.summary ?? "");
  const [content, setContent] = useState<Record<JobSectionKind, string>>(
    Object.fromEntries(SECTION_ORDER.map((k) => [k, sections.find((s) => s.kind === k)?.content ?? ""])) as Record<JobSectionKind, string>,
  );
  const [isPublic, setIsPublic] = useState<Record<JobSectionKind, boolean>>(
    Object.fromEntries(SECTION_ORDER.map((k) => [k, sections.find((s) => s.kind === k)?.is_public ?? false])) as Record<JobSectionKind, boolean>,
  );
  const initialPublication = job ? displayStatus(job) : "brouillon";
  const [publication, setPublication] = useState<string>(initialPublication);
  const initialStatus = DISPLAY_STATUS[initialPublication];
  const [previewAs, setPreviewAs] = useState<"visiteur" | "abonne">("visiteur");

  const companyName = companies.find((c) => c.id === companyId)?.name ?? "Entreprise";
  const filled = SECTION_ORDER.filter((k) => content[k].trim());

  return (
    <form onSubmit={onSubmit} className="pb-24">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/admin/offres" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft aria-hidden className="size-4" /> Offres</Link>
        <h1 className="text-2xl font-bold">{job ? "Modifier l'offre" : "Nouvelle offre"}</h1>
        <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${initialStatus.className}`}>
          <initialStatus.icon aria-hidden className="size-3.5" /> {initialStatus.label}
        </span>
      </div>
      <FormAlert state={state} />

      <div className="mt-4 grid gap-6 xl:grid-cols-[140px_1fr_300px]">
        <nav aria-label="Sections du formulaire" className="hidden xl:block">
          <div className="sticky top-8 space-y-1 text-sm">
            <a href="#infos" className="block rounded-full px-3 py-1 hover:bg-white">Infos générales</a>
            <a href="#contenu" className="block rounded-full px-3 py-1 hover:bg-white">Contenu</a>
            <a href="#publication" className="block rounded-full px-3 py-1 hover:bg-white">Publication</a>
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          <section id="infos" className="card scroll-mt-8 space-y-4 p-6">
            <h2 className="font-semibold">Informations générales</h2>
            <div>
              <label htmlFor="title" className="label">Titre du poste *</label>
              <input id="title" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} className="input" />
              {e.title && <p className="mt-1 text-xs text-accent-600">{e.title}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company_id" className="label">Entreprise *</label>
                <select id="company_id" name="company_id" value={companyId} onChange={(ev) => setCompanyId(ev.target.value)} className="input">
                  <option value="">Choisir…</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {e.company_id && <p className="mt-1 text-xs text-accent-600">{e.company_id}</p>}
                <Link href="/admin/entreprises" className="mt-1 inline-block text-xs text-muted underline">+ Nouvelle entreprise</Link>
              </div>
              <div>
                <label htmlFor="category_id" className="label">Catégorie</label>
                <select id="category_id" name="category_id" defaultValue={job?.category_id ?? ""} className="input">
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="label">Localisation *</label>
                <input id="city" name="city" list="cities" value={city} onChange={(ev) => setCity(ev.target.value)} className="input" />
                <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                {e.city && <p className="mt-1 text-xs text-accent-600">{e.city}</p>}
              </div>
              <div>
                <label htmlFor="contract_type" className="label">Type de contrat *</label>
                <select id="contract_type" name="contract_type" value={contract} onChange={(ev) => setContract(ev.target.value)} className="input">
                  <option value="">Choisir…</option>
                  {CONTRACT_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {e.contract_type && <p className="mt-1 text-xs text-accent-600">{e.contract_type}</p>}
              </div>
              <div>
                <label htmlFor="experience_level" className="label">Niveau d&apos;expérience</label>
                <select id="experience_level" name="experience_level" defaultValue={job?.experience_level ?? ""} className="input">
                  <option value="">—</option>
                  {Object.entries(EXPERIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="salary" className="label">Salaire (optionnel)</label>
                <input id="salary" name="salary" defaultValue={job?.salary ?? ""} placeholder="Ex. 250 000 FCFA / mois" className="input" />
              </div>
              <div>
                <label htmlFor="deadline" className="label">Date limite</label>
                <input id="deadline" name="deadline" type="date" defaultValue={job?.deadline ?? ""} className="input" />
              </div>
              <div>
                <label htmlFor="skills" className="label">Compétences (tags)</label>
                <input id="skills" name="skills" defaultValue={job?.skills.join(", ") ?? ""} placeholder="React, Node.js, SQL" className="input" />
              </div>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={job?.is_featured} className="size-4 accent-brand-600" /> À la une</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_urgent" defaultChecked={job?.is_urgent} className="size-4 accent-brand-600" /> Urgent</label>
            </div>
          </section>

          <section id="contenu" className="card scroll-mt-8 space-y-5 p-6">
            <div>
              <h2 className="font-semibold">Contenu</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <LockBadge size="sm" /> Chaque section est réservée aux abonnés, sauf si vous la rendez publique.
              </p>
            </div>
            <div>
              <label htmlFor="summary" className="label">À propos du poste (toujours public)</label>
              <MarkdownEditor id="summary" name="summary" value={summary} onChange={setSummary} rows={3} />
            </div>
            {SECTION_ORDER.map((kind) => (
              <details key={kind} open={Boolean(content[kind]) || kind === "missions"} className="rounded-xl border border-line p-4">
                <summary className="flex cursor-pointer items-center gap-2 font-medium">
                  {SECTION_LABELS[kind]}
                  {content[kind].trim() && (
                    <span className="chip ml-auto">{isPublic[kind] ? "Public" : <><Lock aria-hidden className="size-3" /> Abonnés</>}</span>
                  )}
                </summary>
                <div className="mt-3 space-y-2">
                  <label htmlFor={`section_${kind}`} className="sr-only">{SECTION_LABELS[kind]}</label>
                  <MarkdownEditor
                    id={`section_${kind}`}
                    name={`section_${kind}`}
                    value={content[kind]}
                    onChange={(v) => setContent({ ...content, [kind]: v })}
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      name={`section_${kind}_public`}
                      checked={isPublic[kind]}
                      onChange={(ev) => setIsPublic({ ...isPublic, [kind]: ev.target.checked })}
                      className="size-4 accent-brand-600"
                    />
                    Visible publiquement (sans abonnement)
                  </label>
                </div>
              </details>
            ))}
          </section>

          <section id="publication" className="card scroll-mt-8 space-y-3 p-6">
            <h2 className="font-semibold">Publication</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { v: "brouillon", l: "Brouillon" },
                { v: "publie", l: "Publié" },
                { v: "programme", l: "Programmé" },
                { v: "archive", l: "Archivé" },
              ].map((o) => (
                <label key={o.v} className="flex items-center gap-2">
                  <input type="radio" name="publication" value={o.v} checked={publication === o.v} onChange={() => setPublication(o.v)} className="size-4 accent-brand-600" />
                  {o.l}
                </label>
              ))}
            </div>
            {publication === "programme" && (
              <div className="max-w-xs">
                <label htmlFor="publish_at" className="label">Date de publication</label>
                <input id="publish_at" name="publish_at" type="datetime-local" defaultValue={toLocalInput(job?.published_at ?? null)} className="input" />
                {e.publish_at && <p className="mt-1 text-xs text-accent-600">{e.publish_at}</p>}
              </div>
            )}
          </section>
        </div>

        {/* Aperçu candidat en direct */}
        <aside className="hidden xl:block">
          <div className="sticky top-8 space-y-2 rounded-2xl bg-cream p-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Aperçu candidat :</span>
              {(["visiteur", "abonne"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setPreviewAs(v)} className={`chip ${previewAs === v ? "chip-active" : ""}`}>
                  {v === "visiteur" ? "visiteur" : "abonné"}
                </button>
              ))}
            </div>
            <div className="card max-h-[70vh] space-y-3 overflow-y-auto p-4 text-sm">
              <p className="font-bold">{title || "Titre du poste"}</p>
              <p className="text-xs text-muted">{companyName} · {city || "Lieu"} · {contract || "Contrat"}</p>
              {summary && <RichText text={summary} />}
              {filled
                .filter((k) => previewAs === "abonne" || isPublic[k])
                .map((k) => (
                  <div key={k}>
                    <p className="font-semibold">{SECTION_LABELS[k]}</p>
                    <RichText text={content[k]} />
                  </div>
                ))}
              {previewAs === "visiteur" && filled.some((k) => !isPublic[k]) && (
                <div className="space-y-2">
                  <div aria-hidden className="space-y-1.5 opacity-60 blur-[2px]">
                    <div className="h-2 rounded bg-line" /><div className="h-2 w-4/5 rounded bg-line" />
                  </div>
                  <p className="flex items-center gap-2 text-xs"><LockBadge size="sm" /> Débloquez cette opportunité</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Barre d'actions collante */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-white lg:left-56">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <span className="text-xs text-muted">{pending ? "Enregistrement…" : job ? `Modifiée le ${new Date(job.updated_at).toLocaleDateString("fr-FR")}` : "Non enregistrée"}</span>
          <button type="submit" name="intent" value="draft" disabled={pending} className="btn-secondary ml-auto">Enregistrer brouillon</button>
          {job && (
            <a href={`/offres/${job.id}`} target="_blank" rel="noreferrer" className="btn-secondary">Prévisualiser</a>
          )}
          <button type="submit" name="intent" value="save" disabled={pending} className="btn-secondary">Enregistrer</button>
          <button type="submit" name="intent" value="publish" disabled={pending} className="btn-primary">Publier</button>
        </div>
      </div>
    </form>
  );
}
