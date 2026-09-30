"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { AiError, askJson } from "@/lib/ai";
import { AI_DAILY_LIMIT } from "@/lib/constants";
import type { CvDraft, CvEntry } from "@/lib/types";

export type AiRequest =
  | { kind: "fill"; text: string }
  | { kind: "summary"; cv: CvDraft }
  | { kind: "experience"; entry: CvEntry; headline: string | null }
  | { kind: "skills"; cv: CvDraft }
  | { kind: "review"; cv: CvDraft };

export type AiFill = Pick<
  CvDraft,
  "headline" | "summary" | "experiences" | "education" | "skills" | "languages" | "certifications" | "interests"
>;

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

// ---------------------------------------------------------------------------
// Limite quotidienne
// ---------------------------------------------------------------------------
async function checkQuota(userId: string, subscribed: boolean) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  const limit = subscribed ? AI_DAILY_LIMIT.subscribed : AI_DAILY_LIMIT.free;
  return { allowed: (count ?? 0) < limit, limit, supabase };
}

export async function aiAssist(request: AiRequest): Promise<AiResult> {
  const user = await requireUser("/cv");
  const { allowed, limit, supabase } = await checkQuota(user.id, user.isSubscribed);
  if (!allowed) {
    return {
      ok: false,
      error: `Vous avez utilisé vos ${limit} demandes à l'assistant pour aujourd'hui. Revenez demain${user.isSubscribed ? "" : " ou abonnez-vous pour en avoir davantage"}.`,
    };
  }

  try {
    let result: AiResult;
    switch (request.kind) {
      case "fill": {
        const source = request.text.trim().slice(0, 8000);
        if (source.length < 40) return { ok: false, error: "Décrivez votre parcours en quelques phrases (40 caractères minimum)." };
        const out = await askJson<Record<string, unknown>>(
          `À partir du texte ci-dessous (description libre ou ancien CV), remplis la structure d'un CV.
Format JSON attendu :
{"headline": "titre professionnel court", "summary": "3 à 4 phrases", "experiences": [{"title": "poste", "organization": "entreprise", "start": "mois année", "end": "mois année ou Aujourd'hui", "description": "3 à 5 puces commençant par « - », verbes d'action"}], "education": [{"title": "diplôme", "organization": "établissement", "start": "", "end": "année", "description": ""}], "skills": ["8 à 12 compétences"], "languages": ["Français (courant)"], "certifications": [{"title": "", "organization": "", "start": "", "end": "année", "description": ""}], "interests": ["2 à 4 centres d'intérêt"]}
Laisse vides les champs non fournis dans le texte. Texte :
"""${source}"""`,
          { maxTokens: 2500, effort: "medium" },
        );
        result = {
          ok: true,
          kind: "fill",
          data: {
            headline: text(out.headline, 120) || null,
            summary: text(out.summary, 1200) || null,
            experiences: entries(out.experiences),
            education: entries(out.education),
            skills: list(out.skills, 20),
            languages: list(out.languages, 8),
            certifications: entries(out.certifications, 8),
            interests: list(out.interests, 6),
          },
        };
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
    if (e instanceof AiError) {
      return {
        ok: false,
        error: e.code === "not_configured" ? "L'assistant IA n'est pas encore activé sur le site." : `${e.message}. Réessayez dans un instant.`,
      };
    }
    console.error("[ai] erreur inattendue", e);
    return { ok: false, error: "L'assistant a rencontré un problème. Réessayez." };
  }
}
