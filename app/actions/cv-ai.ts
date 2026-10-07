"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { AiError, askJson, transcribeAudio, type ContentPart } from "@/lib/ai";
import { docxToText } from "@/lib/docx-text";
import { AI_DAILY_LIMIT, CV_IMPORT_MAX_BYTES, CV_IMPORT_MAX_FILES, TRANSCRIBE_DAILY_LIMIT } from "@/lib/constants";
import type { CvDraft, CvEntry } from "@/lib/types";

export type AiRequest =
  | { kind: "fill"; text: string; target?: string }
  | { kind: "summary"; cv: CvDraft }
  | { kind: "experience"; entry: CvEntry; headline: string | null }
  | { kind: "skills"; cv: CvDraft }
  | { kind: "review"; cv: CvDraft };

/** Coordonnées retrouvées dans un ancien CV ou un récit (vides si absentes). */
export type AiContact = Pick<CvDraft, "full_name" | "email" | "phone" | "city" | "website">;

export type AiFill = Pick<
  CvDraft,
  "headline" | "summary" | "experiences" | "education" | "skills" | "languages" | "certifications" | "interests"
> & { contact: AiContact };

export type AiResult =
  | { ok: true; kind: "fill"; data: AiFill }
  | { ok: true; kind: "summary"; summary: string }
  | { ok: true; kind: "experience"; description: string }
  | { ok: true; kind: "skills"; skills: string[] }
  | { ok: true; kind: "review"; score: number; tips: string[] }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Nettoyage des sorties (on ne fait jamais confiance au format renvoyé)
// ---------------------------------------------------------------------------
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max: number, itemMax = 60) =>
  Array.isArray(v) ? v.map((x) => text(x, itemMax)).filter(Boolean).slice(0, max) : [];
const entries = (v: unknown, max = 10): CvEntry[] =>
  Array.isArray(v)
    ? v
        .map((e) => ({
          title: text(e?.title, 120),
          organization: text(e?.organization, 120),
          start: text(e?.start, 30),
          end: text(e?.end, 30),
          description: text(e?.description, 1200),
        }))
        .filter((e) => e.title || e.organization)
        .slice(0, max)
    : [];

/** Résumé compact du CV envoyé comme contexte à l'IA. */
function describe(cv: CvDraft) {
  const lines = [
    cv.headline && `Titre visé : ${cv.headline}`,
    cv.summary && `Résumé actuel : ${cv.summary}`,
    ...cv.experiences.map((e) => `Expérience : ${e.title} — ${e.organization} (${e.start}–${e.end}) : ${e.description}`),
    ...cv.education.map((e) => `Formation : ${e.title} — ${e.organization} (${e.start}–${e.end})`),
    cv.skills.length && `Compétences : ${cv.skills.join(", ")}`,
    cv.languages.length && `Langues : ${cv.languages.join(", ")}`,
  ].filter(Boolean);
  return lines.join("\n").slice(0, 6000);
}

/** Structure JSON demandée pour remplir un CV complet (récit, dictée ou ancien CV). */
const FILL_FORMAT = `{"full_name": "prénom et nom", "email": "", "phone": "", "city": "ville", "website": "LinkedIn ou site", "headline": "titre professionnel court", "summary": "3 à 4 phrases", "experiences": [{"title": "poste", "organization": "entreprise", "start": "mois année", "end": "mois année ou Aujourd'hui", "description": "3 à 5 puces commençant par « - », verbes d'action"}], "education": [{"title": "diplôme", "organization": "établissement", "start": "", "end": "année", "description": ""}], "skills": ["8 à 12 compétences"], "languages": ["Français (courant)"], "certifications": [{"title": "", "organization": "", "start": "", "end": "année", "description": ""}], "interests": ["2 à 4 centres d'intérêt"]}`;

const FILL_RULES = `- Expériences de la plus récente à la plus ancienne ; dates au format « Janv. 2022 », « 2019 » ou « Aujourd'hui ».
- Descriptions d'expérience : 3 à 5 puces « - » avec des verbes d'action ; reformule proprement et corrige les fautes, sans rien ajouter qui ne soit pas dit.
- Compétences : mots-clés courts (1 à 4 mots), sans doublon. Langues avec leur niveau quand il est indiqué.
- Laisse vides ("" ou []) les champs dont l'information n'est pas fournie : n'invente ni coordonnées, ni employeur, ni diplôme, ni date.`;

