"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { registerCvFile } from "@/lib/cv-files";
import { CV_TEMPLATES } from "@/lib/constants";
import type { ActionState, Cv, CvDraft, CvEntry } from "@/lib/types";

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

function sanitize(draft: CvDraft, userId: string) {
  const template = CV_TEMPLATES.some((t) => t.value === draft.template) ? draft.template : "moderne";
  const accent = /^#[0-9a-f]{6}$/i.test(draft.accent) ? draft.accent : "#009e49";
  // La photo doit être dans le dossier de l'utilisateur (bucket « photos »)
  const photo = draft.photo_path && new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`, "i").test(draft.photo_path)
    ? draft.photo_path
    : null;
  return {
    title: text(draft.title, 80) || "Mon CV",
    template,
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

/** Crée un CV (le quota du plan est vérifié par la base) puis ouvre l'éditeur. */
export async function createCv() {
  const user = await requireUser("/cv");
  const supabase = await createClient();
  const { count } = await supabase.from("cvs").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { data, error } = await supabase
    .from("cvs")
    .insert({
      user_id: user.id,
      title: count ? `CV ${count + 1}` : "Mon CV",
      full_name: user.profile.full_name,
      headline: user.profile.headline,
      email: user.email,
      phone: user.profile.phone,
      city: user.profile.city,
      skills: user.profile.skills,
      languages: user.profile.languages,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) redirect(`/cv?erreur=${error?.message.includes("cv_limit_reached") ? "limite" : "creation"}`);
  revalidateCv();
  redirect(`/cv/${data.id}?nouveau=1`);
}

export async function saveCvDraft(cvId: string, draft: CvDraft): Promise<ActionState> {
  const user = await requireUser(`/cv/${cvId}`);
  const values = sanitize(draft, user.id);
  if (values.full_name.length < 2) return { fieldErrors: { full_name: "Indiquez votre nom complet." } };

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("cvs")
    .select("photo_path")
    .eq("id", cvId)
    .eq("user_id", user.id)
    .maybeSingle<{ photo_path: string | null }>();
  if (!previous) return { error: "CV introuvable." };

  const { error } = await supabase.from("cvs").update(values).eq("id", cvId).eq("user_id", user.id);
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

// ---------------------------------------------------------------------------
// CV en PDF importés
// ---------------------------------------------------------------------------

export async function uploadCvFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/cv");
  const result = await registerCvFile(user.id, formData);
  if (!result) return { error: "Choisissez un fichier PDF." };
  if ("error" in result) return { error: result.error };

  revalidateCv();
  return { success: "CV PDF ajouté." };
}

export async function deleteCvFile(fileId: string) {
  const user = await requireUser("/cv");
  const supabase = await createClient();
  const { data } = await supabase
    .from("cv_files")
    .select("path")
    .eq("id", fileId)
    .eq("user_id", user.id)
    .maybeSingle<{ path: string }>();

  if (data) {
    await supabase.storage.from("cvs").remove([data.path]);
    await supabase.from("cv_files").delete().eq("id", fileId);
  }
  revalidatePath("/cv", "layout");
}
