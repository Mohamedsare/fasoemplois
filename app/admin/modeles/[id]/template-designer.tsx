"use client";

import { ArrowDown, ArrowUp, Crown, Loader2, Save, Send, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateTemplateAction, saveTemplateAction } from "@/app/actions/admin-templates";
import { CvPreview } from "@/components/cv-preview";
import { CV_ACCENTS } from "@/lib/constants";
import { SAMPLE_PEOPLE, sampleForTemplate } from "@/lib/sample-cvs";
import { MAIN_KEYS, SECTION_LABELS, SIDEBAR_KEYS, SPEC_OPTIONS, type SectionKey, type TemplateSpec } from "@/lib/template-spec";

type Initial = {
  id: string | null;
  name: string;
  description: string;
  premium: boolean;
  sample: string;
  prompt: string | null;
  spec: TemplateSpec | null;
  published: boolean;
};

const IDEAS = [
  "Sobre et rassurant pour la banque et la finance",
  "Moderne et audacieux pour un développeur web",
  "Élégant et classique pour une juriste",
  "Créatif et coloré pour un graphiste",
  "Clair et aéré pour le secteur de la santé",
  "Frise chronologique pour un ingénieur BTP",
];

const TWEAKS = ["En-tête plus sombre", "Plus aéré", "Plus compact pour tenir sur une page", "Typographie plus élégante", "Colonne à droite", "Sans photo"];