function toFill(out: Record<string, unknown>): AiFill {
  return {
    contact: {
      full_name: text(out.full_name, 120),
      email: text(out.email, 160) || null,
      phone: text(out.phone, 40) || null,
      city: text(out.city, 80) || null,
      website: text(out.website, 200) || null,
    },
    headline: text(out.headline, 120) || null,
    summary: text(out.summary, 1200) || null,
    experiences: entries(out.experiences),
    education: entries(out.education),
    skills: list(out.skills, 20, 150),
    languages: list(out.languages, 8),
    certifications: entries(out.certifications, 8),
    interests: list(out.interests, 6),
  };
}

const targetLine = (target?: string) => {
  const t = text(target, 120);
  return t ? `Poste visé par le candidat : ${t}. Oriente le titre, le résumé et l'ordre des compétences vers ce poste.\n` : "";
};

// ---------------------------------------------------------------------------
// Limites quotidiennes
// ---------------------------------------------------------------------------
type QuotaKind = "assistant" | "transcription";

async function checkQuota(userId: string, subscribed: boolean, admin: boolean, kind: QuotaKind) {
  const supabase = await createClient();
  // Administrateurs : pas de limite
  if (admin) return { allowed: true, limit: Infinity, supabase };
  const since = new Date(Date.now() - 86_400_000).toISOString();
  let query = supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  query = kind === "transcription" ? query.eq("kind", "transcription") : query.neq("kind", "transcription");
  const { count } = await query;
  const limits = kind === "transcription" ? TRANSCRIBE_DAILY_LIMIT : AI_DAILY_LIMIT;
  const limit = subscribed ? limits.subscribed : limits.free;
  return { allowed: (count ?? 0) < limit, limit, supabase };
}

function quotaError(limit: number, subscribed: boolean, kind: QuotaKind) {
  return kind === "transcription"
    ? `Vous avez atteint les ${limit} dictées vocales du jour. Écrivez votre texte ou revenez demain.`
    : `Vous avez utilisé vos ${limit} demandes à l'assistant pour aujourd'hui. Revenez demain${subscribed ? "" : " ou abonnez-vous pour en avoir davantage"}.`;
}

function aiFailure(e: unknown): { ok: false; error: string } {
  if (e instanceof AiError) {
    return {
      ok: false,
      error: e.code === "not_configured" ? "L'assistant IA n'est pas encore activé sur le site." : `${e.message}. Réessayez dans un instant.`,
    };
  }
  console.error("[ai] erreur inattendue", e);
  return { ok: false, error: "L'assistant a rencontré un problème. Réessayez." };
}

