"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";
import { safePath } from "@/lib/auth";
import { nullable, str } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail)."
          : "E-mail ou mot de passe incorrect.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safePath(str(formData, "suivant")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const firstName = str(formData, "first_name");
  const lastName = str(formData, "last_name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  // Sans destination : directement le créateur de CV.
  const next = safePath(str(formData, "suivant"), "/cv");

  const fieldErrors: Record<string, string> = {};
  if (!lastName) fieldErrors.last_name = "Indiquez votre nom.";
  if (!firstName) fieldErrors.first_name = "Indiquez votre prénom.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Adresse e-mail invalide.";
  if (password.length < 8) fieldErrors.password = "8 caractères minimum.";
  if (password !== str(formData, "password_confirm"))
    fieldErrors.password_confirm = "Les mots de passe ne correspondent pas.";
  if (formData.get("terms") !== "on") fieldErrors.terms = "Vous devez accepter les conditions d'utilisation.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm?suivant=${encodeURIComponent(next)}`,
      data: { first_name: firstName, last_name: lastName, phone: nullable(formData, "phone") },
    },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Un compte existe déjà avec cet e-mail."
          : "Impossible de créer le compte. Réessayez.",
    };
  }

  // Confirmation par e-mail désactivée : la session est déjà ouverte.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    success: `Compte créé ! Un e-mail de confirmation a été envoyé à ${email}. Cliquez sur le lien pour activer votre compte et continuer.`,
  };
}

/** Connexion / inscription avec Google (OAuth PKCE, retour sur /auth/confirm). */
export async function signInWithGoogle(next: string | null) {
  const target = next ? safePath(next) : null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/confirm${target ? `?suivant=${encodeURIComponent(target)}` : ""}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/connexion?erreur=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email");
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: "Adresse e-mail invalide." } };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?suivant=/reinitialisation`,
  });
  // Même réponse que le compte existe ou non.
  return { success: "Lien envoyé. Vérifiez vos messages (et vos courriers indésirables)." };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = str(formData, "password");
  const fieldErrors: Record<string, string> = {};
  if (password.length < 8) fieldErrors.password = "8 caractères minimum.";
  if (password !== str(formData, "password_confirm"))
    fieldErrors.password_confirm = "Les mots de passe ne correspondent pas.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Le lien a expiré. Refaites une demande de réinitialisation." };

  revalidatePath("/", "layout");
  redirect("/espace?mdp=1");
}
