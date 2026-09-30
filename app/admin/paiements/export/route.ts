import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { csvResponse } from "@/lib/csv";
import { sanitizeSearch } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Payment, PaymentStatus } from "@/lib/types";

type Row = Payment & { plan: { name: string } | null; profile: { full_name: string; email: string | null } | null };

/** Export CSV des paiements (mêmes filtres que l'historique) : comptabilité. */
export async function GET(request: NextRequest) {
  await requireAdmin();
  const statut = request.nextUrl.searchParams.get("statut") ?? "";
  const q = sanitizeSearch(request.nextUrl.searchParams.get("q") ?? "");

  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select("*, plan:plans(name), profile:profiles!payments_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(20000);
  if (statut in PAYMENT_STATUS_LABELS) query = query.eq("status", statut);
  if (q) query = query.or(`reference.ilike.%${q}%,provider_ref.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query.returns<Row[]>();

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(
    `paiements-${date}.csv`,
    ["Date", "Référence", "Utilisateur", "E-mail", "Plan", "Montant (FCFA)", "Statut", "Opérateur", "ID transaction", "Téléphone", "Payé le", "Motif du rejet"],
    (data ?? []).map((p) => [
      p.created_at.slice(0, 16).replace("T", " "),
      p.reference,
      p.profile?.full_name,
      p.profile?.email,
      p.plan?.name,
      p.amount,
      PAYMENT_STATUS_LABELS[p.status as PaymentStatus],
      p.provider,
      p.provider_ref,
      p.phone,
      p.paid_at?.slice(0, 16).replace("T", " "),
      p.admin_note,
    ]),
  );
}
