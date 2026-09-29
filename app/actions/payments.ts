"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, safePath } from "@/lib/auth";
import { createPayment, isSimulation, markPaymentFailed, markPaymentPaid } from "@/lib/payments";
import { nullable, str } from "@/lib/format";
import type { ActionState, Payment, PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["mobile_money", "card", "other"];

export async function startCheckout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const planId = str(formData, "plan_id");
  const returnTo = nullable(formData, "retour");
  const user = await requireUser(`/paiement?plan=${planId}`);

  const method = str(formData, "method") as PaymentMethod;
  if (!METHODS.includes(method)) return { fieldErrors: { method: "Choisissez une méthode de paiement." } };
  const phone = nullable(formData, "phone");
  if (method === "mobile_money" && !/^\+?[\d\s]{8,15}$/.test(phone ?? ""))
    return { fieldErrors: { phone: "Numéro de téléphone invalide." } };

  let target: string;
  try {
    const { payment, redirectUrl } = await createPayment({
      userId: user.id,
      planId,
      method,
      phone,
      returnTo: returnTo ? safePath(returnTo) : null,
    });
    target = redirectUrl ?? `/paiement/${payment.reference}`;
  } catch {
    return { error: "Impossible de lancer le paiement. Réessayez." };
  }
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
