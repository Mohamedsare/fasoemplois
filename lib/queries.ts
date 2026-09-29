import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Category, Plan } from "./types";

export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("position").returns<Category[]>();
  return data ?? [];
});

export const getAvailablePlans = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("is_available", true)
    .order("position")
    .returns<Plan[]>();
  return data ?? [];
});

export async function getMinPrice() {
  const plans = await getAvailablePlans();
  return plans.length ? Math.min(...plans.map((p) => p.price)) : null;
}

/** Ids des offres en favori pour l'utilisateur (vide si non connecté). */
export async function getFavoriteIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("favorites").select("job_id").eq("user_id", userId);
  return new Set((data ?? []).map((f) => f.job_id as string));
}
