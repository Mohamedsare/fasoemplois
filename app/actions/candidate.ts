"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { nullable, str } from "@/lib/format";
import type { ActionState } from "@/lib/types";

/** Enregistre les informations du compte (préremplies dans les nouveaux CV). */
export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/espace/profil");

  const firstName = str(formData, "first_name");
  const lastName = str(formData, "last_name");
  if (!firstName || !lastName) return { fieldErrors: { first_name: !firstName ? "Indiquez votre prénom." : "", last_name: !lastName ? "Indiquez votre nom." : "" } };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName.slice(0, 80),
      last_name: lastName.slice(0, 80),
      phone: nullable(formData, "phone"),
      city: nullable(formData, "city"),
      headline: nullable(formData, "headline"),
    })
    .eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer vos informations. Réessayez." };

  revalidatePath("/", "layout");
  return { success: "Informations enregistrées." };
}