// ---------------------------------------------------------------------------
// Assistant de l'éditeur
// ---------------------------------------------------------------------------
export async function aiAssist(request: AiRequest): Promise<AiResult> {
  const user = await requireUser("/cv");
  const { allowed, limit, supabase } = await checkQuota(user.id, user.isSubscribed, user.profile.is_admin, "assistant");
  if (!allowed) return { ok: false, error: quotaError(limit, user.isSubscribed, "assistant") };

  try {
    let result: AiResult;
    switch (request.kind) {
      case "fill": {
        const source = request.text.trim().slice(0, 12000);
        if (source.length < 40) return { ok: false, error: "Racontez votre parcours en quelques phrases (40 caractères minimum)." };
        const out = await askJson<Record<string, unknown>>(
          `À partir du texte ci-dessous, remplis la structure d'un CV. Le texte peut être une description libre, un ancien CV collé, ou la transcription d'un enregistrement vocal (langage parlé, hésitations, répétitions, ordre désordonné, chiffres et dates dits à l'oral) : remets tout en ordre et rédige dans un style écrit professionnel.
${targetLine(request.target)}Règles :
${FILL_RULES}
Format JSON attendu :
${FILL_FORMAT}
Texte :
"""${source}"""`,
          { maxTokens: 3000, effort: "medium" },
        );
        result = { ok: true, kind: "fill", data: toFill(out) };
        break;
      }
      case "summary": {
        const out = await askJson<{ summary?: string }>(
          `Rédige le résumé de profil (3 à 4 phrases, 60 à 90 mots) placé en haut de ce CV : qui est la personne, ses points forts concrets, ce qu'elle recherche.
Format JSON : {"summary": "..."}
CV :
${describe(request.cv)}`,
        );
        result = { ok: true, kind: "summary", summary: text(out.summary, 1200) };
        break;
      }
      case "experience": {
        const e = request.entry;
        const out = await askJson<{ description?: string }>(
          `Réécris la description de cette expérience en 3 à 5 puces commençant par « - », avec des verbes d'action et des résultats concrets. Garde uniquement les faits fournis.
Format JSON : {"description": "- ...\\n- ..."}
Poste : ${e.title}
Entreprise : ${e.organization}
Période : ${e.start} – ${e.end}
Titre visé : ${request.headline ?? "non précisé"}
Description actuelle : ${e.description || "(vide : propose des missions typiques de ce poste, formulées de façon générale)"}`,
        );
        result = { ok: true, kind: "experience", description: text(out.description, 1200) };
        break;
      }
      case "skills": {
        const out = await askJson<{ skills?: string[] }>(
          `Propose 8 à 12 compétences pertinentes (techniques et comportementales) pour ce profil, adaptées au marché burkinabè. Mots-clés courts (1 à 4 mots), sans doublon avec les compétences déjà listées.
Format JSON : {"skills": ["..."]}
CV :
${describe(request.cv)}`,
        );
        result = { ok: true, kind: "skills", skills: list(out.skills, 12, 50) };
        break;
      }
      case "review": {
        const out = await askJson<{ score?: number; tips?: string[] }>(
          `Évalue ce CV comme un recruteur exigeant. Donne une note sur 100 et 3 à 6 conseils concrets et actionnables (une phrase chacun), du plus important au moins important.
Format JSON : {"score": 75, "tips": ["..."]}
CV :
${describe(request.cv)}`,
          { temperature: 0.2, effort: "medium" },
        );
        const score = Math.max(0, Math.min(100, Math.round(Number(out.score) || 0)));
        result = { ok: true, kind: "review", score, tips: list(out.tips, 6, 300) };
        break;
      }
    }
    await supabase.from("ai_usage").insert({ user_id: user.id, kind: request.kind });
    return result;
  } catch (e) {
    return aiFailure(e);
  }
}

// ---------------------------------------------------------------------------
// Import d'un ancien CV (PDF, Word, photos, texte)
// ---------------------------------------------------------------------------
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Type réel du fichier (le navigateur ne renseigne pas toujours le type MIME, ex. .docx sur Android). */
function kindOf(file: File): "pdf" | "docx" | "image" | "text" | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) return "docx";
  if (IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/.test(name)) return "image";
  if (file.type === "text/plain" || name.endsWith(".txt")) return "text";
  return null;
}

/**
 * Lit un ancien CV et en tire un nouveau CV, mieux rédigé, avec les mêmes faits.
 * FormData : files (1 à 4 fichiers), notes (compléments écrits ou dictés), target (poste visé).
 */
