import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approvePayment, rejectPayment } from "@/app/actions/admin";
import { ORANGE_MONEY, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatNumber, formatRelative, param } from "@/lib/format";
import { PaymentBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Payment, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Paiements" };

// payments a deux liens vers profiles (user_id, reviewed_by) : on précise la clé
const COLUMNS = "*, plan:plans(name), profile:profiles!payments_user_id_fkey(full_name, phone)";

type Row = Payment & { plan: { name: string } | null; profile: { full_name: string; phone: string | null } | null };

function methodLabel(p: Payment) {
  if (p.provider === "orange_money") return "Orange Money";
  return PAYMENT_METHOD_LABELS[p.method] + (p.provider === "simulation" ? " (test)" : "");
}

export default async function AdminPaymentsPage(props: PageProps<"/admin/paiements">) {
  const sp = await props.searchParams;
  const statut = param(sp.statut) as PaymentStatus | "";
  const supabase = await createClient();

  let query = supabase.from("payments").select(COLUMNS).order("created_at", { ascending: false }).limit(200);
  if (statut && statut in PAYMENT_STATUS_LABELS) query = query.eq("status", statut);

  const [{ data: payments }, { data: toReview }] = await Promise.all([
    query.returns<Row[]>(),
    supabase
      .from("payments")
      .select(COLUMNS)
      .eq("status", "pending")
      .eq("provider", "orange_money")
      .order("created_at", { ascending: true })
      .returns<Row[]>(),
  ]);
  const paidTotal = (payments ?? []).filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paiements</h1>

      {/* File de vérification des dépôts Orange Money */}
      <section className="space-y-3" aria-labelledby="a-verifier">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 id="a-verifier" className="text-lg font-semibold">À vérifier</h2>
          <span className="badge">{toReview?.length ?? 0}</span>
          <p className="w-full text-xs text-muted">
            Vérifiez dans votre historique Orange Money ({ORANGE_MONEY.number}) qu&apos;un dépôt avec cet ID, ce montant et ce numéro
            a bien été reçu, puis validez : l&apos;abonnement est activé immédiatement.
          </p>
        </div>
        {toReview?.length ? (
          <ul className="space-y-3">
            {toReview.map((p) => (
              <li key={p.id} className="card flex flex-col gap-4 border-[#ff7900]/40 p-5 lg:flex-row lg:items-center">
                <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs text-muted">ID de transaction</dt>
                    <dd className="font-mono text-base font-bold">{p.provider_ref}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Montant attendu</dt>
                    <dd className="font-bold">{formatNumber(p.amount)} FCFA</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Envoyé depuis le</dt>
                    <dd className="font-mono font-medium">{p.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Utilisateur</dt>
                    <dd><Link href={`/admin/candidats/${p.user_id}`} className="underline">{p.profile?.full_name || "—"}</Link></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Plan</dt>
                    <dd>{p.plan?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Déclaré</dt>
                    <dd title={formatDateTime(p.created_at)}>{formatRelative(p.created_at)} · <span className="font-mono text-xs">{p.reference}</span></dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-2 lg:w-64">
                  <form action={approvePayment.bind(null, p.id)}>
                    <SubmitButton className="btn-primary w-full" pendingLabel="Validation…">
                      <Check aria-hidden className="size-4" /> Valider le dépôt
                    </SubmitButton>
                  </form>
                  <form action={rejectPayment.bind(null, p.id)} className="flex gap-2">
                    <label htmlFor={`motif-${p.id}`} className="sr-only">Motif du rejet</label>
                    <input id={`motif-${p.id}`} name="motif" placeholder="Motif (facultatif)" className="input min-w-0 flex-1 py-1.5 text-xs" />
                    <ConfirmSubmit message={`Rejeter le dépôt ${p.provider_ref} ?`} className="btn-danger px-3 py-1.5">
                      <X aria-hidden className="size-4" /> Rejeter
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-6 text-center text-sm text-muted">Aucun dépôt en attente de vérification.</p>
        )}
      </section>

      {/* Historique */}
      <section className="space-y-3" aria-labelledby="historique">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="historique" className="mr-auto text-lg font-semibold">Historique</h2>
          <Link href="/admin/paiements" className={`chip ${!statut ? "chip-active" : ""}`}>Tous</Link>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
            <Link key={s} href={`/admin/paiements?statut=${s}`} className={`chip ${statut === s ? "chip-active" : ""}`}>
              {PAYMENT_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
        <p className="text-sm text-muted">Total encaissé (sélection affichée) : <strong className="text-ink">{formatNumber(paidTotal)} FCFA</strong></p>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-225 text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left text-xs">
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Référence</th><th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Méthode</th><th className="px-4 py-3">ID transaction</th>
                <th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th>
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
                  <td className="px-4 py-2 text-muted">{methodLabel(p)}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {p.provider_ref ?? "—"}
                    {p.status === "failed" && p.admin_note && <span className="block font-sans text-accent-600">{p.admin_note}</span>}
                  </td>
                  <td className="px-4 py-2">{formatNumber(p.amount)} FCFA</td>
                  <td className="px-4 py-2"><PaymentBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments?.length && <p className="p-8 text-center text-sm text-muted">Aucun paiement.</p>}
        </div>
      </section>
    </div>
  );
}
