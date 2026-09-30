"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { markPaymentFailed, markPaymentPaid } from "@/lib/payments";
import { nullable, str } from "@/lib/format";
import type { ActionState, Payment } from "@/lib/types";

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
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId)
    .select("user_id")
    .maybeSingle<{ user_id: string }>();
  if (data) await logAdminAction(admin.id, "subscription_not_renewed", data.user_id);
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
  const payment = await pendingPayment(paymentId);
  await markPaymentPaid(paymentId, admin.id);
  if (payment) {
    await logAdminAction(admin.id, "payment_approved", payment.user_id, {
      reference: payment.reference,
      amount: payment.amount,
      transaction: payment.provider_ref,
    });
  }
  revalidatePath("/", "layout");
}

/** Dépôt introuvable ou incorrect : le paiement est rejeté avec un motif visible par l'utilisateur. */
export async function rejectPayment(paymentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const note = nullable(formData, "motif") ?? "Dépôt introuvable ou montant incorrect.";
  const payment = await pendingPayment(paymentId);
  await markPaymentFailed(paymentId, "failed", { reviewerId: admin.id, note: note.slice(0, 300) });
  if (payment) {
    await logAdminAction(admin.id, "payment_rejected", payment.user_id, {
      reference: payment.reference,
      amount: payment.amount,
      transaction: payment.provider_ref,
      motif: note.slice(0, 300),
    });
  }
  revalidatePath("/", "layout");
}

async function pendingPayment(paymentId: string) {
  const { data } = await createAdminClient()
    .from("payments")
    .select("user_id, reference, amount, provider_ref")
    .eq("id", paymentId)
    .eq("status", "pending")
    .maybeSingle<Pick<Payment, "user_id" | "reference" | "amount" | "provider_ref">>();
  return data;
}

// ---------------------------------------------------------------------------
// Gestion des utilisateurs (fiche utilisateur)
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f-]{36}$/i;

function revalidateUser(userId: string) {
  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/utilisateurs/${userId}`);
}

/**
 * Offre (ou prolonge) un abonnement sans paiement : geste commercial, correction d'un dépôt, partenariat…
 * Si un abonnement est en cours, les jours s'ajoutent à son échéance.
 */
export async function grantSubscription(userId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!UUID.test(userId)) return { error: "Utilisateur introuvable." };
  const planId = str(formData, "plan_id");
  const days = Number(str(formData, "days"));
  const note = nullable(formData, "note")?.slice(0, 300) ?? null;
  const fieldErrors: Record<string, string> = {};
  if (!UUID.test(planId)) fieldErrors.plan_id = "Choisissez un plan.";
  if (!Number.isInteger(days) || days < 1 || days > 366) fieldErrors.days = "Entre 1 et 366 jours.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const db = createAdminClient();
  const { data: plan } = await db.from("plans").select("id, name").eq("id", planId).maybeSingle<{ id: string; name: string }>();
  if (!plan) return { fieldErrors: { plan_id: "Plan introuvable." } };

  const now = new Date();
  const { data: current } = await db
    .from("subscriptions")
    .select("id, expires_at")
    .eq("user_id", userId)
    .in("status", ["active", "cancelled"])
    .gt("expires_at", now.toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; expires_at: string }>();
  const base = current ? new Date(current.expires_at) : now;
  const expires = new Date(base.getTime() + days * 86_400_000);

  if (current) await db.from("subscriptions").update({ status: "expired", expires_at: now.toISOString() }).eq("id", current.id);
  const { error } = await db.from("subscriptions").insert({
    user_id: userId,
    plan_id: plan.id,
    status: "active",
    started_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });
  if (error) return { error: "Impossible d'activer l'abonnement." };

  await logAdminAction(admin.id, "subscription_granted", userId, { plan: plan.name, days, note, until: expires.toISOString() });
  revalidateUser(userId);
  return { success: `Abonnement ${plan.name} actif jusqu'au ${expires.toLocaleDateString("fr-FR")}.` };
}

/** Met fin immédiatement à l'abonnement en cours (fraude, remboursement…). */
export async function revokeSubscription(userId: string) {
  const admin = await requireAdmin();
  if (!UUID.test(userId)) return;
  const now = new Date().toISOString();
  const { data } = await createAdminClient()
    .from("subscriptions")
    .update({ status: "expired", expires_at: now })
    .eq("user_id", userId)
    .in("status", ["active", "cancelled"])
    .gt("expires_at", now)
    .select("id");
  if (data?.length) await logAdminAction(admin.id, "subscription_revoked", userId);
  revalidateUser(userId);
}

/** Remet à zéro les demandes IA des dernières 24 h (support). */
export async function resetAiQuota(userId: string) {
  const admin = await requireAdmin();
  if (!UUID.test(userId)) return;
  const since = new Date(Date.now() - 86_400_000).toISOString();
  await createAdminClient().from("ai_usage").delete().eq("user_id", userId).gte("created_at", since);
  await logAdminAction(admin.id, "ai_quota_reset", userId);
  revalidateUser(userId);
}

/** Accorde ou retire les droits d'administration (jamais sur son propre compte). */
export async function setAdminRole(userId: string, makeAdmin: boolean) {
  const admin = await requireAdmin();
  if (!UUID.test(userId) || userId === admin.id) return;
  await createAdminClient().from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  await logAdminAction(admin.id, makeAdmin ? "admin_granted" : "admin_revoked", userId);
  revalidateUser(userId);
}

/** Suppression définitive d'un compte (demande RGPD) : photos, CV, paiements, abonnements, accès. */
export async function deleteUserAccount(userId: string) {
  const admin = await requireAdmin();
  if (!UUID.test(userId) || userId === admin.id) return;
  const db = createAdminClient();
  const { data: profile } = await db
    .from("profiles")
    .select("full_name, email, is_admin")
    .eq("id", userId)
    .maybeSingle<{ full_name: string; email: string | null; is_admin: boolean }>();
  // Un administrateur doit d'abord perdre ses droits
  if (!profile || profile.is_admin) return;

  const { data: photos } = await db.storage.from("photos").list(userId, { limit: 1000 });
  if (photos?.length) await db.storage.from("photos").remove(photos.map((f) => `${userId}/${f.name}`));

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[admin] suppression du compte impossible :", error);
    redirect(`/admin/utilisateurs/${userId}?erreur=suppression`);
  }
  await logAdminAction(admin.id, "user_deleted", null, { name: profile.full_name, email: profile.email });
  revalidatePath("/admin", "layout");
  redirect("/admin/utilisateurs?supprime=1");
}
