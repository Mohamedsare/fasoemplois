"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { nullable, str } from "@/lib/format";
import type { ActionState, ApplicationStatus } from "@/lib/types";
import { registerCvFile } from "@/lib/cv-files";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function submitApplication(
  jobId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser(`/offres/${jobId}/postuler`);
  if (!user.isSubscribed) redirect(`/abonnements/choisir?offre=${jobId}`);

  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "Indiquez votre nom.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Adresse e-mail invalide.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();

  // Choix du CV : fichier existant, CV en ligne, ou nouveau PDF
  const choice = str(formData, "cv_choice");
  let cvFileId: string | null = null;
  let includeOnlineCv = false;
  let cvId: string | null = null;
  if (choice.startsWith("online:")) {
    // Le CV doit appartenir au candidat (la RLS ne renvoie que les siens)
    const { data: cv } = await supabase.from("cvs").select("id").eq("id", choice.slice(7)).eq("user_id", user.id).maybeSingle();
    if (!cv) return { error: "CV introuvable." };
    includeOnlineCv = true;
    cvId = cv.id as string;
  } else if (choice === "upload") {
    const result = await registerCvFile(user.id, formData);
    if (!result) return { error: "Choisissez un fichier PDF." };
    if ("error" in result) return { error: result.error };
    cvFileId = result.id;
  } else if (choice.startsWith("file:")) {
    cvFileId = choice.slice(5);
  } else {
    return { error: "Choisissez le CV à envoyer." };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    user_id: user.id,
    full_name: fullName,
    email,
    phone: nullable(formData, "phone"),
    message: nullable(formData, "message"),
    cv_file_id: cvFileId,
    include_online_cv: includeOnlineCv,
    cv_id: cvId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Vous avez déjà postulé à cette offre." };
    if (error.message.includes("application_limit_reached"))
      return { error: "Vous avez atteint la limite de candidatures de votre plan ce mois-ci. Passez à un plan supérieur pour continuer." };
    return { error: "Impossible d'envoyer la candidature. Réessayez." };
  }

  revalidatePath("/espace", "layout");
  revalidatePath(`/offres/${jobId}`);
  redirect(`/offres/${jobId}/postuler?envoyee=1`);
}

export async function setApplicationStatus(applicationId: string, formData: FormData) {
  await requireAdmin();
  const status = str(formData, "status") as ApplicationStatus;
  if (!APPLICATION_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("applications").update({ status }).eq("id", applicationId);
  revalidatePath("/admin", "layout");
}
