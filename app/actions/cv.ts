"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { nullable, str, strList } from "@/lib/format";
import { registerCvFile } from "@/lib/cv-files";
import type { ActionState, CvEntry } from "@/lib/types";

/** Lit les lignes répétées « prefix[i][champ] » envoyées par le formulaire du CV. */
function readEntries(formData: FormData, prefix: string): CvEntry[] {
  const fields = ["title", "organization", "start", "end", "description"] as const;
  const count = Number(formData.get(`${prefix}_count`) ?? 0);
  const entries: CvEntry[] = [];
  for (let i = 0; i < Math.min(count, 20); i++) {
    const entry = Object.fromEntries(
      fields.map((f) => [f, str(formData, `${prefix}[${i}][${f}]`)]),
    ) as CvEntry;
    if (entry.title || entry.organization) entries.push(entry);
  }
  return entries;
}

export async function saveCv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/cv");

  const fullName = str(formData, "full_name");
  if (fullName.length < 2) return { fieldErrors: { full_name: "Indiquez votre nom complet." } };

  const supabase = await createClient();
  const { error } = await supabase.from("cvs").upsert(
    {
      user_id: user.id,
      full_name: fullName,
      headline: nullable(formData, "headline"),
      email: nullable(formData, "email"),
      phone: nullable(formData, "phone"),
      city: nullable(formData, "city"),
      summary: nullable(formData, "summary"),
      experiences: readEntries(formData, "experiences"),
      education: readEntries(formData, "education"),
      skills: strList(formData, "skills"),
      languages: strList(formData, "languages"),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "Impossible d'enregistrer votre CV. Réessayez." };

  revalidatePath("/cv", "layout");
  revalidatePath("/espace", "layout");
  return { success: "CV enregistré." };
}

export async function uploadCvFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/cv");
  const result = await registerCvFile(user.id, formData);
  if (!result) return { error: "Choisissez un fichier PDF." };
  if ("error" in result) return { error: result.error };

  revalidatePath("/cv", "layout");
  revalidatePath("/espace", "layout");
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
