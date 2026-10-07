"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { resolveTemplate } from "@/lib/template-catalog";
import type { ActionState, Cv, CvDraft, CvEntry } from "@/lib/types";
import type { AiFill } from "./cv-ai";

// ---------------------------------------------------------------------------
// Validation du contenu envoyé par l'éditeur (jamais de confiance côté client)
// ---------------------------------------------------------------------------
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const opt = (v: unknown, max: number) => text(v, max) || null;
const list = (v: unknown, max: number, itemMax = 60) =>
  Array.isArray(v) ? v.map((x) => text(x, itemMax)).filter(Boolean).slice(0, max) : [];
const entries = (v: unknown, max = 15): CvEntry[] =>
  Array.isArray(v)
    ? v
        .map((e) => ({
          title: text(e?.title, 120),
          organization: text(e?.organization, 120),
          start: text(e?.start, 30),
          end: text(e?.end, 30),
          description: text(e?.description, 1500),
        }))
        .filter((e) => e.title || e.organization)
        .slice(0, max)
    : [];

/** Contenu du CV (le modèle est résolu à part, côté serveur : voir resolveTemplate). */
function sanitize(draft: CvDraft, userId: string) {
  const accent = /^#[0-9a-f]{6}$/i.test(draft.accent) ? draft.accent : "#009e49";
  // La photo doit être dans le dossier de l'utilisateur (bucket « photos »)
  const photo = draft.photo_path && new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, "i").test(draft.photo_path)
    ? draft.photo_path
    : null;
  return {
    title: text(draft.title, 80) || "Mon CV",
    accent,
    photo_path: photo,
    full_name: text(draft.full_name, 120),
    headline: opt(draft.headline, 120),
    email: opt(draft.email, 160),
    phone: opt(draft.phone, 40),
    city: opt(draft.city, 80),
    website: opt(draft.website, 200),
    summary: opt(draft.summary, 1500),
    experiences: entries(draft.experiences),
    education: entries(draft.education),
    certifications: entries(draft.certifications, 10),
    // Jusqu'à 150 caractères : « Catégorie : élément, élément… »
    skills: list(draft.skills, 30, 150),
    languages: list(draft.languages, 10),
    interests: list(draft.interests, 8),
  };
}

function revalidateCv() {
  revalidatePath("/cv", "layout");
  revalidatePath("/espace", "layout");
}

// ---------------------------------------------------------------------------
// CV en ligne (créateur)
// ---------------------------------------------------------------------------

/**
 * Crée un CV (le quota du plan est vérifié par la base) avec le modèle choisi et, s'il y en a un,
 * le contenu rédigé par l'IA (ancien CV importé, récit dicté ou écrit). Les coordonnées manquantes
 * sont reprises du profil.
 */
