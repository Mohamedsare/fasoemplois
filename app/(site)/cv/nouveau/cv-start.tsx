"use client";

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Crown,
  FileText,
  FileUp,
  ImageIcon,
  Loader2,
  Mic,
  PenLine,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { aiAssist, aiImport, type AiFill, type AiResult } from "@/app/actions/cv-ai";
import { createCvFromStart, setCvTemplate } from "@/app/actions/cv";
import { CvPreview } from "@/components/cv-preview";
import { DictateButton } from "@/components/dictate-button";
import { TemplatePicker } from "@/components/template-picker";
import { CV_IMPORT_ACCEPT, CV_IMPORT_MAX_FILES, VOICE_MAX_SECONDS } from "@/lib/constants";
import { formatSize, isImageFile, prepareImportFiles, transcribeBlob } from "@/lib/cv-import-client";
import { formatDuration, useRecorder } from "@/lib/use-recorder";
import type { CatalogTemplate } from "@/lib/template-spec";
import type { CvDraft } from "@/lib/types";

type Mode = "import" | "voice" | "text";
type Phase = "choose" | "input" | "working" | "done" | "failed";

export type StartDefaults = Pick<CvDraft, "full_name" | "email" | "phone" | "city" | "headline" | "skills" | "languages">;

type Props = {
  aiEnabled: boolean;
  templates: CatalogTemplate[];
  initialTemplate: string;
  defaults: StartDefaults;
  firstName: string;
  /** Premier CV du compte : message d'accueil, sortie vers l'espace. */
  isFirst: boolean;
  subscribed: boolean;
};

const MIN_STORY = 40;
const DRAFT_KEY = "votrecv:nouveau-cv";

const WORKING_MESSAGES: Record<Mode, string[]> = {
  import: [
    "Lecture de votre ancien CV…",
    "Repérage de vos expériences et diplômes…",
    "Reformulation avec des verbes d'action…",
    "Rédaction de votre résumé de profil…",
    "Dernières vérifications…",
  ],
  voice: [
    "Analyse de votre récit…",
    "Mise en ordre de votre parcours…",
    "Rédaction de vos expériences…",
    "Sélection de vos compétences clés…",
    "Dernières vérifications…",
  ],
  text: [
    "Analyse de votre texte…",
    "Mise en ordre de votre parcours…",
    "Rédaction de vos expériences…",
    "Sélection de vos compétences clés…",
    "Dernières vérifications…",
  ],
};

const VOICE_TOPICS = [
  "Le poste que vous recherchez",
  "Vos expériences : poste, entreprise, ville, dates et ce que vous faisiez",
  "Vos diplômes et formations (établissement, année)",
  "Vos langues, logiciels et points forts",
];

