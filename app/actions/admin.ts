"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { markPaymentFailed, markPaymentPaid } from "@/lib/payments";
import { nullable, str } from "@/lib/format";
import type { ActionState } from "@/lib/types";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Plans d'abonnement
// ---------------------------------------------------------------------------

export async function savePlan(planId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(formData, "name");
  const price = Number(str(formData, "price").replace(/\s/g, ""));

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Indiquez le nom du plan.";
  if (!Number.isInteger(price) || price < 0) fieldErrors.price = "Prix invalide.";
  const cvLimit = Number(str(formData, "cv_limit"));
  if (!Number.isInteger(cvLimit) || cvLimit < 1 || cvLimit > 50) fieldErrors.cv_limit = "Entre 1 et 50.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const values = {
    name,
    price,
    description: nullable(formData, "description"),
    features: str(formData, "features").split("\n").map((f) => f.trim()).filter(Boolean).slice(0, 12),
    cv_limit: cvLimit,
    badge: nullable(formData, "badge"),
    is_featured: formData.get("is_featured") === "on",
    is_available: formData.get("is_available") === "on",
    cta_label: str(formData, "cta_label") || "Choisir ce plan",
  };

  const supabase = await createClient();
  if (planId) {
    const { error } = await supabase.from("plans").update(values).eq("id", planId);
    if (error) return { error: "Impossible d'enregistrer le plan." };
  } else {
    const { count } = await supabase.from("plans").select("id", { count: "exact", head: true });
    const { data, error } = await supabase
      .from("plans")
      .insert({ ...values, position: (count ?? 0) + 1 })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: "Impossible de créer le plan." };
    revalidatePublic();
    redirect(`/admin/plans?plan=${data.id}`);
  }
  // Un seul plan « populaire »
  if (values.is_featured) await supabase.from("plans").update({ is_featured: false }).neq("id", planId);

  revalidatePublic();
  return { success: "Plan enregistré." };
}

export async function movePlan(planId: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("id, position").order("position");
  if (!plans) return;
  const i = plans.findIndex((p) => p.id === planId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= plans.length) return;
  [plans[i], plans[j]] = [plans[j], plans[i]];
  await Promise.all(plans.map((p, idx) => supabase.from("plans").update({ position: idx + 1 }).eq("id", p.id)));
  revalidatePublic();
}

export async function cancelSubscriptionAdmin(subscriptionId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subscriptionId);
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Astuces (contenu)
// ---------------------------------------------------------------------------

export async function saveTip(tipId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = {
    title: str(formData, "title"),
    slug: str(formData, "slug") || slugify(str(formData, "title")),
    excerpt: str(formData, "excerpt"),
    content: str(formData, "content"),
    category: str(formData, "category"),
    reading_minutes: Math.max(1, Number(str(formData, "reading_minutes")) || 3),
    is_published: formData.get("is_published") === "on",
  };

  const fieldErrors: Record<string, string> = {};
  if (values.title.length < 3) fieldErrors.title = "Titre trop court.";
  if (!values.excerpt) fieldErrors.excerpt = "Ajoutez un résumé.";
  if (values.content.length < 20) fieldErrors.content = "Contenu trop court.";
  if (!values.category) fieldErrors.category = "Indiquez une catégorie.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = tipId
    ? await supabase.from("tips").update(values).eq("id", tipId)
    : await supabase.from("tips").insert(values);
  if (error) return { error: error.code === "23505" ? "Ce lien (slug) est déjà utilisé." : "Enregistrement impossible." };

  revalidatePublic();
  if (!tipId) redirect("/admin/astuces?enregistre=1");
  return { success: "Astuce enregistrée." };
}

export async function deleteTip(tipId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("tips").delete().eq("id", tipId);
  revalidatePublic();
  redirect("/admin/astuces");
}

// ---------------------------------------------------------------------------
// Paiements Orange Money manuels : vérification par un administrateur
// ---------------------------------------------------------------------------

/** Le dépôt a bien été reçu : le paiement passe « Payé » et l'abonnement est activé. */
export async function approvePayment(paymentId: string) {
  const admin = await requireAdmin();
  await markPaymentPaid(paymentId, admin.id);
  revalidatePath("/", "layout");
}

/** Dépôt introuvable ou incorrect : le paiement est rejeté avec un motif visible par l'utilisateur. */
export async function rejectPayment(paymentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const note = nullable(formData, "motif") ?? "Dépôt introuvable ou montant incorrect.";
  await markPaymentFailed(paymentId, "failed", { reviewerId: admin.id, note: note.slice(0, 300) });
  revalidatePath("/", "layout");
}
