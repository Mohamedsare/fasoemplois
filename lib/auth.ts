import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Plan, Profile, Subscription } from "./types";

export type CurrentSubscription = Subscription & { plan: Plan; isActive: boolean };

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
  /** Dernier abonnement (actif ou non), null si jamais abonné. */
  subscription: CurrentSubscription | null;
  isSubscribed: boolean;
};

/** Utilisateur connecté (vérifié côté serveur), mémorisé pour la requête. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", user.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle<Subscription & { plan: Plan }>(),
  ]);
  if (!profile) return null;

  const isActive = Boolean(
    sub && sub.status !== "expired" && new Date(sub.expires_at).getTime() > Date.now(),
  );

  return {
    id: user.id,
    email: user.email ?? "",
    profile,
    subscription: sub ? { ...sub, isActive } : null,
    isSubscribed: isActive,
  };
});

/** N'accepte que des chemins internes pour éviter les redirections ouvertes. */
export function safePath(value: string | null | undefined, fallback = "/espace") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function requireUser(next = "/espace") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?suivant=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.profile.is_admin) redirect("/");
  return user;
}

/** Pourcentage de complétion du profil (dashboard + onboarding). */
export function profileCompletion(profile: Profile, hasCv: boolean) {
  const checks = [
    Boolean(profile.first_name && profile.last_name),
    Boolean(profile.phone),
    Boolean(profile.city),
    Boolean(profile.headline),
    Boolean(profile.experience_level),
    profile.skills.length > 0,
    profile.languages.length > 0,
    hasCv,
    profile.pref_contracts.length > 0 || profile.pref_cities.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
