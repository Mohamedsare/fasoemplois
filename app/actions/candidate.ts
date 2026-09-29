"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireUser, safePath } from "@/lib/auth";
import { EXPERIENCE_LABELS } from "@/lib/constants";
import { registerCvFile } from "@/lib/cv-files";
import { nullable, str, strList } from "@/lib/format";
import type { ActionState, ExperienceLevel } from "@/lib/types";

/** Enregistre le profil (onboarding ou page « Mon profil »). */
export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/espace/profil");

  const experience = str(formData, "experience_level");
  const update = {
    first_name: str(formData, "first_name") || user.profile.first_name,
    last_name: str(formData, "last_name") || user.profile.last_name,
    phone: nullable(formData, "phone"),
    city: nullable(formData, "city"),
    headline: nullable(formData, "headline"),
    experience_level: experience in EXPERIENCE_LABELS ? (experience as ExperienceLevel) : null,
    skills: strList(formData, "skills"),
    languages: strList(formData, "languages"),
    pref_contracts: formData.getAll("pref_contracts").map(String),
    pref_cities: formData.getAll("pref_cities").map(String),
    pref_categories: formData.getAll("pref_categories").map(String),
    ...(formData.get("complete") === "1" ? { onboarding_completed_at: new Date().toISOString() } : {}),
  };

  // CV PDF ajouté pendant l'onboarding (facultatif)
  const cvResult = await registerCvFile(user.id, formData);
  if (cvResult && "error" in cvResult) return { error: cvResult.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer votre profil. Réessayez." };

  revalidatePath("/", "layout");
  const next = str(formData, "suivant");
  if (next) redirect(safePath(next));
  return { success: "Profil enregistré." };
}

export async function skipOnboarding() {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  redirect("/espace");
}

/** Ajoute / retire une offre des favoris. */
export async function toggleFavorite(jobId: string, returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suivant=${encodeURIComponent(safePath(returnTo, "/offres"))}`);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("job_id")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("job_id", jobId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, job_id: jobId });
  }
  revalidatePath("/", "layout");
}