export async function createCvFromStart(input: {
  template: string;
  fill?: AiFill | null;
}): Promise<{ id: string } | { error: string; limit?: boolean }> {
  const user = await requireUser("/cv/nouveau");
  const { template, template_spec } = await resolveTemplate(String(input.template ?? "moderne"));
  const supabase = await createClient();
  const { count } = await supabase.from("cvs").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  const fill = input.fill;
  const p = user.profile;
  const content = sanitize(
    {
      title: count ? `CV ${count + 1}` : "Mon CV",
      template,
      template_spec,
      accent: "#009e49",
      photo_path: null,
      full_name: fill?.contact?.full_name || p.full_name,
      headline: fill?.headline || p.headline,
      email: fill?.contact?.email || user.email || null,
      phone: fill?.contact?.phone || p.phone,
      city: fill?.contact?.city || p.city,
      website: fill?.contact?.website || null,
      summary: fill?.summary ?? null,
      experiences: fill?.experiences ?? [],
      education: fill?.education ?? [],
      certifications: fill?.certifications ?? [],
      skills: fill?.skills?.length ? fill.skills : p.skills,
      languages: fill?.languages?.length ? fill.languages : p.languages,
      interests: fill?.interests ?? [],
    },
    user.id,
  );

  const { data, error } = await supabase
    .from("cvs")
    .insert({
      ...content,
      user_id: user.id,
      template,
      // Colonne ajoutée par la migration modeles_ia : envoyée seulement pour un modèle IA
      ...(template_spec ? { template_spec } : {}),
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    return error?.message.includes("cv_limit_reached")
      ? { error: "Vous avez atteint le nombre de CV de votre plan.", limit: true }
      : { error: "Impossible de créer le CV. Réessayez." };
  }
  revalidateCv();
  return { id: data.id };
}

/** Change le modèle d'un CV (choisi pendant que l'IA rédigeait). */
export async function setCvTemplate(cvId: string, requested: string): Promise<ActionState> {
  const user = await requireUser(`/cv/${cvId}`);
  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("cvs")
    .select("template, template_spec")
    .eq("id", cvId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<Cv, "template" | "template_spec">>();
  if (!previous) return { error: "CV introuvable." };
  const { template, template_spec } = await resolveTemplate(requested, previous);
  const { error } = await supabase
    .from("cvs")
    .update({
      template,
      ...(template_spec || previous.template_spec ? { template_spec } : {}),
    })
    .eq("id", cvId)
    .eq("user_id", user.id);
  if (error) return { error: "Impossible de changer de modèle." };
  revalidateCv();
  return { success: "Modèle enregistré." };
}

export async function saveCvDraft(cvId: string, draft: CvDraft): Promise<ActionState> {
  const user = await requireUser(`/cv/${cvId}`);
  const values = sanitize(draft, user.id);
  if (values.full_name.length < 2) return { fieldErrors: { full_name: "Indiquez votre nom complet." } };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", cvId)
    .eq("user_id", user.id)
    .maybeSingle<Cv>();
  if (!previous) return { error: "CV introuvable." };

  // Le modèle (et sa fiche de style) est relu côté serveur, jamais repris du navigateur
  const { template, template_spec } = await resolveTemplate(String(draft.template ?? ""), previous);
  const { error } = await supabase
    .from("cvs")
    .update({ ...values, template, ...(template_spec || previous.template_spec ? { template_spec } : {}) })
    .eq("id", cvId)
    .eq("user_id", user.id);
  if (error) return { error: "Impossible d'enregistrer votre CV. Réessayez." };

  // Photo remplacée ou retirée : on supprime l'ancienne du stockage
  if (previous.photo_path && previous.photo_path !== values.photo_path) {
    await supabase.storage.from("photos").remove([previous.photo_path]);
  }
  revalidateCv();
  return { success: "CV enregistré." };
}

export async function duplicateCv(cvId: string) {
  const user = await requireUser("/cv");
  const supabase = await createClient();
  const { data: cv } = await supabase.from("cvs").select("*").eq("id", cvId).eq("user_id", user.id).maybeSingle<Cv>();
  if (!cv) redirect("/cv");

  const { id: _id, user_id: _u, updated_at: _up, photo_path: _p, ...content } = cv;
  void _id; void _u; void _up; void _p;
  const { data, error } = await supabase
    .from("cvs")
    // La photo n'est pas partagée entre deux CV (suppression indépendante)
    .insert({ ...content, user_id: user.id, title: `${cv.title} (copie)`.slice(0, 80), photo_path: null })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) redirect(`/cv?erreur=${error?.message.includes("cv_limit_reached") ? "limite" : "creation"}`);
  revalidateCv();
  redirect(`/cv/${data.id}`);
}

export async function deleteCv(cvId: string) {
  const user = await requireUser("/cv");
  const supabase = await createClient();
  const { data: cv } = await supabase
    .from("cvs")
    .select("photo_path")
    .eq("id", cvId)
    .eq("user_id", user.id)
    .maybeSingle<{ photo_path: string | null }>();
  if (cv) {
    await supabase.from("cvs").delete().eq("id", cvId).eq("user_id", user.id);
    if (cv.photo_path) await supabase.storage.from("photos").remove([cv.photo_path]);
  }
  revalidateCv();
  redirect("/cv");
}