export function TemplateDesigner({ initial, aiEnabled }: { initial: Initial; aiEnabled: boolean }) {
  const router = useRouter();
  const [id, setId] = useState(initial.id);
  const [spec, setSpec] = useState<TemplateSpec | null>(initial.spec);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [premium, setPremium] = useState(initial.premium);
  const [sample, setSample] = useState(initial.sample);
  const [accent, setAccent] = useState(initial.spec?.defaultAccent ?? CV_ACCENTS[0].value);
  const [brief, setBrief] = useState("");
  const [lastPrompt, setLastPrompt] = useState(initial.prompt);
  const [published, setPublished] = useState(initial.published);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  const set = <K extends keyof TemplateSpec>(key: K, value: TemplateSpec[K]) => spec && setSpec({ ...spec, [key]: value });

  function generate(prompt: string, modify: boolean) {
    setMessage(null);
    startGenerate(async () => {
      const res = await generateTemplateAction({ brief: prompt, current: modify && spec ? { spec, name, description } : null });
      if (res.error || !res.result) return setMessage({ tone: "error", text: res.error ?? "La génération a échoué." });
      setSpec(res.result.spec);
      setName(res.result.name);
      setDescription(res.result.description);
      if (!modify) setSample(res.result.sample);
      setAccent(res.result.spec.defaultAccent);
      setLastPrompt(prompt);
      setBrief("");
    });
  }

  function save(publish: boolean) {
    if (!spec) return;
    setMessage(null);
    startSave(async () => {
      const res = await saveTemplateAction({ id, name, description, premium, sample, prompt: lastPrompt, spec: { ...spec, defaultAccent: accent }, publish });
      if (res.error) return setMessage({ tone: "error", text: res.error });
      setPublished(publish);
      setMessage({ tone: "success", text: res.success ?? "Enregistré." });
      if (!id && res.id) {
        setId(res.id);
        router.replace(`/admin/modeles/${res.id}`);
      }
      router.refresh();
    });
  }

  const preview = spec ? sampleForTemplate({ value: id ?? "ia-apercu", spec, sample }) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      <div className="min-w-0 space-y-5">
        {/* 1. Consigne à l'IA */}
        <section className="card space-y-3 border-violet-200 p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles aria-hidden className="size-4 text-violet-600" /> {spec ? "Modifier avec l'IA" : "Décrire le modèle"}
          </h2>
          {!aiEnabled && <p className="text-sm text-accent-600">Assistant IA non configuré (OPENAI_API_KEY) : utilisez les réglages manuels.</p>}
          <label htmlFor="brief" className="sr-only">Consigne</label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={spec ? "Ex. rends l'en-tête plus sombre et passe la colonne à droite" : "Ex. un modèle élégant pour des cadres de la banque, avec une colonne sombre et des titres à empattements"}
            className="input"
          />
          <div className="flex flex-wrap gap-2">
            {(spec ? TWEAKS : IDEAS).map((t) => (
              <button key={t} type="button" onClick={() => setBrief(t)} className="chip hover:border-violet-300">
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" disabled={generating || !aiEnabled || brief.trim().length < 5} onClick={() => generate(brief, Boolean(spec))} className="btn bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
              {generating ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Wand2 aria-hidden className="size-4" />}
              {generating ? "L'IA dessine le modèle…" : spec ? "Appliquer la modification" : "Générer avec l'IA"}
            </button>
            {spec && (
              <button type="button" disabled={generating || !aiEnabled || brief.trim().length < 5} onClick={() => generate(brief, false)} className="btn-secondary disabled:opacity-50">
                Repartir de zéro avec cette consigne
              </button>
            )}
          </div>
          {!spec && (
            <button type="button" onClick={() => { setSpec(sanitizeDefault()); if (!name) setName("Nouveau modèle"); }} className="text-sm text-muted underline hover:text-ink">
              Ou partir d&apos;un modèle vierge et tout régler à la main
            </button>
          )}
          {lastPrompt && <p className="text-xs text-muted">Dernière consigne : « {lastPrompt} »</p>}
        </section>

        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${message.tone === "error" ? "border-accent-500/30 bg-accent-500/5 text-accent-600" : "border-brand-600/30 bg-brand-50 text-brand-800"}`}>
            {message.text}
          </p>
        )}

        {spec && (
          <>
            {/* 2. Nom et publication */}
            <section className="card space-y-4 p-5">
              <h2 className="font-semibold">Nom et publication</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  Nom du modèle
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="input font-normal" />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  Description
                  <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} className="input font-normal" />
                </label>
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="mt-0.5 size-4 accent-brand-600" />
                <span>
                  <span className="inline-flex items-center gap-1 font-medium"><Crown aria-hidden className="size-3.5 text-star-400" /> Modèle Premium</span>
                  <span className="block text-xs text-muted">Inclus dans les abonnements. Sinon, il est proposé gratuitement.</span>
                </span>
              </label>
              <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row">
                <button type="button" disabled={saving} onClick={() => save(published)} className="btn-secondary">
                  {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
                  {published ? "Enregistrer (reste publié)" : "Enregistrer le brouillon"}
                </button>
                {!published ? (
                  <button type="button" disabled={saving} onClick={() => save(true)} className="btn-primary">
                    <Send aria-hidden className="size-4" /> Publier pour les utilisateurs
                  </button>
                ) : (
                  <button type="button" disabled={saving} onClick={() => save(false)} className="btn-secondary">Retirer de la galerie</button>
                )}
              </div>
              <p className="text-xs text-muted">
                {published ? "Publié : visible dans la galerie et l'éditeur de CV." : "Brouillon : visible uniquement dans le back-office."}
              </p>
            </section>

            {/* 3. Réglages fins */}
            <section className="card divide-y divide-line">
              <h2 className="p-5 font-semibold">Réglages fins</h2>
              <Group title="Mise en page" open>
                <Choice label="Disposition" k="layout" spec={spec} set={set} />
                {spec.layout !== "single" && (
                  <>
                    <Choice label="Colonne latérale" k="sidebarStyle" spec={spec} set={set} />
                    <Range label="Largeur de la colonne" unit="mm" min={56} max={80} value={spec.sidebarWidth} onChange={(v) => set("sidebarWidth", v)} />
                    <fieldset className="sm:col-span-2">
                      <legend className="mb-1.5 text-sm font-medium">Sections dans la colonne</legend>
                      <div className="flex flex-wrap gap-2">
                        {SIDEBAR_KEYS.map((k) => {
                          const on = spec.sidebarSections.includes(k);
                          return (
                            <label key={k} className={`chip cursor-pointer ${on ? "chip-active" : ""}`}>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={on}
                                onChange={() => set("sidebarSections", on ? spec.sidebarSections.filter((x) => x !== k) : [...spec.sidebarSections, k])}
                              />
                              {SECTION_LABELS[k]}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </>
                )}
                <Choice label="Densité" k="density" spec={spec} set={set} />
                <Choice label="Fond de page" k="background" spec={spec} set={set} />
                <Choice label="Barre d'accent" k="accentBar" spec={spec} set={set} />
              </Group>
              <Group title="En-tête et photo">
                <Choice label="En-tête" k="header" spec={spec} set={set} />
                {(spec.header === "band" || spec.header === "card") && <Choice label="Couleur de l'en-tête" k="headerColor" spec={spec} set={set} />}
                <Choice label="Photo" k="photo" spec={spec} set={set} />
                {spec.photo !== "none" && (
                  <>
                    <Choice label="Forme de la photo" k="photoShape" spec={spec} set={set} />
                    <Range label="Taille de la photo" unit="mm" min={22} max={42} value={spec.photoSize} onChange={(v) => set("photoSize", v)} />
                  </>
                )}
              </Group>
              <Group title="Typographie">
                <Choice label="Police des titres" k="headingFont" spec={spec} set={set} />
                <Choice label="Police du texte" k="bodyFont" spec={spec} set={set} />
                <Range label="Taille du nom" unit="pt" min={18} max={34} value={spec.nameSize} onChange={(v) => set("nameSize", v)} />
                <label className="space-y-1.5 text-sm font-medium">
                  Graisse du nom
                  <select value={spec.nameWeight} onChange={(e) => set("nameWeight", Number(e.target.value) as TemplateSpec["nameWeight"])} className="input font-normal">
                    {[300, 400, 600, 700, 800].map((w) => <option key={w} value={w}>{({ 300: "Fine", 400: "Normale", 600: "Demi-grasse", 700: "Grasse", 800: "Très grasse" } as Record<number, string>)[w]}</option>)}
                  </select>
                </label>
                <Choice label="Titre professionnel" k="headlineStyle" spec={spec} set={set} />
                <Toggle label="Nom en majuscules" checked={spec.nameUppercase} onChange={(v) => set("nameUppercase", v)} />
              </Group>
              <Group title="Sections">
                <Choice label="Style des titres" k="sectionTitle" spec={spec} set={set} />
                <Choice label="Couleur des titres" k="titleColor" spec={spec} set={set} />
                <Choice label="Expériences" k="entryStyle" spec={spec} set={set} />
                <Choice label="Dates" k="dateStyle" spec={spec} set={set} />
                <Choice label="Compétences" k="skillStyle" spec={spec} set={set} />
                <Toggle label="Titres en majuscules" checked={spec.titleUppercase} onChange={(v) => set("titleUppercase", v)} />
                <OrderEditor order={spec.mainOrder} hidden={spec.layout === "single" ? [] : spec.sidebarSections} onChange={(o) => set("mainOrder", o)} />
              </Group>
            </section>
          </>
        )}
      </div>

      {/* Aperçu en direct */}
      <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <div className="card space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-semibold">Aperçu</h2>
            <label className="sr-only" htmlFor="sample">Personne d&apos;exemple</label>
            <select id="sample" value={sample} onChange={(e) => setSample(e.target.value)} className="input w-full min-w-0 py-1.5 text-sm sm:w-auto sm:max-w-64">
              {SAMPLE_PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.headline}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur d'accent">
            {CV_ACCENTS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={accent === c.value}
                title={c.label}
                onClick={() => setAccent(c.value)}
                className={`size-7 rounded-full ring-offset-2 ${accent === c.value ? "ring-2 ring-ink" : ""}`}
                style={{ background: c.value }}
              >
                <span className="sr-only">{c.label}</span>
              </button>
            ))}
          </div>
          {preview ? (
            <div className={generating ? "opacity-50 transition-opacity" : "transition-opacity"}>
              <CvPreview cv={{ ...preview.cv, accent }} photoUrl={preview.photo} />
            </div>
          ) : (
            <div className="grid aspect-[210/297] place-items-center rounded-lg border-2 border-dashed border-line p-6 text-center text-sm text-muted">
              {generating ? <Loader2 aria-hidden className="size-6 animate-spin" /> : "Décrivez le modèle souhaité : l'aperçu apparaîtra ici."}
            </div>
          )}
          <p className="text-xs text-muted">La couleur choisie ici devient la couleur proposée par défaut ; chaque utilisateur peut la changer.</p>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contrôles
// ---------------------------------------------------------------------------

function sanitizeDefault(): TemplateSpec {
  return {
    layout: "single",
    sidebarWidth: 66,
    sidebarStyle: "tint",
    header: "classic",
    headerColor: "none",
    photo: "header",
    photoShape: "circle",
    photoSize: 30,
    headingFont: "sans",
    bodyFont: "sans",
    nameSize: 26,
    nameWeight: 700,
    nameUppercase: false,
    headlineStyle: "accent",
    sectionTitle: "underline",
    titleUppercase: true,
    titleColor: "ink",
    entryStyle: "stacked",
    dateStyle: "muted",
    skillStyle: "inline",
    sidebarSections: ["contact", "skills", "languages", "interests"],
    mainOrder: [...MAIN_KEYS],
    accentBar: "none",
    background: "white",
    density: "normal",
    defaultAccent: CV_ACCENTS[0].value,
  };
}

function Group({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-semibold">
        {title}
        <span aria-hidden className="text-lg text-muted transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">{children}</div>
    </details>
  );
}

type OptionKey = keyof typeof SPEC_OPTIONS;

function Choice<K extends OptionKey & keyof TemplateSpec>({
  label,
  k,
  spec,
  set,
}: {
  label: string;
  k: K;
  spec: TemplateSpec;
  set: <P extends keyof TemplateSpec>(key: P, value: TemplateSpec[P]) => void;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      {label}
      <select value={String(spec[k])} onChange={(e) => set(k, e.target.value as TemplateSpec[K])} className="input font-normal">
        {Object.entries(SPEC_OPTIONS[k]).map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </label>
  );
}

function Range({ label, unit, min, max, value, onChange }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span className="flex justify-between">{label} <span className="font-normal text-muted">{value} {unit}</span></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-600" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 self-end pb-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand-600" />
      {label}
    </label>
  );
}

function OrderEditor({ order, hidden, onChange }: { order: SectionKey[]; hidden: SectionKey[]; onChange: (o: SectionKey[]) => void }) {
  const visible = order.filter((k) => !hidden.includes(k));
  const move = (k: SectionKey, dir: -1 | 1) => {
    const i = visible.indexOf(k);
    const j = i + dir;
    if (j < 0 || j >= visible.length) return;
    const swapped = [...visible];
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    onChange([...swapped, ...order.filter((x) => hidden.includes(x))]);
  };
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1.5 text-sm font-medium">Ordre de la colonne principale</legend>
      <ol className="divide-y divide-line rounded-xl border border-line">
        {visible.map((k, i) => (
          <li key={k} className="flex items-center gap-2 px-3 py-1.5 text-sm">
            <span className="w-5 text-xs text-muted">{i + 1}</span>
            <span className="flex-1">{SECTION_LABELS[k]}</span>
            <button type="button" onClick={() => move(k, -1)} disabled={i === 0} className="grid size-8 place-items-center rounded-full hover:bg-surface disabled:opacity-30" aria-label={`Monter ${SECTION_LABELS[k]}`}>
              <ArrowUp aria-hidden className="size-4" />
            </button>
            <button type="button" onClick={() => move(k, 1)} disabled={i === visible.length - 1} className="grid size-8 place-items-center rounded-full hover:bg-surface disabled:opacity-30" aria-label={`Descendre ${SECTION_LABELS[k]}`}>
              <ArrowDown aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ol>
    </fieldset>
  );
}
