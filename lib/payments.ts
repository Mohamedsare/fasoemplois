import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "./supabase/admin";
import { SUBSCRIPTION_DAYS } from "./constants";
import type { Payment, PaymentMethod } from "./types";

/**
 * Point d'extension pour un prestataire automatique (CinetPay, FedaPay, PayDunya…).
 * - `initiate` : crée la transaction chez le prestataire, renvoie l'URL de redirection éventuelle.
 * - La confirmation arrive ensuite par webhook → appeler `markPaymentPaid` / `markPaymentFailed`.
 */
export interface PaymentProvider {
  name: string;
  initiate(payment: Payment): Promise<{ redirectUrl?: string; providerRef?: string }>;
}

const simulationProvider: PaymentProvider = {
  name: "simulation",
  async initiate() {
    // Rien à appeler : la page de paiement propose de simuler le succès ou l'échec.
    return {};
  },
};

/**
 * Orange Money manuel : l'utilisateur dépose le montant sur le compte Orange Money du service,
 * saisit l'ID de la transaction, puis un administrateur vérifie et valide le paiement.
 */
const orangeMoneyProvider: PaymentProvider = {
  name: "orange_money",
  async initiate() {
    // Rien à appeler : la validation est faite à la main par un administrateur.
    return {};
  },
};

/**
 * Prestataire utilisé : Orange Money manuel par défaut. La simulation (paiement fictif, pour
 * le développement) n'est active que si PAYMENT_PROVIDER=simulation est défini explicitement.
 */
function providerName() {
  return process.env.PAYMENT_PROVIDER || "orange_money";
}

export function getPaymentProvider(): PaymentProvider {
  const name = providerName();
  if (name === "simulation") return simulationProvider;
  if (name === "orange_money") return orangeMoneyProvider;
  throw new Error(`Prestataire de paiement inconnu : ${name}`);
}

export const isSimulation = () => providerName() === "simulation";
export const isManualOrangeMoney = () => providerName() === "orange_money";
export const isPaymentConfigured = () => isSimulation() || isManualOrangeMoney();

/** Durée pendant laquelle un dépôt Orange Money reste « en vérification ». */
const MANUAL_REVIEW_DAYS = 7;

function newReference() {
  return `VC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function createPayment(input: {
  userId: string;
  planId: string;
  method: PaymentMethod;
  phone: string | null;
  returnTo: string | null;
  /** ID de la transaction Orange Money saisi par l'utilisateur (paiement manuel). */
  providerRef?: string | null;
}) {
  const admin = createAdminClient();
  const { data: plan } = await admin
    .from("plans")
    .select("id, price, is_available")
    .eq("id", input.planId)
    .single<{ id: string; price: number; is_available: boolean }>();
  if (!plan?.is_available) throw new Error("Plan indisponible");

  const provider = getPaymentProvider();
  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      reference: newReference(),
      user_id: input.userId,
      plan_id: plan.id,
      amount: plan.price,
      method: input.method,
      phone: input.phone,
      provider: provider.name,
      provider_ref: input.providerRef ?? null,
      return_to: input.returnTo,
      ...(provider.name === "orange_money"
        ? { expires_at: new Date(Date.now() + MANUAL_REVIEW_DAYS * 86_400_000).toISOString() }
        : {}),
    })
    .select("*")
    .single<Payment>();
  if (error?.code === "23505") throw new Error("duplicate_ref");
  if (error || !payment) throw new Error("Création du paiement impossible");

  const result = await provider.initiate(payment);
  if (result.providerRef) {
    await admin.from("payments").update({ provider_ref: result.providerRef }).eq("id", payment.id);
  }
  return { payment, redirectUrl: result.redirectUrl };
}

/** Valide un paiement et active (ou prolonge) l'abonnement. Idempotent. */
export async function markPaymentPaid(paymentId: string, reviewerId?: string) {
  const admin = createAdminClient();
  const now0 = new Date().toISOString();
  const { data: payment } = await admin
    .from("payments")
    .update({
      status: "paid",
      paid_at: now0,
      ...(reviewerId ? { reviewed_at: now0, reviewed_by: reviewerId } : {}),
    })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle<Payment>();
  if (!payment) return;

  // Si un abonnement est en cours, le nouveau démarre à son échéance.
  const { data: current } = await admin
    .from("subscriptions")
    .select("id, expires_at")
    .eq("user_id", payment.user_id)
    .in("status", ["active", "cancelled"])
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; expires_at: string }>();

  const now = new Date();
  const start = current ? new Date(current.expires_at) : now;
  const expires = new Date(start.getTime() + SUBSCRIPTION_DAYS * 86_400_000);

  if (current) {
    // Changement / renouvellement : on remplace l'abonnement courant.
    await admin.from("subscriptions").update({ status: "expired", expires_at: now.toISOString() }).eq("id", current.id);
  }
  await admin.from("subscriptions").insert({
    user_id: payment.user_id,
    plan_id: payment.plan_id,
    payment_id: payment.id,
    status: "active",
    started_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });
}

export async function markPaymentFailed(
  paymentId: string,
  status: "failed" | "expired" | "cancelled",
  review?: { reviewerId: string; note: string | null },
) {
  const admin = createAdminClient();
  await admin
    .from("payments")
    .update({
      status,
      ...(review ? { admin_note: review.note, reviewed_at: new Date().toISOString(), reviewed_by: review.reviewerId } : {}),
    })
    .eq("id", paymentId)
    .eq("status", "pending");
}
