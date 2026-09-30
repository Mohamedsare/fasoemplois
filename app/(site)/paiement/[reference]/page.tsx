import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isSimulation } from "@/lib/payments";
import { cancelPayment, simulatePayment } from "@/app/actions/payments";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ORANGE_MONEY } from "@/lib/constants";
import { CheckCircle } from "@/components/ui";
import { SubmitButton } from "@/components/form";
import type { Payment, Plan } from "@/lib/types";
import { PendingWatcher, ReviewWatcher } from "./pending-watcher";

export const metadata: Metadata = { title: "Paiement" };

/** 7b — états : en cours · succès · échec · expiré. */
export default async function PaymentStatusPage(props: PageProps<"/paiement/[reference]">) {
  const { reference } = await props.params;
  const user = await requireUser(`/paiement/${reference}`);

  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("*, plan:plans(*)")
    .eq("reference", reference)
    .eq("user_id", user.id)
    .maybeSingle<Payment & { plan: Plan }>();
  if (!payment) notFound();

  const retry = `/paiement?plan=${payment.plan_id}${
    payment.return_to?.startsWith("/offres/") ? `&offre=${payment.return_to.split("/")[2].split("?")[0]}` : ""
  }`;
  const amount = `${formatNumber(payment.amount)} FCFA`;
  const manual = payment.provider === "orange_money";

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        {payment.status === "pending" && manual && (
          <>
            <CheckCircle tone="muted" />
            <h1 className="text-xl font-bold">Paiement en cours de vérification</h1>
            <p className="text-sm text-muted">
              Nous vérifions votre dépôt Orange Money. Votre abonnement sera activé dès la validation :
              cette page se mettra à jour automatiquement, vous pouvez aussi revenir plus tard.
            </p>
            <dl className="w-full space-y-1 rounded-xl bg-surface p-4 text-left text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Plan</dt><dd className="font-medium">{payment.plan.name} · {amount}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">ID de transaction</dt><dd className="font-mono font-medium">{payment.provider_ref}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Envoyé depuis le</dt><dd className="font-medium">{payment.phone}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Déclaré le</dt><dd className="font-medium">{formatDateTime(payment.created_at)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Référence</dt><dd className="font-mono">{payment.reference}</dd></div>
            </dl>
            <ReviewWatcher />
            <Link href="/espace/abonnement" className="btn-secondary w-full">Voir mes paiements</Link>
            <form action={cancelPayment.bind(null, reference)}>
              <SubmitButton className="text-sm text-muted underline hover:text-ink" pendingLabel="…">Annuler cette déclaration</SubmitButton>
            </form>
          </>
        )}

        {payment.status === "pending" && !manual && (
          <>
            <CheckCircle tone="muted" />
            <h1 className="text-xl font-bold">Paiement en cours</h1>
            <p className="text-sm text-muted">
              {payment.method === "mobile_money"
                ? "Validez la demande sur votre téléphone. Ne fermez pas cette page."
                : "Finalisez le paiement auprès de votre fournisseur. Ne fermez pas cette page."}
            </p>
            <p className="text-sm">{payment.plan.name} · {amount}</p>
            <PendingWatcher reference={reference} expiresAt={payment.expires_at} />

            {isSimulation() && (
              <div className="w-full space-y-2 rounded-xl border border-dashed border-star-400 p-4">
                <p className="text-xs font-semibold">Mode test</p>
                <div className="flex gap-2">
                  <form action={simulatePayment.bind(null, reference, "paid")} className="flex-1">
                    <SubmitButton className="btn-primary w-full" pendingLabel="…">Simuler le succès</SubmitButton>
                  </form>
                  <form action={simulatePayment.bind(null, reference, "failed")} className="flex-1">
                    <SubmitButton className="btn-secondary w-full" pendingLabel="…">Simuler l&apos;échec</SubmitButton>
                  </form>
                </div>
              </div>
            )}
            <form action={cancelPayment.bind(null, reference)}>
              <SubmitButton className="btn-secondary" pendingLabel="…">Annuler</SubmitButton>
            </form>
          </>
        )}

        {payment.status === "paid" && (
          <>
            <CheckCircle />
            <h1 className="text-xl font-bold">Paiement confirmé</h1>
            <p className="text-sm text-muted">
              {payment.plan.name} · {amount} / mois.{" "}
              {payment.return_to?.startsWith("/offres/") ? "Votre offre est débloquée." : "Votre abonnement est actif."}
            </p>
            <Link href={payment.return_to ?? "/offres"} className="btn-primary w-full">
              {payment.return_to?.startsWith("/offres/") ? "Retour à l'offre" : "Continuer"}
            </Link>
            <p className="text-xs text-muted">Référence : {payment.reference}</p>
          </>
        )}

        {payment.status === "failed" && (
          <>
            <CheckCircle tone="danger" />
            <h1 className="text-xl font-bold">{manual ? "Dépôt non validé" : "Paiement échoué"}</h1>
            {manual ? (
              <>
                <p className="text-sm text-muted">
                  Nous n&apos;avons pas pu valider votre dépôt (ID {payment.provider_ref}).
                </p>
                {payment.admin_note && (
                  <p className="w-full rounded-xl bg-accent-500/5 px-4 py-3 text-left text-sm text-accent-600">
                    <strong>Motif :</strong> {payment.admin_note}
                  </p>
                )}
                <p className="text-xs text-muted">
                  Vérifiez l&apos;ID de transaction et le montant envoyé au {ORANGE_MONEY.number} ({ORANGE_MONEY.holder}), ou écrivez à{" "}
                  <a href="mailto:contact@fasoemplois.tech" className="underline">contact@fasoemplois.tech</a> avec la référence {payment.reference}.
                </p>
                <Link href={retry} className="btn-primary w-full">Déclarer un autre dépôt</Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">Aucun montant n&apos;a été débité. Vérifiez votre solde ou changez de méthode.</p>
                <Link href={retry} className="btn-primary w-full">Réessayer</Link>
                <Link href={retry} className="text-sm text-muted hover:text-ink">Changer de méthode</Link>
              </>
            )}
          </>
        )}

        {(payment.status === "expired" || payment.status === "cancelled") && (
          <>
            <CheckCircle tone="warn" />
            <h1 className="text-xl font-bold">
              {payment.status === "expired" ? "Paiement expiré" : "Paiement annulé"}
            </h1>
            <p className="text-sm text-muted">
              {payment.status === "expired" ? "Le délai de validation est dépassé." : "Aucun montant n'a été débité."}
            </p>
            <Link href={retry} className="btn-primary w-full">Relancer le paiement</Link>
            <Link href="/abonnements" className="text-sm text-muted hover:text-ink">Retour aux abonnements</Link>
          </>
        )}
      </div>
    </div>
  );
}
