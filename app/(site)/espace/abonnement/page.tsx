import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { cancelSubscription } from "@/app/actions/payments";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatNumber, formatShortDate } from "@/lib/format";
import { PaymentBadge, SubscriptionBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/form";
import type { Payment } from "@/lib/types";

export const metadata: Metadata = { title: "Abonnement" };

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
      .returns<(Payment & { plan: { name: string } | null })[]>(),
  ]);
  const sub = user.subscription;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Abonnement</h1>

      {!sub ? (
        <div className="card space-y-3 p-6">
          <p className="font-semibold">Vous n&apos;avez pas encore d&apos;abonnement.</p>
          <p className="text-sm text-muted">Abonnez-vous pour consulter les offres complètes et postuler en ligne.</p>
          <Link href="/abonnements" className="btn-primary">Voir les abonnements</Link>
        </div>
      ) : sub.isActive ? (
        <div className="card flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <p className="text-xs text-muted">Plan actuel</p>
            <p className="text-xl font-bold">{sub.plan.name}</p>
            <SubscriptionBadge active cancelled={sub.status === "cancelled"} />
          </div>
          <dl className="grid flex-1 grid-cols-3 gap-4 text-sm">
            <div><dt className="text-xs text-muted">Montant</dt><dd className="font-semibold">{formatNumber(sub.plan.price)} FCFA / mois</dd></div>
            <div><dt className="text-xs text-muted">Activé le</dt><dd className="font-semibold">{formatDate(sub.started_at)}</dd></div>
            <div><dt className="text-xs text-muted">{sub.status === "cancelled" ? "Fin d'accès" : "Échéance"}</dt><dd className="font-semibold">{formatDate(sub.expires_at)}</dd></div>
          </dl>
          <div className="flex flex-col gap-2">
            <Link href="/abonnements/choisir" className="btn-primary">Changer de plan / Renouveler</Link>
            {sub.status === "active" && (
              <form action={cancelSubscription}>
                <SubmitButton className="btn-secondary w-full" pendingLabel="…">Ne pas renouveler</SubmitButton>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-star-400 bg-star-400/10 p-6">
          <SubscriptionBadge active={false} />
          <p className="text-lg font-bold">Votre abonnement a expiré</p>
          <p className="text-sm text-muted">
            Profil, CV, favoris et candidatures sont conservés. Dernier plan : {sub.plan.name}, expiré le {formatDate(sub.expires_at)}.
          </p>
          <Link href={`/paiement?plan=${sub.plan_id}`} className="btn-primary">Renouveler mon abonnement</Link>
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
                {current && <p className="text-xs text-brand-700">✓ Plan actuel</p>}
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Historique des paiements</h2>
        {payments?.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Méthode</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{formatShortDate(p.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.status === "pending" ? <Link href={`/paiement/${p.reference}`} className="underline">{p.reference}</Link> : p.reference}
                    </td>
                    <td className="px-4 py-3">{p.plan?.name}</td>
                    <td className="px-4 py-3 text-muted">{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className="px-4 py-3">{formatNumber(p.amount)} FCFA</td>
                    <td className="px-4 py-3"><PaymentBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun paiement pour le moment.</p>
        )}
      </section>
    </div>
  );
}
