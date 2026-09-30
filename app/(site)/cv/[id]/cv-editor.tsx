"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Check,
  Crown,
  Eye,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveCvDraft } from "@/app/actions/cv";
import { aiAssist, type AiFill, type AiRequest, type AiResult } from "@/app/actions/cv-ai";
import { CvPreview } from "@/components/cv-preview";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { CV_ACCENTS } from "@/lib/constants";
import { uploadCvPhoto } from "@/lib/photo-upload";
import { sampleForTemplate } from "@/lib/sample-cvs";
import type { CatalogTemplate } from "@/lib/template-spec";
import type { CvDraft, CvEntry } from "@/lib/types";

const STEPS = [
  { key: "modele", label: "Modèle" },
  { key: "infos", label: "Infos" },
  { key: "profil", label: "Profil" },
  { key: "experiences", label: "Expériences" },
  { key: "formation", label: "Formation" },
  { key: "competences", label: "Compétences" },
  { key: "finaliser", label: "Finaliser" },
] as const;

const TIPS: Record<(typeof STEPS)[number]["key"], string> = {
  modele: "Choisissez un modèle sobre : « Classique » pour l'administration et la finance, « Moderne » ou « Épuré » pour les autres secteurs. Une photo professionnelle (fond neutre, visage bien éclairé) inspire confiance.",
  infos: "Utilisez une adresse e-mail professionnelle (prénom.nom@…) et un numéro joignable. Le titre doit reprendre l'intitulé du poste visé.",
  profil: "En 3 à 4 phrases : qui vous êtes, ce que vous savez faire de mieux, ce que vous recherchez. Adaptez-le à chaque offre.",
  experiences: "Commencez par la plus récente. Pour chaque poste, 3 à 5 puces avec des verbes d'action et, si possible, des chiffres (volumes, résultats, délais).",
  formation: "Indiquez le diplôme, l'établissement et l'année d'obtention. Les stages peuvent aussi figurer dans les expériences.",
  competences: "8 à 12 compétences maximum, en reprenant les mots-clés des offres qui vous intéressent. Précisez votre niveau pour chaque langue.",
  finaliser: "Relisez-vous, demandez l'avis de l'assistant, puis téléchargez votre CV en PDF depuis l'aperçu.",
};

const EMPTY_ENTRY: CvEntry = { title: "", organization: "", start: "", end: "", description: "" };