export async function aiImport(formData: FormData): Promise<AiResult> {
  const user = await requireUser("/cv");

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "Choisissez le fichier de votre ancien CV." };
  if (files.length > CV_IMPORT_MAX_FILES) return { ok: false, error: `${CV_IMPORT_MAX_FILES} fichiers maximum (une photo par page).` };
  if (files.reduce((n, f) => n + f.size, 0) > CV_IMPORT_MAX_BYTES)
    return { ok: false, error: "Fichier trop lourd (4 Mo maximum). Enregistrez-le en PDF ou prenez une photo plus légère." };

  const parts: ContentPart[] = [];
  for (const file of files) {
    const kind = kindOf(file);
    if (!kind) {
      return {
        ok: false,
        error: file.name.toLowerCase().endsWith(".doc")
          ? "Les anciens fichiers Word (.doc) ne sont pas lus : enregistrez-le en .docx ou en PDF."
          : `Format non pris en charge (${file.name}). Utilisez un PDF, un fichier Word (.docx) ou une photo.`,
      };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (kind === "pdf") {
      parts.push({ type: "file", file: { filename: file.name || "cv.pdf", file_data: `data:application/pdf;base64,${buffer.toString("base64")}` } });
    } else if (kind === "image") {
      const type = IMAGE_TYPES.includes(file.type) ? file.type : "image/jpeg";
      parts.push({ type: "image_url", image_url: { url: `data:${type};base64,${buffer.toString("base64")}`, detail: "high" } });
    } else {
      const content = kind === "docx" ? docxToText(buffer) : buffer.toString("utf8");
      if (!content || content.trim().length < 20)
        return { ok: false, error: `Impossible de lire « ${file.name} ». Enregistrez-le en PDF et réessayez.` };
      parts.push({ type: "text", text: `Contenu du fichier « ${file.name} » :\n"""${content.slice(0, 15000)}"""` });
    }
  }

  const { allowed, limit, supabase } = await checkQuota(user.id, user.isSubscribed, user.profile.is_admin, "assistant");
  if (!allowed) return { ok: false, error: quotaError(limit, user.isSubscribed, "assistant") };

  const notes = text(formData.get("notes"), 4000);
  const target = text(formData.get("target"), 120);

  try {
    const out = await askJson<Record<string, unknown>>(
      [
        {
          type: "text",
          text: `Voici l'ancien CV d'un candidat (${files.length > 1 ? "plusieurs pages ou photos" : "un fichier"}). Construis-en un nouveau CV, plus clair et plus convaincant, avec exactement les mêmes faits.
Lis tout le document, y compris les colonnes latérales et les en-têtes. Si c'est une photo, déchiffre-la soigneusement.
${targetLine(target)}${notes ? `Compléments donnés par le candidat (prioritaires : nouvel emploi, diplôme récent, corrections) — ils peuvent venir d'une dictée vocale :\n"""${notes}"""\n` : ""}Règles :
${FILL_RULES}
- Réécris le résumé de profil (3 à 4 phrases) même s'il n'y en avait pas, à partir des faits du CV.
- Si le document n'est pas un CV ou est illisible, renvoie tous les champs vides.
Format JSON attendu :
${FILL_FORMAT}`,
        },
        ...parts,
      ],
      { maxTokens: 3500, effort: "low" },
    );
    const data = toFill(out);
    if (!data.experiences.length && !data.education.length && !data.contact.full_name && !data.skills.length) {
      return { ok: false, error: "Nous n'avons pas pu lire ce CV. Essayez avec un PDF, ou une photo nette et bien éclairée." };
    }
    await supabase.from("ai_usage").insert({ user_id: user.id, kind: "import" });
    return { ok: true, kind: "fill", data };
  } catch (e) {
    return aiFailure(e);
  }
}

// ---------------------------------------------------------------------------
// Dictée vocale
// ---------------------------------------------------------------------------
const AUDIO_MAX_BYTES = 4 * 1024 * 1024;

/** FormData : audio (enregistrement du navigateur : webm, mp4/m4a, ogg…). */
export async function aiTranscribe(formData: FormData): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await requireUser("/cv");
  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size < 1000) return { ok: false, error: "Enregistrement trop court. Parlez quelques secondes puis arrêtez." };
  if (audio.size > AUDIO_MAX_BYTES) return { ok: false, error: "Enregistrement trop long. Faites plusieurs enregistrements plus courts." };

  const { allowed, limit, supabase } = await checkQuota(user.id, user.isSubscribed, user.profile.is_admin, "transcription");
  if (!allowed) return { ok: false, error: quotaError(limit, user.isSubscribed, "transcription") };

  // L'extension doit correspondre au format réel pour l'API de transcription
  const type = audio.type.split(";")[0];
  const ext = { "audio/webm": "webm", "audio/mp4": "mp4", "audio/x-m4a": "m4a", "audio/m4a": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/wav": "wav" }[type] ?? "webm";

  try {
    const transcript = await transcribeAudio(audio, `dictee.${ext}`);
    if (!transcript) return { ok: false, error: "Nous n'avons rien entendu. Rapprochez-vous du micro et réessayez." };
    await supabase.from("ai_usage").insert({ user_id: user.id, kind: "transcription" });
    return { ok: true, text: transcript.slice(0, 8000) };
  } catch (e) {
    return aiFailure(e);
  }
}
