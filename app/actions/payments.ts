"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, safePath } from "@/lib/auth";
import { createPayment, isManualOrangeMoney, isSimulation, markPaymentFailed, markPaymentPaid } from "@/lib/payments";
import { nullable, str } from "@/lib/format";
import type { ActionState, Payment, PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["mobile_money", "card", "other"];

export async function startCheckout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const planId = str(formData, "plan_id");
  const returnTo = nullable(formData, "retour");
  const user = await requireUser(`/paiement?plan=${planId}`);

  let method: PaymentMethod = "mobile_money";
  let phone = nullable(formData, "phone");
  let providerRef: string | null = null;

  if (isManualOrangeMoney()) {
    // Dépôt Orange Money : numéro utilisé + ID de la transaction reçu par SMS
    const digits = (phone ?? "").replace(/\D/g, "").replace(/^226/, "");
    providerRef = str(formData, "transaction_id").replace(/\s+/g, "").toUpperCase();
    const fieldErrors: Record<string, string> = {};
    if (!/^\d{8}$/.test(digits)) fieldErrors.phone = "Numéro Orange invalide (8 chiffres, ex. 64 71 20 44).";
    if (!/^[A-Z0-9.\-_/]{6,40}$/.test(providerRef))
      fieldErrors.transaction_id = "ID de transaction invalide : recopiez-le tel qu'il figure dans le SMS Orange Money.";
    if (formData.get("depot") !== "on") fieldErrors.depot = "Confirmez avoir effectué le dépôt.";
    if (Object.keys(fieldErrors).length) return { fieldErrors };
    phone = digits.replace(/(\d{2})(?=\d)/g, "$1 ");

    // Un seul paiement en vérification à la fois
    const supabase = await createClient();
    const { data: pending } = await supabase
      .from("payments")
      .select("reference")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .eq("provider", "orange_money")
      .limit(1)
      .maybeSingle<{ reference: string }>();
    if (pending) redirect(`/paiement/${pending.reference}`);
  } else {
    method = str(formData, "method") as PaymentMethod;
    if (!METHODS.includes(method)) return { fieldErrors: { method: "Choisissez une méthode de paiement." } };
    if (method === "mobile_money" && !/^\+?[\d\s]{8,15}$/.test(phone ?? ""))
      return { fieldErrors: { phone: "Numéro de téléphone invalide." } };
  }

  let target: string;
  try {
    const { payment, redirectUrl } = await createPayment({
      userId: user.id,
      planId,
      method,
      phone,
      providerRef,
      returnTo: returnTo ? safePath(returnTo) : null,
    });
    target = redirectUrl ?? `/paiement/${payment.reference}`;
  } catch (e) {
    if (e instanceof Error && e.message === "duplicate_ref")
      return { fieldErrors: { transaction_id: "Cet ID de transaction a déjà été utilisé pour un autre paiement." } };
    return { error: "Impossible d'enregistrer le paiement. Réessayez." };
  }
  revalidatePath("/admin", "layout");
  redirect(target);
}

async function ownPendingPayment(reference: string) {
  const user = await requireUser(`/paiement/${reference}`);
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .eq("user_id", user.id)
    .maybeSingle<Payment>();
  return data?.status === "pending" ? data : null;
}

/** Mode simulation uniquement : confirme ou fait échouer le paiement. */
export async function simulatePayment(reference: string, outcome: "paid" | "failed") {
  if (!isSimulation()) throw new Error("Simulation désactivée");
  const payment = await ownPendingPayment(reference);
  if (payment) {
    if (new Date(payment.expires_at).getTime() < Date.now()) await markPaymentFailed(payment.id, "expired");
    else if (outcome === "paid") await markPaymentPaid(payment.id);
    else await markPaymentFailed(payment.id, "failed");
  }
  revalidatePath("/", "layout");
  redirect(`/paiement/${reference}`);
}

export async function cancelPayment(reference: string) {
  const payment = await ownPendingPayment(reference);
  if (payment) await markPaymentFailed(payment.id, "cancelled");
  redirect("/abonnements");
}

/** Marque un paiement en attente comme expiré une fois le délai dépassé. */
export async function expirePayment(reference: string) {
  const payment = await ownPendingPayment(reference);
  if (payment && new Date(payment.expires_at).getTime() <= Date.now()) {
    await markPaymentFailed(payment.id, "expired");
  }
  revalidatePath(`/paiement/${reference}`);
}

/** Résiliation : l'accès reste ouvert jusqu'à l'échéance, pas de renouvellement. */
export async function cancelSubscription() {
  const user = await requireUser("/espace/abonnement");
  const sub = user.subscription;
  if (sub?.isActive && sub.status === "active") {
    await createAdminClient().from("subscriptions").update({ status: "cancelled" }).eq("id", sub.id);
  }
  revalidatePath("/", "layout");
}