type Props = {
  cvId: string;
  initial: CvDraft;
  initialPhotoUrl: string | null;
  isNew: boolean;
  aiEnabled: boolean;
  /** Téléchargement PDF inclus (abonné) */
  canDownload: boolean;
  /** Catalogue des modèles (code + modèles IA publiés). */
  templates: CatalogTemplate[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function CvEditor({ cvId, initial, initialPhotoUrl, isNew, aiEnabled, canDownload, templates }: Props) {
  const [cv, setCv] = useState<CvDraft>(initial);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [step, setStep] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const version = useRef(0);

  /** Toute modification passe par ici : marque le CV à enregistrer. */
  function update(patch: Partial<CvDraft>) {
    setCv((c) => ({ ...c, ...patch }));
    setSave("dirty");
    version.current += 1;
  }

  async function persist(snapshot: CvDraft, v: number) {
    setSave("saving");
    const res = await saveCvDraft(cvId, snapshot);
    if (res?.error || res?.fieldErrors) {
      setSave("error");
      setSaveError(res.error ?? Object.values(res.fieldErrors ?? {})[0] ?? "Erreur");
    } else if (v === version.current) {
      setSave("saved");
    }
  }

  // Enregistrement automatique 1,5 s après la dernière modification
  useEffect(() => {
    if (save !== "dirty") return;
    const v = version.current;
    const timer = setTimeout(() => void persist(cv, v), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist lit la version courante
  }, [cv, save]);

  const current = STEPS[step].key;

  const isLast = step === STEPS.length - 1;

  return (
    <div className="space-y-4 pb-28 lg:space-y-5 lg:pb-0">
      {/* Barre du haut : mobile d'abord (titre pleine largeur, actions dans la barre du bas) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Link href="/cv" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> Mes CV
          </Link>
          <SaveBadge state={save} error={saveError} />
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href={`/cv/${cvId}/apercu`}
              onClick={() => save === "dirty" && void persist(cv, version.current)}
              className="btn-secondary"
            >
              <Eye aria-hidden className="size-4" /> Aperçu
            </Link>
            <DownloadPdfButton cvId={cvId} locked={!canDownload} />
          </div>
        </div>
        <input
          aria-label="Nom du CV (visible par vous seul)"
          value={cv.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-xl font-bold hover:border-line focus:border-brand-600 focus:outline-none sm:text-2xl"
        />
      </div>

      {isNew && aiEnabled && <AiStart cv={cv} onFill={(fill) => update(mergeFill(cv, fill))} />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
        {/* Formulaire guidé */}
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* Étapes : bandeau défilant sur mobile, pastilles sur grand écran */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted lg:hidden">
              Étape {step + 1} / {STEPS.length} · <span className="text-ink">{STEPS[step].label}</span>
            </p>
            <ol
              className="-mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
              aria-label="Étapes"
            >
              {STEPS.map((s, i) => (
                <li key={s.key} className="shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={`chip py-1.5 ${i === step ? "chip-active" : "hover:border-ink"}`}
                  >
                    <span className="font-mono text-[10px] opacity-70">{i + 1}</span> {s.label}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line lg:hidden" aria-hidden>
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <p className="flex gap-2 rounded-xl bg-star-400/15 px-3 py-2.5 text-xs leading-relaxed sm:px-4 sm:py-3 sm:text-sm">
            <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{TIPS[current]}</span>
          </p>

          <div className="card space-y-5 p-4 sm:p-6">
            {current === "modele" && (
              <TemplateStep cv={cv} photoUrl={photoUrl} update={update} onPhoto={setPhotoUrl} subscribed={canDownload} templates={templates} />
            )}
            {current === "infos" && <InfoStep cv={cv} update={update} />}
            {current === "profil" && <ProfileStep cv={cv} update={update} aiEnabled={aiEnabled} />}
            {current === "experiences" && (
              <EntriesEditor
                key="experiences"
                entries={cv.experiences}
                onChange={(experiences) => update({ experiences })}
                labels={{ item: "Expérience", title: "Poste", organization: "Entreprise", add: "Ajouter une expérience" }}
                ai={aiEnabled ? { headline: cv.headline } : null}
              />
            )}
            {current === "formation" && (
              <>
                <EntriesEditor
                  key="education"
                  entries={cv.education}
                  onChange={(education) => update({ education })}
                  labels={{ item: "Formation", title: "Diplôme", organization: "Établissement", add: "Ajouter une formation" }}
                  ai={null}
                />
                <div className="border-t border-line pt-5">
                  <h3 className="mb-3 font-semibold">Certifications (facultatif)</h3>
                  <EntriesEditor
                    key="certifications"
                    entries={cv.certifications}
                    onChange={(certifications) => update({ certifications })}
                    labels={{ item: "Certification", title: "Certification", organization: "Organisme", add: "Ajouter une certification" }}
                    ai={null}
                    compact
                  />
                </div>
              </>
            )}
            {current === "competences" && <SkillsStep cv={cv} update={update} aiEnabled={aiEnabled} />}
            {current === "finaliser" && <FinalStep cv={cv} cvId={cvId} aiEnabled={aiEnabled} canDownload={canDownload} />}
          </div>

          {/* Navigation grand écran */}
          <div className="hidden items-center justify-between lg:flex">
            <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="btn-secondary">
              <ArrowLeft aria-hidden className="size-4" /> Précédent
            </button>
            {!isLast && (
              <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">
                {STEPS[step + 1].label} <ArrowRight aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Aperçu en direct (grand écran) */}
        <aside className="hidden lg:block" aria-label="Aperçu du CV">
          <div className="lg:sticky lg:top-24">
            <p className="mb-2 text-xs text-muted">Aperçu en direct · format A4</p>
            <CvPreview cv={cv} photoUrl={photoUrl} />
          </div>
        </aside>
      </div>

      {/* Mobile : barre d'actions fixe en bas, à portée de pouce */}
      <nav
        aria-label="Navigation de l'éditeur"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            aria-label="Étape précédente"
            className="btn-secondary size-12 shrink-0 p-0"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => setShowPreview(true)} className="btn-secondary h-12 flex-1">
            <Eye aria-hidden className="size-4" /> Aperçu
          </button>
          {isLast ? (
            <div className="flex-1">
              <DownloadPdfButton cvId={cvId} locked={!canDownload} className="btn-primary h-12 w-full" label="PDF" />
            </div>
          ) : (
            <button type="button" onClick={() => setStep(step + 1)} className="btn-primary h-12 flex-1">
              Suivant <ArrowRight aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile : aperçu plein écran */}
      {showPreview && (
        <div role="dialog" aria-modal="true" aria-label="Aperçu du CV" className="fixed inset-0 z-50 flex flex-col bg-surface lg:hidden">
          <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-3">
            <button type="button" onClick={() => setShowPreview(false)} className="btn-secondary size-10 shrink-0 p-0" aria-label="Fermer l'aperçu" autoFocus>
              <X aria-hidden className="size-5" />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{cv.title}</p>
            <DownloadPdfButton cvId={cvId} locked={!canDownload} className="btn-primary" label="PDF" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <CvPreview cv={cv} photoUrl={photoUrl} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Remplit le CV avec la proposition de l'IA sans écraser ce qui est déjà saisi. */
function mergeFill(cv: CvDraft, fill: AiFill): Partial<CvDraft> {
  return {
    headline: cv.headline || fill.headline,
    summary: cv.summary || fill.summary,
    experiences: cv.experiences.length ? cv.experiences : fill.experiences,
    education: cv.education.length ? cv.education : fill.education,
    certifications: cv.certifications.length ? cv.certifications : fill.certifications,
    skills: cv.skills.length ? cv.skills : fill.skills,
    languages: cv.languages.length ? cv.languages : fill.languages,
    interests: cv.interests.length ? cv.interests : fill.interests,
  };
}

function useAi() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (request: AiRequest, onOk: (r: Exclude<AiResult, { ok: false }>) => void) => {
    setError("");
    start(async () => {
      const res = await aiAssist(request);
      if (res.ok) onOk(res);
      else setError(res.error);
    });
  };
  return { pending, error, run };
}

function SaveBadge({ state, error }: { state: SaveState; error: string }) {
  if (state === "saving")
    return <span className="inline-flex items-center gap-1 text-xs text-muted"><Loader2 aria-hidden className="size-3.5 animate-spin" /> Enregistrement…</span>;
  if (state === "saved")
    return <span className="inline-flex items-center gap-1 text-xs text-brand-700"><Check aria-hidden className="size-3.5" /> Enregistré</span>;
  if (state === "dirty") return <span className="text-xs text-muted">Modifications en cours…</span>;
  if (state === "error") return <span role="alert" className="text-xs text-accent-600">{error}</span>;
  return null;
}

function AiButton({ onClick, pending, children }: { onClick: () => void; pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Sparkles aria-hidden className="size-3.5" />}
      {pending ? "L'assistant réfléchit…" : children}
    </button>
  );
}

function AiError({ message }: { message: string }) {
  return message ? <p role="alert" className="text-xs text-accent-600">{message}</p> : null;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Démarrage assisté
// ---------------------------------------------------------------------------
function AiStart({ cv, onFill }: { cv: CvDraft; onFill: (fill: AiFill) => void }) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const { pending, error, run } = useAi();
  if (!open) return null;

  return (
    <section className="relative space-y-3 rounded-2xl border-2 border-violet-200 bg-linear-to-br from-violet-50 to-fuchsia-50 p-5">
      <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="absolute top-3 right-3 rounded-full p-1 text-muted hover:bg-white">
        <X aria-hidden className="size-4" />
      </button>
      <h2 className="flex items-center gap-2 font-bold"><Wand2 aria-hidden className="size-5 text-violet-600" /> Démarrer avec l&apos;assistant IA</h2>
      {done ? (
        <p className="text-sm">
          C&apos;est prêt ! Vérifiez chaque étape : l&apos;assistant n&apos;invente rien, mais relisez les dates et complétez les
          « [à préciser] ».
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Décrivez votre parcours avec vos mots (postes, entreprises, dates, diplômes, compétences), ou collez le texte de
            votre ancien CV. L&apos;assistant remplit votre CV à votre place.
          </p>
          <label htmlFor="ai-start" className="sr-only">Votre parcours</label>
          <textarea
            id="ai-start"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex. : Je suis comptable depuis 3 ans chez Sahel Conseil à Bobo-Dioulasso (2022 – aujourd'hui). Avant, stage de 6 mois à la BICIAB. BTS en comptabilité (2021)… Je parle français et dioula, je maîtrise Excel et Sage."
            className="input bg-white"
          />
          <div className="flex flex-wrap items-center gap-3">
            <AiButton
              pending={pending}
              onClick={() => run({ kind: "fill", text }, (r) => {
                if (r.kind === "fill") {
                  onFill(r.data);
                  setDone(true);
                }
              })}
            >
              Remplir mon CV
            </AiButton>
            <span className="text-xs text-muted">
              {cv.experiences.length ? "Les sections déjà remplies ne seront pas remplacées." : "Prend environ 10 secondes."}
            </span>
          </div>
          <AiError message={error} />
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Étapes
// ---------------------------------------------------------------------------
type StepProps = { cv: CvDraft; update: (patch: Partial<CvDraft>) => void };

function TemplateStep({
  cv,
  photoUrl,
  update,
  onPhoto,
  subscribed,
  templates: catalog,
}: StepProps & { photoUrl: string | null; onPhoto: (url: string | null) => void; subscribed: boolean; templates: CatalogTemplate[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    const res = await uploadCvPhoto(file);
    setUploading(false);
    if ("error" in res) return setError(res.error);
    onPhoto(res.previewUrl);
    update({ photo_path: res.path });
  }

  // Modèle IA retiré depuis : le CV le garde, on l'affiche en tête de liste
  const templates =
    catalog.some((t) => t.value === cv.template) || !cv.template_spec
      ? catalog
      : [{ value: cv.template, label: "Modèle actuel", description: "Modèle retiré de la galerie", premium: false, spec: cv.template_spec, sample: null, custom: true }, ...catalog];
  const selected = templates.find((t) => t.value === cv.template);

  return (
    <>
      <fieldset>
        <legend className="label">Modèle</legend>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {templates.map((t) => (
            <label
              key={t.value}
              className={`card relative cursor-pointer p-1.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand-600 sm:p-2 ${cv.template === t.value ? "border-2 border-ink" : "hover:border-ink/30"}`}
            >
              <input type="radio" name="template" value={t.value} checked={cv.template === t.value} onChange={() => update({ template: t.value, template_spec: t.spec })} className="sr-only" />
              <TemplateThumb template={t} accent={cv.accent} />
              {t.premium && (
                <span className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-ink text-star-400 shadow-sm sm:size-6" title="Modèle Premium">
                  <Crown aria-hidden className="size-3 sm:size-3.5" />
                  <span className="sr-only">Premium</span>
                </span>
              )}
              <span className="mt-1.5 block truncate text-center text-xs font-semibold sm:text-left sm:text-sm">{t.label}</span>
              <span className="hidden truncate text-xs text-muted sm:block">{t.description}</span>
            </label>
          ))}
        </div>
        {selected?.premium && !subscribed && (
          <p className="mt-3 flex gap-2 rounded-xl border border-dashed border-ink/30 bg-cream px-3 py-2.5 text-sm">
            <Crown aria-hidden className="mt-0.5 size-4 shrink-0 text-star-400" />
            <span>
              <strong>Modèle Premium.</strong> Essayez-le librement : il est inclus, avec le téléchargement PDF, dans les{" "}
              <Link href="/abonnements" className="font-semibold text-brand-700 underline">abonnements</Link>.
            </span>
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="label">Couleur</legend>
        <div className="flex flex-wrap gap-2">
          {CV_ACCENTS.map((c) => (
            <label key={c.value} title={c.label} className="cursor-pointer">
              <input type="radio" name="accent" value={c.value} checked={cv.accent === c.value} onChange={() => update({ accent: c.value })} className="peer sr-only" />
              <span
                className="grid size-9 place-items-center rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600"
                style={{ background: c.value }}
              >
                {cv.accent === c.value && <Check aria-hidden className="size-4 text-white" />}
              </span>
              <span className="sr-only">{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="label">Photo de profil</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-20 place-items-center overflow-hidden rounded-full bg-surface text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local ou URL signée */}
            {photoUrl && cv.photo_path ? <img src={photoUrl} alt="Votre photo" className="size-full object-cover" /> : <Camera aria-hidden className="size-7" />}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="btn-secondary">
              {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Camera aria-hidden className="size-4" />}
              {cv.photo_path ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {cv.photo_path && (
              <button type="button" onClick={() => { update({ photo_path: null }); onPhoto(null); }} className="btn-secondary">
                <Trash2 aria-hidden className="size-4" /> Retirer
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        <p className="mt-2 text-xs text-muted">La photo est recadrée en carré automatiquement. Facultatif.</p>
        {error && <p role="alert" className="mt-1 text-xs text-accent-600">{error}</p>}
      </div>
    </>
  );
}

/** Vignette : le CV d'exemple du modèle, dans la couleur choisie. */
function TemplateThumb({ template, accent }: { template: CatalogTemplate; accent: string }) {
  const sample = sampleForTemplate(template);
  return (
    <span className="pointer-events-none block" aria-hidden>
      <CvPreview cv={{ ...sample.cv, accent }} photoUrl={sample.photo} />
    </span>
  );
}

function InfoStep({ cv, update }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField label="Nom complet" value={cv.full_name} onChange={(v) => update({ full_name: v })} placeholder="Awa Ouédraogo" />
      </div>
      <div className="sm:col-span-2">
        <TextField label="Titre du CV" value={cv.headline} onChange={(v) => update({ headline: v || null })} placeholder="Comptable confirmée · SYSCOHADA" hint="L'intitulé du poste que vous visez." />
      </div>
      <TextField label="E-mail" type="email" value={cv.email} onChange={(v) => update({ email: v || null })} />
      <TextField label="Téléphone" type="tel" value={cv.phone} onChange={(v) => update({ phone: v || null })} placeholder="+226 70 00 00 00" />
      <TextField label="Ville" value={cv.city} onChange={(v) => update({ city: v || null })} placeholder="Ouagadougou" />
      <TextField label="Site / LinkedIn" value={cv.website} onChange={(v) => update({ website: v || null })} placeholder="linkedin.com/in/…" hint="Facultatif." />
    </div>
  );
}

function ProfileStep({ cv, update, aiEnabled }: StepProps & { aiEnabled: boolean }) {
  const { pending, error, run } = useAi();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="summary" className="label mb-0">Résumé de profil</label>
        {aiEnabled && (
          <AiButton pending={pending} onClick={() => run({ kind: "summary", cv }, (r) => r.kind === "summary" && r.summary && update({ summary: r.summary }))}>
            {cv.summary ? "Réécrire avec l'IA" : "Rédiger avec l'IA"}
          </AiButton>
        )}
      </div>
      <textarea id="summary" rows={6} value={cv.summary ?? ""} onChange={(e) => update({ summary: e.target.value || null })} className="input" placeholder="Comptable avec 3 ans d'expérience en cabinet…" />
      <p className="text-right text-xs text-muted">{(cv.summary ?? "").length} caractères · idéal : 300 à 550</p>
      <AiError message={error} />
    </div>
  );
}

function EntriesEditor({
  entries,
  onChange,
  labels,
  ai,
  compact,
}: {
  entries: CvEntry[];
  onChange: (entries: CvEntry[]) => void;
  labels: { item: string; title: string; organization: string; add: string };
  ai: { headline: string | null } | null;
  compact?: boolean;
}) {
  const set = (i: number, patch: Partial<CvEntry>) => onChange(entries.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...entries];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {entries.map((e, i) => (
        <EntryCard
          key={i}
          index={i}
          entry={e}
          label={labels}
          compact={compact}
          ai={ai}
          canUp={i > 0}
          canDown={i < entries.length - 1}
          onSet={(patch) => set(i, patch)}
          onMove={(d) => move(i, d)}
          onRemove={() => onChange(entries.filter((_, j) => j !== i))}
        />
      ))}
      <button type="button" onClick={() => onChange([...entries, EMPTY_ENTRY])} className="btn-secondary">
        <Plus aria-hidden className="size-4" /> {labels.add}
      </button>
    </div>
  );
}

function EntryCard({
  index,
  entry,
  label,
  compact,
  ai,
  canUp,
  canDown,
  onSet,
  onMove,
  onRemove,
}: {
  index: number;
  entry: CvEntry;
  label: { item: string; title: string; organization: string };
  compact?: boolean;
  ai: { headline: string | null } | null;
  canUp: boolean;
  canDown: boolean;
  onSet: (patch: Partial<CvEntry>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const { pending, error, run } = useAi();
  const id = (f: string) => `${label.item}-${index}-${f}`;

  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <legend className="sr-only">{label.item} {index + 1}</legend>
      <div className="flex items-center gap-1">
        <span className="flex-1 text-sm font-semibold">{entry.title || `${label.item} ${index + 1}`}</span>
        <button type="button" disabled={!canUp} onClick={() => onMove(-1)} aria-label="Monter" className="rounded-full p-1.5 hover:bg-surface disabled:opacity-30"><ArrowUp aria-hidden className="size-4" /></button>
        <button type="button" disabled={!canDown} onClick={() => onMove(1)} aria-label="Descendre" className="rounded-full p-1.5 hover:bg-surface disabled:opacity-30"><ArrowDown aria-hidden className="size-4" /></button>
        <button type="button" onClick={onRemove} aria-label="Supprimer" className="rounded-full p-1.5 text-accent-600 hover:bg-accent-500/5"><Trash2 aria-hidden className="size-4" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={id("title")} className="label">{label.title}</label>
          <input id={id("title")} value={entry.title} onChange={(e) => onSet({ title: e.target.value })} className="input" />
        </div>
        <div>
          <label htmlFor={id("org")} className="label">{label.organization}</label>
          <input id={id("org")} value={entry.organization} onChange={(e) => onSet({ organization: e.target.value })} className="input" />
        </div>
        <div>
          <label htmlFor={id("start")} className="label">Début</label>
          <input id={id("start")} value={entry.start} onChange={(e) => onSet({ start: e.target.value })} placeholder="Ex. Janv. 2022" className="input" />
        </div>
        <div>
          <label htmlFor={id("end")} className="label">Fin</label>
          <input id={id("end")} value={entry.end} onChange={(e) => onSet({ end: e.target.value })} placeholder="Ex. Aujourd'hui" className="input" />
        </div>
      </div>
      {!compact && (
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={id("desc")} className="text-sm font-medium">Missions et réalisations</label>
            {ai && (
              <AiButton
                pending={pending}
                onClick={() => run({ kind: "experience", entry, headline: ai.headline }, (r) => r.kind === "experience" && r.description && onSet({ description: r.description }))}
              >
                {entry.description ? "Améliorer avec l'IA" : "Rédiger avec l'IA"}
              </AiButton>
            )}
          </div>
          <textarea
            id={id("desc")}
            rows={5}
            value={entry.description}
            onChange={(e) => onSet({ description: e.target.value })}
            placeholder={"- Tenue de la comptabilité de 40 PME clientes\n- Préparation des déclarations fiscales mensuelles"}
            className="input"
          />
          <p className="mt-1 text-xs text-muted">Une ligne par point, commencez par « - ».</p>
          <AiError message={error} />
        </div>
      )}
    </fieldset>
  );
}

function ChipsInput({ id, label, values, onChange, placeholder }: {
  id: string; label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (v: string) => {
    const value = v.trim().replace(/,/g, "");
    if (value && !values.some((x) => x.toLowerCase() === value.toLowerCase())) onChange([...values, value]);
    setDraft("");
  };
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="input flex flex-wrap items-center gap-1.5 py-2">
        {values.map((v) => (
          <span key={v} className="chip chip-active">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Retirer ${v}`}><X aria-hidden className="size-3.5" /></button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          placeholder={placeholder}
          className="min-w-28 flex-1 bg-transparent text-base outline-none sm:text-sm"
        />
      </div>
    </div>
  );
}

function SkillsStep({ cv, update, aiEnabled }: StepProps & { aiEnabled: boolean }) {
  const { pending, error, run } = useAi();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fresh = suggestions.filter((s) => !cv.skills.some((k) => k.toLowerCase() === s.toLowerCase()));

  return (
    <div className="space-y-5">
      <ChipsInput id="skills" label="Compétences" values={cv.skills} onChange={(skills) => update({ skills })} placeholder="Ajouter puis Entrée…" />
      {aiEnabled && (
        <div className="space-y-2">
          <AiButton pending={pending} onClick={() => run({ kind: "skills", cv }, (r) => r.kind === "skills" && setSuggestions(r.skills))}>
            Suggérer des compétences
          </AiButton>
          {fresh.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">Cliquez pour ajouter :</span>
              {fresh.map((s) => (
                <button key={s} type="button" onClick={() => update({ skills: [...cv.skills, s] })} className="chip border-violet-200 bg-violet-50 hover:border-violet-400">
                  <Plus aria-hidden className="size-3" /> {s}
                </button>
              ))}
            </div>
          )}
          <AiError message={error} />
        </div>
      )}
      <ChipsInput id="languages" label="Langues" values={cv.languages} onChange={(languages) => update({ languages })} placeholder="Français (courant), Mooré (natif)…" />
      <ChipsInput id="interests" label="Centres d'intérêt (facultatif)" values={cv.interests} onChange={(interests) => update({ interests })} placeholder="Football, lecture, bénévolat…" />
    </div>
  );
}

function FinalStep({ cv, cvId, aiEnabled, canDownload }: { cv: CvDraft; cvId: string; aiEnabled: boolean; canDownload: boolean }) {
  const { pending, error, run } = useAi();
  const [review, setReview] = useState<{ score: number; tips: string[] } | null>(null);
  const missing = [
    !cv.full_name && "votre nom",
    !cv.headline && "le titre du CV",
    !(cv.email || cv.phone) && "un moyen de contact",
    !cv.summary && "le résumé de profil",
    !cv.experiences.length && "au moins une expérience",
    !cv.education.length && "votre formation",
    cv.skills.length < 4 && "quelques compétences",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {missing.length ? (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm">Il manque encore : {missing.join(", ")}.</p>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800"><Check aria-hidden className="size-4" /> Toutes les sections essentielles sont remplies.</p>
      )}

      {aiEnabled && (
        <div className="space-y-3">
          <AiButton pending={pending} onClick={() => run({ kind: "review", cv }, (r) => r.kind === "review" && setReview({ score: r.score, tips: r.tips }))}>
            Faire relire mon CV par l&apos;IA
          </AiButton>
          <AiError message={error} />
          {review && (
            <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{review.score}</span>
                <span className="text-sm text-muted">/ 100 selon l&apos;assistant</span>
              </div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {review.tips.map((t) => <li key={t}>{t}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {!canDownload && (
        <p className="rounded-xl border border-dashed border-brand-600/50 bg-cream px-4 py-3 text-sm">
          <strong>Votre CV est prêt !</strong> Le téléchargement en PDF est inclus dans les{" "}
          <Link href="/abonnements" className="font-semibold text-brand-700 underline">abonnements</Link>.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <DownloadPdfButton cvId={cvId} locked={!canDownload} className="btn-primary w-full py-3 sm:flex-1" />
        <Link href={`/cv/${cvId}/apercu`} className="btn-secondary w-full py-3 sm:w-auto">Aperçu pleine page</Link>
      </div>
    </div>
  );
}
