import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Plan } from "./types";

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
