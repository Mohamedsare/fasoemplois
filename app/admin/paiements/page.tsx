import { Check, CircleDashed, ReceiptText, Wallet, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { approvePayment, rejectPayment } from "@/app/actions/admin";
import { ORANGE_MONEY, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { daysAgoIso, formatDateTime, formatNumber, formatRelative, param, sanitizeSearch, whatsappLink } from "@/lib/format";
import { PaymentBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Payment, PaymentStatus } from "@/lib/types";
import { ExportLink, FilterChips, PageHeader, Pagination, SearchBox, StatCard, buildHref, pageParam } from "../ui";

export const metadata: Metadata = { title: "Paiements" };

const PER_PAGE = 30;

// payments a deux liens vers profiles (user_id, reviewed_by) : on précise la clé
const COLUMNS =
  "*, plan:plans(name), profile:profiles!payments_user_id_fkey(full_name, phone, email), reviewer:profiles!payments_reviewed_by_fkey(full_name)";

type Row = Payment & {
  plan: { name: string } | null;
  profile: { full_name: string; phone: string | null; email: string | null } | null;
  reviewer: { full_name: string } | null;
};

function methodLabel(p: Payment) {
  if (p.provider === "orange_money") return "Orange Money";
  return PAYMENT_METHOD_LABELS[p.method] + (p.provider === "simulation" ? " (test)" : "");
}

export default async function AdminPaymentsPage(props: PageProps<"/admin/paiements">) {
  const sp = await props.searchParams;
  const statut = param(sp.statut) as PaymentStatus | "";
  const q = sanitizeSearch(param(sp.q));
  const page = pageParam(sp.page);
  const supabase = await createClient();

  let query = supabase.from("payments").select(COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (statut && statut in PAYMENT_STATUS_LABELS) query = query.eq("status", statut);
  if (q) query = query.or(`reference.ilike.%${q}%,provider_ref.ilike.%${q}%,phone.ilike.%${q}%`);

  const monthStart = new Date(daysAgoIso(0));
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: payments, count: total }, { data: toReview }, { data: month }, { data: last30 }] = await Promise.all([
    query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1).returns<Row[]>(),
    supabase.from("payments").select(COLUMNS).eq("status", "pending").eq("provider", "orange_money").order("created_at", { ascending: true }).returns<Row[]>(),
    supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", monthStart.toISOString()).limit(10000).returns<{ amount: number }[]>(),
    supabase.from("payments").select("status").gte("created_at", daysAgoIso(30)).in("status", ["paid", "failed"]).limit(10000).returns<{ status: PaymentStatus }[]>(),
  ]);
  const monthTotal = (month ?? []).reduce((n, p) => n + p.amount, 0);
  const decided = last30 ?? [];
  const approvalRate = decided.length ? Math.round((decided.filter((p) => p.status === "paid").length / decided.length) * 100) : null;
  const href = (params: { page?: number; statut?: string }) => buildHref("/admin/paiements", { q, statut: params.statut ?? statut, page: params.page });

  return (
    <div className="space-y-6">
      <PageHeader title="Paiements" description="Vérification des dépôts Orange Money et historique des paiements.">
        <ExportLink href={buildHref("/admin/paiements/export", { q, statut })} />
      </PageHeader>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="À vérifier" icon={CircleDashed} tone={toReview?.length ? "warn" : "default"} value={formatNumber(toReview?.length ?? 0)} hint="dépôts en attente" />
        <StatCard label="Encaissé ce mois-ci" icon={Wallet} tone="brand" value={`${formatNumber(monthTotal)} FCFA`} hint={`${month?.length ?? 0} paiement(s) validé(s)`} />
        <StatCard label="Taux de validation" icon={Check} value={approvalRate === null ? "—" : `${approvalRate} %`} hint="dépôts validés, 30 derniers jours" />
        <StatCard label="Paiements (total)" icon={ReceiptText} value={formatNumber(total ?? 0)} hint={statut || q ? "dans la sélection" : "depuis le lancement"} />
      </dl>

      {/* File de vérification des dépôts Orange Money */}
      <section className="space-y-3" aria-labelledby="a-verifier">
        <div>
          <h2 id="a-verifier" className="text-lg font-semibold">À vérifier</h2>
          <p className="text-xs text-muted">
            Vérifiez dans votre historique Orange Money ({ORANGE_MONEY.number}) qu&apos;un dépôt avec cet ID, ce montant et ce numéro a bien
            été reçu, puis validez : l&apos;abonnement est activé immédiatement. Les plus anciens sont en premier.
          </p>
        </div>
        {toReview?.length ? (
          <ul className="space-y-3">
            {toReview.map((p) => {
              const wa = whatsappLink(p.profile?.phone ?? p.phone, `Bonjour, à propos de votre paiement ${p.reference} :`);
              return (
                <li key={p.id} className="card flex flex-col gap-4 border-[#ff7900]/40 p-5 lg:flex-row lg:items-center">
                  <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-xs text-muted">ID de transaction</dt>
                      <dd className="font-mono text-base font-bold break-all">{p.provider_ref}</dd>
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
                      <dd className="truncate">
                        <Link href={`/admin/utilisateurs/${p.user_id}`} className="underline">{p.profile?.full_name || p.profile?.email || "—"}</Link>
                        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-brand-700 underline">WhatsApp</a>}
                      </dd>
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
              );
            })}
          </ul>
        ) : (
          <p className="card p-6 text-center text-sm text-muted">Aucun dépôt en attente de vérification.</p>
        )}
      </section>

      {/* Historique */}
      <section className="space-y-3" aria-labelledby="historique">
        <h2 id="historique" className="text-lg font-semibold">Historique</h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips
            active={statut}
            items={[
              { key: "", label: "Tous", href: href({ statut: "", page: 1 }) },
              ...(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => ({ key: s, label: PAYMENT_STATUS_LABELS[s], href: href({ statut: s, page: 1 }) })),
            ]}
          />
          <SearchBox action="/admin/paiements" q={q} placeholder="Référence, ID transaction, téléphone…" hidden={{ statut }} />
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-240 text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Référence</th><th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 font-medium">Méthode</th><th className="px-4 py-3 font-medium">ID transaction</th>
                <th className="px-4 py-3 text-right font-medium">Montant</th><th className="px-4 py-3 font-medium">Statut</th><th className="px-4 py-3 font-medium">Traité par</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/utilisateurs/${p.user_id}`} className="hover:text-brand-700">{p.profile?.full_name || p.profile?.email || "—"}</Link>
                  </td>
                  <td className="px-4 py-2">{p.plan?.name}</td>
                  <td className="px-4 py-2 text-muted">{methodLabel(p)}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {p.provider_ref ?? "—"}
                    {p.status === "failed" && p.admin_note && <span className="block font-sans text-accent-600">{p.admin_note}</span>}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">{formatNumber(p.amount)} FCFA</td>
                  <td className="px-4 py-2"><PaymentBadge status={p.status} /></td>
                  <td className="px-4 py-2 text-xs text-muted">
                    {p.reviewer?.full_name ? (
                      <span title={p.reviewed_at ? formatDateTime(p.reviewed_at) : undefined}>{p.reviewer.full_name}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments?.length && <p className="p-8 text-center text-sm text-muted">Aucun paiement{q ? ` pour « ${q} »` : ""}.</p>}
        </div>
        <Pagination page={page} perPage={PER_PAGE} total={total ?? 0} href={(n) => href({ page: n })} />
      </section>
    </div>
  );
}
