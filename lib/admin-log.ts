import "server-only";
import { createAdminClient } from "./supabase/admin";

/** Libellés du journal des actions administrateur. */
export const ADMIN_ACTION_LABELS: Record<string, string> = {
  payment_approved: "Paiement validé",
  payment_rejected: "Paiement rejeté",
  subscription_granted: "Abonnement offert",
  subscription_revoked: "Abonnement arrêté",
  subscription_not_renewed: "Renouvellement désactivé",
  ai_quota_reset: "Quota IA réinitialisé",
  admin_granted: "Droits administrateur accordés",
  admin_revoked: "Droits administrateur retirés",
  user_deleted: "Compte supprimé",
};

/** Enregistre une action d'administration (n'interrompt jamais l'action en cas d'échec). */
export async function logAdminAction(adminId: string, action: string, userId: string | null, details: Record<string, unknown> = {}) {
  try {
    await createAdminClient().from("admin_logs").insert({ admin_id: adminId, user_id: userId, action, details });
  } catch (error) {
    console.error("[admin-log]", error);
  }
}

const DETAIL_LABELS: Record<string, string> = {
  plan: "Plan",
  days: "Durée",
  until: "Jusqu'au",
  reference: "Réf.",
  amount: "Montant",
  transaction: "ID transaction",
  motif: "Motif",
  note: "Motif",
  name: "Nom",
  email: "E-mail",
};

/** Détails d'une action du journal, en texte court (« Plan : Standard · Durée : 30 j »). */
export function formatLogDetails(details: Record<string, unknown>) {
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => {
      let value = String(v);
      if (k === "days") value = `${v} j`;
      if (k === "amount") value = `${Number(v).toLocaleString("fr-FR")} FCFA`;
      if (k === "until") value = new Date(String(v)).toLocaleDateString("fr-FR");
      return `${DETAIL_LABELS[k] ?? k} : ${value}`;
    })
    .join(" · ");
}
