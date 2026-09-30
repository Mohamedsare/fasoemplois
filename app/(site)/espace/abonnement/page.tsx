import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { cancelSubscription } from "@/app/actions/payments";
import { formatDate, formatNumber, formatShortDate } from "@/lib/format";
import { PaymentBadge, SubscriptionBadge } from "@/components/status-badge";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Payment } from "@/lib/types";

export const metadata: Metadata = { title: "Abonnement" };

type PaymentRow = Payment & { plan: { name: string } | null };

/** Référence : cliquable tant que le paiement attend (page de suivi). */
function Reference({ p }: { p: PaymentRow }) {
  return p.status === "pending" ? (
    <Link href={`/paiement/${p.reference}`} className="underline">{p.reference}</Link>
  ) : (
    <>{p.reference}</>
  );
}

export default async function SubscriptionPage() {
  const user = await requireUser("/espace/abonnement");
  const supabase = await createClient();
  const [plans, { data: payments }] = await Promise.all([
    getAvailablePlans(),
    supabase
      .from("payments")
      .select("*, plan:plans(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<PaymentRow[]>(),
  ]);
  const sub = user.subscription;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Abonnement</h1>

      {!sub ? (
        <div className="card space-y-3 p-5 sm:p-6">
          <p className="font-semibold">Vous n&apos;avez pas encore d&apos;abonnement.</p>
          <p className="text-sm text-muted">
            Abonnez-vous pour télécharger vos CV en PDF, utiliser les modèles Premium, créer plusieurs CV et profiter davantage de
            l&apos;assistant IA.
          </p>
          <Link href="/abonnements" className="btn-primary h-12 w-full sm:h-auto sm:w-auto">Voir les abonnements</Link>
        </div>
      ) : sub.isActive ? (
        <div className="card space-y-5 p-5 sm:p-6 lg:flex lg:items-center lg:gap-6 lg:space-y-0">
          <div className="flex items-start justify-between gap-3 lg:block lg:space-y-1">
            <div>
              <p className="text-xs text-muted">Plan actuel</p>
              <p className="text-xl font-bold">{sub.plan.name}</p>
            </div>
            <SubscriptionBadge active cancelled={sub.status === "cancelled"} />
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-4 text-sm sm:grid-cols-3 lg:border-0 lg:py-0">
            <div><dt className="text-xs text-muted">Montant</dt><dd className="font-semibold">{formatNumber(sub.plan.price)} FCFA / mois</dd></div>
            <div><dt className="text-xs text-muted">Activé le</dt><dd className="font-semibold">{formatShortDate(sub.started_at)}</dd></div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-muted">{sub.status === "cancelled" ? "Fin d'accès" : "Échéance"}</dt>
              <dd className="font-semibold">{formatDate(sub.expires_at)}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 lg:w-60">
            <Link href="/abonnements" className="btn-primary h-12 lg:h-auto">Changer de plan / Renouveler</Link>
            {sub.status === "active" && (
              <form action={cancelSubscription}>
                <ConfirmSubmit
                  message={`Ne pas renouveler votre abonnement ? Vous gardez votre accès jusqu'au ${formatDate(sub.expires_at)}.`}
                  className="btn-secondary h-12 w-full lg:h-auto"
                >
                  Ne pas renouveler
                </ConfirmSubmit>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-star-400 bg-star-400/10 p-5 sm:p-6">
          <SubscriptionBadge active={false} />
          <p className="text-lg font-bold">Votre abonnement a expiré</p>
          <p className="text-sm text-muted">
            Tous vos CV sont conservés. Dernier plan : {sub.plan.name}, expiré le {formatDate(sub.expires_at)}.
          </p>
          <Link href={`/paiement?plan=${sub.plan_id}`} className="btn-primary h-12 w-full sm:h-auto sm:w-auto">Renouveler mon abonnement</Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Plans disponibles</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {plans.map((p) => {
            const current = sub?.isActive && sub.plan_id === p.id;
            return (
              <Link
                key={p.id}
                href={`/paiement?plan=${p.id}`}
                className={`card space-y-1 p-4 hover:border-ink/30 ${current ? "border-2 border-ink" : ""}`}
              >
                <p className="text-xs font-semibold">{p.name}</p>
                <p className="font-bold">{formatNumber(p.price)} <span className="text-xs font-normal text-muted">FCFA / mois</span></p>
                <p className="text-xs text-muted">{p.cv_limit} CV · PDF · Premium</p>
                {current && <p className="inline-flex items-center gap-1 text-xs text-brand-700"><Check aria-hidden className="size-3.5" /> Plan actuel</p>}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Historique des paiements</h2>
        {payments?.length ? (
          <>
            {/* Mobile : cartes */}
            <ul className="space-y-2 sm:hidden">
              {payments.map((p) => (
                <li key={p.id} className="card space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{p.plan?.name} · {formatNumber(p.amount)} FCFA</p>
                      <p className="text-xs text-muted">{formatShortDate(p.created_at)} · <span className="font-mono"><Reference p={p} /></span></p>
                    </div>
                    <PaymentBadge status={p.status} />
                  </div>
                  {p.status === "failed" && p.admin_note && <p className="text-xs text-accent-600">{p.admin_note}</p>}
                </li>
              ))}
            </ul>
            {/* Écran large : tableau */}
            <div className="card hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap">{formatShortDate(p.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs"><Reference p={p} /></td>
                      <td className="px-4 py-3">{p.plan?.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(p.amount)} FCFA</td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={p.status} />
                        {p.status === "failed" && p.admin_note && <span className="mt-1 block text-xs text-accent-600">{p.admin_note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="card p-5 text-sm text-muted">Aucun paiement pour le moment.</p>
        )}
      </section>
    </div>
  );
}
