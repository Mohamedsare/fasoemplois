import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatNumber, param } from "@/lib/format";
import { PaymentBadge } from "@/components/status-badge";
import type { Payment, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Paiements" };

type Row = Payment & { plan: { name: string } | null; profile: { full_name: string } | null };

export default async function AdminPaymentsPage(props: PageProps<"/admin/paiements">) {
  const sp = await props.searchParams;
  const statut = param(sp.statut) as PaymentStatus | "";
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select("*, plan:plans(name), profile:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (statut && statut in PAYMENT_STATUS_LABELS) query = query.eq("status", statut);
  const { data: payments } = await query.returns<Row[]>();
  const paidTotal = (payments ?? []).filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Paiements</h1>
        <Link href="/admin/paiements" className={`chip ${!statut ? "chip-active" : ""}`}>Tous</Link>
        {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
          <Link key={s} href={`/admin/paiements?statut=${s}`} className={`chip ${statut === s ? "chip-active" : ""}`}>
            {PAYMENT_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted">Total encaissé (sélection affichée) : <strong className="text-ink">{formatNumber(paidTotal)} FCFA</strong></p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left text-xs">
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Méthode</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2">{formatDateTime(p.created_at)}</td>
                <td className="px-4 py-2 font-mono text-xs">{p.reference}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/candidats/${p.user_id}`} className="hover:text-brand-700">{p.profile?.full_name || "—"}</Link>
                </td>
                <td className="px-4 py-2">{p.plan?.name}</td>
                <td className="px-4 py-2 text-muted">{PAYMENT_METHOD_LABELS[p.method]}{p.provider === "simulation" ? " (test)" : ""}</td>
                <td className="px-4 py-2">{formatNumber(p.amount)} FCFA</td>
                <td className="px-4 py-2"><PaymentBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!payments?.length && <p className="p-8 text-center text-sm text-muted">Aucun paiement.</p>}
      </div>
    </div>
  );
}