function readDraft(): { story: string; target: string; notes: string } {
  const empty = { story: "", target: "", notes: "" };
  if (typeof window === "undefined") return empty;
  try {
    return { ...empty, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") };
  } catch {
    return empty;
  }
}

export function CvStart({ aiEnabled, templates, initialTemplate, defaults, firstName, isFirst, subscribed }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("import");
  const [phase, setPhase] = useState<Phase>("choose");
  const [template, setTemplate] = useState(initialTemplate);
  const templateRef = useRef(initialTemplate);
  // Brouillon gardé le temps de la session : un rechargement ne fait pas perdre une longue dictée
  const [draft] = useState(readDraft);
  const [story, setStory] = useState(draft.story);
  const [target, setTarget] = useState(draft.target);
  const [notes, setNotes] = useState(draft.notes);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [fill, setFill] = useState<AiFill | null>(null);
  const [created, setCreated] = useState<{ id: string; template: string } | null>(null);
  const [opening, setOpening] = useState(false);
  const [blankPending, setBlankPending] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ story, target, notes }));
    } catch {
      // Stockage indisponible (navigation privée) : sans conséquence
    }
  }, [story, target, notes]);

  // Avertit avant de quitter pendant que l'IA rédige
  useEffect(() => {
    if (phase !== "working") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  function pickTemplate(t: CatalogTemplate) {
    setTemplate(t.value);
    templateRef.current = t.value;
  }

  function choose(m: Mode) {
    setMode(m);
    setError("");
    setPhase("input");
    window.scrollTo({ top: 0 });
  }

  async function createWith(data: AiFill) {
    const chosen = templateRef.current;
    const out = await createCvFromStart({ template: chosen, fill: data }).catch(() => ({ error: "Connexion perdue. Réessayez." }));
    if ("error" in out) {
      setError(out.error);
      setPhase("failed");
      return;
    }
    setCreated({ id: out.id, template: chosen });
    setPhase("done");
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  async function run() {
    setError("");
    setFill(null);
    setCreated(null);

    let res: AiResult;
    if (mode === "import") {
      setPhase("working");
      window.scrollTo({ top: 0 });
      // Photos allégées dans le navigateur avant l'envoi (réseau mobile)
      const prepared = await prepareImportFiles(files);
      if ("error" in prepared) {
        setError(prepared.error);
        setPhase("input");
        return;
      }
      const form = new FormData();
      prepared.files.forEach((f) => form.append("files", f));
      form.append("notes", notes);
      form.append("target", target);
      res = await aiImport(form).catch(() => ({ ok: false as const, error: "Connexion perdue pendant l'envoi. Vérifiez votre réseau et réessayez." }));
    } else {
      if (story.trim().length < MIN_STORY) return setError("Racontez votre parcours en quelques phrases de plus.");
      setPhase("working");
      window.scrollTo({ top: 0 });
      res = await aiAssist({ kind: "fill", text: story, target }).catch(() => ({ ok: false as const, error: "Connexion perdue. Vérifiez votre réseau et réessayez." }));
    }

    if (!res.ok || res.kind !== "fill") {
      setError(res.ok ? "Réponse inattendue de l'assistant." : res.error);
      setPhase("failed");
      return;
    }
    setFill(res.data);
    await createWith(res.data);
  }

  async function open() {
    if (!created) return;
    setOpening(true);
    if (template !== created.template) await setCvTemplate(created.id, template).catch(() => null);
    router.push(`/cv/${created.id}?pret=1`);
  }

  async function startBlank() {
    setBlankPending(true);
    setError("");
    const out = await createCvFromStart({ template: templateRef.current }).catch(() => ({ error: "Connexion perdue. Réessayez." }));
    if ("error" in out) {
      setError(out.error);
      setBlankPending(false);
      return;
    }
    router.push(`/cv/${out.id}?nouveau=1`);
  }

  const stepIndex = phase === "choose" ? 0 : phase === "input" ? 1 : 2;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 sm:space-y-8">
      <div className="flex min-h-10 items-center justify-between gap-3">
        {phase === "choose" ? (
          <Link href={isFirst ? "/espace" : "/cv"} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> {isFirst ? "Mon espace" : "Mes CV"}
          </Link>
        ) : phase === "input" || phase === "failed" ? (
          <button type="button" onClick={() => { setPhase(phase === "failed" ? "input" : "choose"); setError(""); }} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft aria-hidden className="size-4" /> Retour
          </button>
        ) : (
          <span />
        )}
        {aiEnabled && <Stepper current={stepIndex} />}
      </div>

      {phase === "choose" && (
        <ChooseStep
          aiEnabled={aiEnabled}
          firstName={firstName}
          isFirst={isFirst}
          onChoose={choose}
          onBlank={startBlank}
          blankPending={blankPending}
          error={error}
        />
      )}

      {phase === "input" && (
        <div className="mx-auto max-w-2xl space-y-6">
          {mode === "import" && <ImportStep files={files} setFiles={setFiles} notes={notes} setNotes={setNotes} />}
          {mode === "voice" && <VoiceStep story={story} setStory={setStory} onWrite={() => setMode("text")} />}
          {mode === "text" && <TextStep story={story} setStory={setStory} onSpeak={() => setMode("voice")} />}

          <div>
            <label htmlFor="target" className="label">
              Poste visé <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Ex. : Comptable, Assistante de direction, Chauffeur…"
              className="input"
              maxLength={120}
            />
            <p className="mt-1 text-xs text-muted">L&apos;IA oriente votre titre, votre résumé et vos compétences vers ce poste.</p>
          </div>

          {error && <p role="alert" className="rounded-xl bg-accent-500/5 px-4 py-3 text-sm text-accent-600">{error}</p>}

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={mode === "import" ? !files.length : story.trim().length < MIN_STORY}
              className="btn h-14 w-full bg-linear-to-r from-violet-600 to-fuchsia-600 text-base text-white shadow-lg shadow-violet-600/20 hover:opacity-95"
            >
              <Sparkles aria-hidden className="size-5" />
              {mode === "import" ? "Créer mon nouveau CV" : "Créer mon CV avec l'IA"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldCheck aria-hidden className="size-3.5" /> Environ 20 secondes · L&apos;IA n&apos;invente rien, vous relisez tout ensuite
            </p>
          </div>
        </div>
      )}

      {(phase === "working" || phase === "done" || phase === "failed") && (
        <ResultView
          mode={mode}
          phase={phase}
          error={error}
          fill={fill}
          defaults={defaults}
          templates={templates}
          template={template}
          onTemplate={pickTemplate}
          subscribed={subscribed}
          opening={opening}
          onOpen={() => void open()}
          onRetry={() => void (fill ? createWith(fill) : run())}
          onEdit={() => { setPhase("input"); setError(""); }}
          onBlank={() => void startBlank()}
          blankPending={blankPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// En-tête : progression
// ---------------------------------------------------------------------------
function Stepper({ current }: { current: number }) {
  const steps = ["Méthode", "Votre parcours", "Votre CV"];
  return (
    <ol className="flex items-center gap-1.5 text-xs" aria-label="Progression">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5" aria-current={i === current ? "step" : undefined}>
          <span
            className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
              i < current ? "bg-brand-600 text-white" : i === current ? "bg-ink text-white" : "bg-surface text-muted"
            }`}
          >
            {i < current ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === current ? "font-semibold text-ink" : "text-muted"}`}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden className="h-px w-4 bg-line sm:w-6" />}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Étape 1 : choisir la méthode
// ---------------------------------------------------------------------------
function ChooseStep({
  aiEnabled,
  firstName,
  isFirst,
  onChoose,
  onBlank,
  blankPending,
  error,
}: {
  aiEnabled: boolean;
  firstName: string;
  isFirst: boolean;
  onChoose: (m: Mode) => void;
  onBlank: () => void;
  blankPending: boolean;
  error: string;
}) {
  const title = isFirst ? `Bienvenue${firstName ? ` ${firstName}` : ""} ! Créons votre CV` : "Créer un nouveau CV";

  if (!aiEnabled) {
    return (
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-[1.75rem] leading-tight font-bold sm:text-4xl">{title}</h1>
        <p className="text-muted">Remplissez votre CV étape par étape, avec un aperçu en direct, puis téléchargez-le en PDF.</p>
        {error && <p role="alert" className="text-sm text-accent-600">{error}</p>}
        <button type="button" onClick={onBlank} disabled={blankPending} className="btn-primary h-14 w-full text-base sm:w-auto sm:px-8">
          {blankPending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Plus aria-hidden className="size-5" />} Commencer mon CV
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-[1.75rem] leading-tight font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted sm:text-lg">
          Choisissez la méthode la plus simple pour vous. L&apos;IA rédige, vous n&apos;avez plus qu&apos;à relire.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <MethodCard
          icon={FileUp}
          tone="bg-brand-50 text-brand-700"
          badge="Le plus rapide"
          title="J'ai déjà un CV"
          text="Importez-le en PDF, Word ou en photo : l'IA en fait un nouveau CV, mieux rédigé."
          onClick={() => onChoose("import")}
        />
        <MethodCard
          icon={Mic}
          tone="bg-violet-50 text-violet-700"
          badge="Sans rien écrire"
          title="Je raconte mon parcours"
          text="Parlez naturellement, comme à un ami. L'IA transforme votre récit en CV."
          onClick={() => onChoose("voice")}
        />
        <MethodCard
          icon={PenLine}
          tone="bg-star-400/20 text-ink"
          title="J'écris quelques lignes"
          text="Décrivez votre parcours avec vos mots, sans vous soucier de la forme."
          onClick={() => onChoose("text")}
        />
      </div>

      {error && <p role="alert" className="text-center text-sm text-accent-600">{error}</p>}

      <p className="text-center text-sm text-muted">
        Vous préférez tout remplir vous-même ?{" "}
        <button type="button" onClick={onBlank} disabled={blankPending} className="inline-flex items-center gap-1 font-semibold text-ink underline disabled:opacity-60">
          {blankPending && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
          Partir d&apos;une page vierge
        </button>
      </p>
    </div>
  );
}

function MethodCard({
  icon: Icon,
  tone,
  badge,
  title,
  text,
  onClick,
}: {
  icon: typeof Mic;
  tone: string;
  badge?: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card group relative flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lg sm:flex-col sm:items-start sm:p-6"
    >
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl sm:size-14 ${tone}`}>
        <Icon aria-hidden className="size-6 sm:size-7" />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        {badge && <span className="badge bg-ink text-white sm:absolute sm:top-4 sm:right-4">{badge}</span>}
        <span className="block font-semibold sm:text-lg">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:hidden" />
      <span className="hidden items-center gap-1 text-sm font-semibold text-brand-700 sm:mt-auto sm:inline-flex sm:pt-2">
        Choisir <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Étape 2a : importer un ancien CV
// ---------------------------------------------------------------------------
function ImportStep({
  files,
  setFiles,
  notes,
  setNotes,
}: {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showNotes, setShowNotes] = useState(Boolean(notes));
  const onlyImages = files.length > 0 && files.every(isImageFile);

  /** Un document (PDF, Word) remplace la sélection ; les photos s'ajoutent (une par page). */
  function add(list: FileList | null) {
    if (!list?.length) return;
    const picked = Array.from(list);
    const doc = picked.find((f) => !isImageFile(f));
    if (doc) return setFiles([doc]);
    setFiles((prev) => [...prev.filter(isImageFile), ...picked].slice(0, CV_IMPORT_MAX_FILES));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl leading-tight font-bold sm:text-3xl">Importez votre ancien CV</h1>
        <p className="mt-1.5 text-muted">L&apos;IA le lit, garde vos informations et les rédige mieux, dans un modèle moderne.</p>
      </div>

      {files.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
          className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
            dragging ? "border-brand-600 bg-brand-50" : "border-line bg-surface/60"
          }`}
        >
          <span className="grid size-16 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
            <FileUp aria-hidden className="size-8" />
          </span>
          <div>
            <p className="font-semibold">
              <span className="hidden sm:inline">Glissez votre CV ici, ou choisissez un fichier</span>
              <span className="sm:hidden">Choisissez votre CV</span>
            </p>
            <p className="mt-1 text-sm text-muted">PDF, Word (.docx) ou photo · 4 Mo maximum</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button type="button" onClick={() => fileInput.current?.click()} className="btn-primary h-12 sm:h-auto">
              <FileText aria-hidden className="size-4" /> Choisir un fichier
            </button>
            <button type="button" onClick={() => cameraInput.current?.click()} className="btn-secondary h-12 sm:h-auto">
              <Camera aria-hidden className="size-4" /> Prendre en photo
            </button>
          </div>
          <p className="text-xs text-muted">CV papier ? Prenez chaque page en photo, à plat et bien éclairée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="card flex items-center gap-3 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  {isImageFile(f) ? <ImageIcon aria-hidden className="size-5" /> : <FileText aria-hidden className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{onlyImages ? `Page ${i + 1}` : f.name}</span>
                  <span className="block text-xs text-muted">{onlyImages ? `${f.name} · ` : ""}{formatSize(f.size)}</span>
                </span>
                <Check aria-hidden className="size-5 text-brand-600" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Retirer ${f.name}`}
                  className="rounded-full p-2 text-muted hover:bg-surface hover:text-ink"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {onlyImages && files.length < CV_IMPORT_MAX_FILES && (
              <button type="button" onClick={() => cameraInput.current?.click()} className="btn-secondary">
                <Plus aria-hidden className="size-4" /> Ajouter une page
              </button>
            )}
            <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary">
              <RotateCcw aria-hidden className="size-4" /> Changer de fichier
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={CV_IMPORT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => { add(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { add(e.target.files); e.target.value = ""; }}
      />

      {showNotes ? (
        <div>
          <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Du nouveau depuis ce CV ? <span className="font-normal text-muted">(facultatif)</span>
            </label>
            <DictateButton onText={(t) => setNotes((n) => (n.trim() ? `${n.trim()}\n${t}` : t))} />
          </div>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex. : Depuis mars 2024, je suis chef comptable chez Sahel Conseil à Ouagadougou. J'ai aussi obtenu ma licence en 2023."
            className="input"
          />
          <p className="mt-1 text-xs text-muted">Écrivez ou dictez : nouvel emploi, diplôme récent, informations à corriger…</p>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <Plus aria-hidden className="size-4" /> Ajouter du nouveau (emploi, diplôme…) à l&apos;écrit ou à la voix
        </button>
      )}

      <p className="flex gap-2 text-xs text-muted">
        <ShieldCheck aria-hidden className="size-4 shrink-0" />
        Votre fichier sert uniquement à remplir votre CV : il n&apos;est pas conservé sur nos serveurs.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 2b : raconter son parcours à voix haute
// ---------------------------------------------------------------------------
function VoiceStep({ story, setStory, onWrite }: { story: string; setStory: Dispatch<SetStateAction<string>>; onWrite: () => void }) {
  const [transcribing, setTranscribing] = useState(false);
  const rec = useRecorder({
    maxSeconds: VOICE_MAX_SECONDS,
    onComplete: async (audio) => {
      setTranscribing(true);
      const res = await transcribeBlob(audio);
      setTranscribing(false);
      if (res.ok) setStory((s) => (s.trim() ? `${s.trim()}\n\n${res.text}` : res.text));
      else rec.setError(res.error);
    },
  });
  const recording = rec.state === "recording";
  const hasStory = story.trim().length > 0;

  const status = transcribing
    ? "Transcription de votre voix…"
    : rec.state === "requesting"
      ? "Autorisez l'accès au micro…"
      : recording
        ? `Je vous écoute… ${formatDuration(rec.seconds)}`
        : hasStory
          ? "Appuyez pour compléter votre récit"
          : "Appuyez et parlez";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl leading-tight font-bold sm:text-3xl">Racontez votre parcours</h1>
        <p className="mt-1.5 text-muted">
          Parlez en français, naturellement, comme si vous vous présentiez à un recruteur. Vous pouvez faire des pauses, vous
          reprendre ou enregistrer en plusieurs fois.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-4 bg-linear-to-b from-violet-50 to-white px-4 py-8">
          <div className="relative grid size-28 place-items-center">
            {recording && (
              <>
                <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent-500/15" />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-accent-500/20 transition-transform duration-100"
                  style={{ transform: `scale(${1 + rec.level * 0.45})` }}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => (recording ? rec.stop() : void rec.start())}
              disabled={transcribing || rec.state === "requesting"}
              aria-label={recording ? "Terminer l'enregistrement" : "Commencer l'enregistrement"}
              aria-pressed={recording}
              className={`relative grid size-24 place-items-center rounded-full text-white shadow-xl transition-colors disabled:opacity-70 ${
                recording ? "bg-accent-600 hover:bg-accent-500" : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {transcribing || rec.state === "requesting" ? (
                <Loader2 aria-hidden className="size-9 animate-spin" />
              ) : recording ? (
                <Square aria-hidden className="size-8 fill-current" />
              ) : (
                <Mic aria-hidden className="size-10" />
              )}
            </button>
          </div>
          <div className="text-center" aria-live="polite">
            <p className="font-semibold">{status}</p>
            {recording && (
              <p className="mt-0.5 text-xs text-muted">
                Appuyez sur le bouton quand vous avez fini · {formatDuration(VOICE_MAX_SECONDS)} maximum par enregistrement
              </p>
            )}
          </div>
          {recording && (
            <button type="button" onClick={rec.cancel} className="text-xs text-muted underline hover:text-ink">
              Annuler cet enregistrement
            </button>
          )}
          {rec.error && <p role="alert" className="max-w-md text-center text-sm text-accent-600">{rec.error}</p>}
        </div>

        <div className="border-t border-line p-4 sm:p-5">
          <p className="mb-2 text-sm font-semibold">Pensez à dire :</p>
          <ul className="grid gap-1.5 text-sm text-muted sm:grid-cols-2">
            {VOICE_TOPICS.map((t) => (
              <li key={t} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hasStory ? (
        <div>
          <label htmlFor="story" className="label">Ce que l&apos;IA a compris <span className="font-normal text-muted">(vous pouvez corriger)</span></label>
          <textarea id="story" rows={8} value={story} onChange={(e) => setStory(e.target.value)} className="input" />
        </div>
      ) : (
        <p className="text-center text-sm text-muted">
          Pas de micro ou pas envie de parler ?{" "}
          <button type="button" onClick={onWrite} className="font-semibold text-ink underline">Écrire à la place</button>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 2c : écrire quelques lignes
// ---------------------------------------------------------------------------
function TextStep({ story, setStory, onSpeak }: { story: string; setStory: Dispatch<SetStateAction<string>>; onSpeak: () => void }) {
  const length = story.trim().length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl leading-tight font-bold sm:text-3xl">Décrivez votre parcours</h1>
        <p className="mt-1.5 text-muted">
          Avec vos mots, sans mise en forme : postes, entreprises, dates, diplômes, langues, logiciels. Vous pouvez aussi coller le
          texte d&apos;un ancien CV.
        </p>
      </div>
      <div>
        <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="story" className="text-sm font-medium">Votre parcours</label>
          <DictateButton onText={(t) => setStory((s) => (s.trim() ? `${s.trim()}\n${t}` : t))} />
        </div>
        <textarea
          id="story"
          rows={9}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Ex. : Je suis comptable depuis 3 ans chez Sahel Conseil à Bobo-Dioulasso (2022 à aujourd'hui) : je tiens la comptabilité de 40 PME et je prépare les déclarations fiscales. Avant, stage de 6 mois à la BICIAB. BTS en comptabilité en 2021 à l'ISGE. Je parle français et dioula, je maîtrise Excel et Sage."
          className="input"
          autoFocus
        />
        <p className={`mt-1 text-right text-xs ${length >= MIN_STORY ? "text-brand-700" : "text-muted"}`}>
          {length >= MIN_STORY ? "Parfait, l'IA a de quoi travailler." : `Encore ${MIN_STORY - length} caractères minimum`}
        </p>
      </div>
      <p className="text-center text-sm text-muted">
        Plus facile à l&apos;oral ?{" "}
        <button type="button" onClick={onSpeak} className="font-semibold text-ink underline">Raconter à voix haute</button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Étape 3 : rédaction par l'IA, choix du modèle, ouverture du CV
// ---------------------------------------------------------------------------
function ResultView({
  mode,
  phase,
  error,
  fill,
  defaults,
  templates,
  template,
  onTemplate,
  subscribed,
  opening,
  onOpen,
  onRetry,
  onEdit,
  onBlank,
  blankPending,
}: {
  mode: Mode;
  phase: "working" | "done" | "failed";
  error: string;
  fill: AiFill | null;
  defaults: StartDefaults;
  templates: CatalogTemplate[];
  template: string;
  onTemplate: (t: CatalogTemplate) => void;
  subscribed: boolean;
  opening: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onBlank: () => void;
  blankPending: boolean;
}) {
  const selected = templates.find((t) => t.value === template);
  const accent = "#009e49";

  // CV de l'utilisateur, pour le voir directement dans chaque modèle
  const content = useMemo<CvDraft | null>(
    () =>
      fill && {
        title: "",
        template,
        template_spec: selected?.spec ?? null,
        accent,
        photo_path: null,
        full_name: fill.contact.full_name || defaults.full_name,
        headline: fill.headline || defaults.headline,
        email: fill.contact.email || defaults.email,
        phone: fill.contact.phone || defaults.phone,
        city: fill.contact.city || defaults.city,
        website: fill.contact.website,
        summary: fill.summary,
        experiences: fill.experiences,
        education: fill.education,
        certifications: fill.certifications,
        skills: fill.skills.length ? fill.skills : defaults.skills,
        languages: fill.languages.length ? fill.languages : defaults.languages,
        interests: fill.interests,
      },
    [fill, defaults, template, selected],
  );

  return (
    <div className="space-y-6">
      <StatusCard
        mode={mode}
        phase={phase}
        error={error}
        fill={fill}
        opening={opening}
        onOpen={onOpen}
        onRetry={onRetry}
        onEdit={onEdit}
        onBlank={onBlank}
        blankPending={blankPending}
      />

      <section className={content ? "grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start" : ""} aria-label="Modèle du CV">
        {content && (
          <div className="hidden lg:sticky lg:top-24 lg:block">
            <p className="mb-2 text-xs text-muted">Votre CV · {selected?.label}</p>
            <CvPreview cv={content} photoUrl={null} />
          </div>
        )}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              {phase === "working" ? "En attendant, choisissez votre modèle" : content ? "Votre CV dans chaque modèle" : "Choisissez votre modèle"}
            </h2>
            <p className="text-sm text-muted">Vous pourrez en changer à tout moment, ainsi que la couleur et la photo.</p>
          </div>
          {selected?.premium && !subscribed && (
            <p className="flex gap-2 rounded-xl border border-dashed border-ink/30 bg-cream px-3 py-2.5 text-sm">
              <Crown aria-hidden className="mt-0.5 size-4 shrink-0 text-star-400" />
              <span>
                <strong>Modèle Premium.</strong> Essayez-le librement : il est inclus, avec le PDF, dans les abonnements.
              </span>
            </p>
          )}
          <TemplatePicker
            templates={templates}
            value={template}
            accent={accent}
            onChange={onTemplate}
            content={content}
            className={`grid grid-cols-3 gap-2 sm:gap-3 ${content ? "lg:grid-cols-3" : "sm:grid-cols-4 lg:grid-cols-6"}`}
          />
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  mode,
  phase,
  error,
  fill,
  opening,
  onOpen,
  onRetry,
  onEdit,
  onBlank,
  blankPending,
}: {
  mode: Mode;
  phase: "working" | "done" | "failed";
  error: string;
  fill: AiFill | null;
  opening: boolean;
  onOpen: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onBlank: () => void;
  blankPending: boolean;
}) {
  const [progress, setProgress] = useState(4);

  // Progression indicative : avance vite puis ralentit, jusqu'à la réponse de l'IA
  useEffect(() => {
    if (phase !== "working") return;
    const timer = setInterval(() => setProgress((p) => p + (94 - p) * 0.035), 300);
    return () => {
      clearInterval(timer);
      setProgress(4);
    };
  }, [phase]);

  if (phase === "failed") {
    return (
      <div role="alert" className="card space-y-4 border-accent-500/30 p-5 sm:p-6">
        <div>
          <p className="font-semibold">Votre CV n&apos;a pas pu être créé</p>
          <p className="mt-1 text-sm text-accent-600">{error}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRetry} className="btn-primary h-12 sm:h-auto"><RotateCcw aria-hidden className="size-4" /> Réessayer</button>
          {!fill && <button type="button" onClick={onEdit} className="btn-secondary h-12 sm:h-auto"><PenLine aria-hidden className="size-4" /> Modifier mes informations</button>}
          <button type="button" onClick={onBlank} disabled={blankPending} className="btn-secondary h-12 sm:h-auto">
            {blankPending && <Loader2 aria-hidden className="size-4 animate-spin" />} Continuer sans l&apos;IA
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done" && fill) {
    const toCheck = JSON.stringify(fill).split("[à préciser]").length - 1;
    const stats = [
      fill.experiences.length && `${fill.experiences.length} expérience${fill.experiences.length > 1 ? "s" : ""}`,
      fill.education.length && `${fill.education.length} formation${fill.education.length > 1 ? "s" : ""}`,
      fill.skills.length && `${fill.skills.length} compétences`,
      fill.languages.length && `${fill.languages.length} langue${fill.languages.length > 1 ? "s" : ""}`,
    ].filter(Boolean) as string[];
    return (
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-brand-600/30 sm:bg-brand-50/60 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white sm:size-12">
              <Check aria-hidden className="size-5 sm:size-6" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold">Votre CV est prêt !</p>
              {stats.length > 0 && <p className="text-sm text-muted">{stats.join(" · ")}</p>}
              {toCheck > 0 && (
                <p className="mt-0.5 text-xs text-muted">{toCheck} information{toCheck > 1 ? "s" : ""} « [à préciser] » à compléter en relisant.</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onOpen} disabled={opening} className="btn-primary h-12 px-6 text-base">
            {opening ? <Loader2 aria-hidden className="size-5 animate-spin" /> : null}
            Ouvrir mon CV <ArrowRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  const messages = WORKING_MESSAGES[mode];
  const message = messages[Math.min(messages.length - 1, Math.floor((progress / 95) * messages.length))];
  return (
    <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-violet-200 sm:bg-linear-to-br sm:from-violet-50 sm:to-fuchsia-50 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-600 to-fuchsia-600 text-white sm:size-12">
          <Sparkles aria-hidden className="size-5 animate-pulse sm:size-6" />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="font-semibold">L&apos;IA rédige votre CV</p>
          <p className="truncate text-sm text-muted">{message}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100" role="progressbar" aria-label="Rédaction en cours" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
