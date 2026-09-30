import { Check, CornerDownLeft, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isManualOrangeMoney, isPaymentConfigured, isSimulation } from "@/lib/payments";
import { SUBSCRIPTION_DAYS } from "@/lib/constants";
import { formatDate, formatNumber, param } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Paiement" };

/** 7a — récapitulatif + méthode de paiement. */
export default async function CheckoutPage(props: PageProps<"/paiement">) {
  const sp = await props.searchParams;
  const planId = param(sp.plan);
  const jobId = param(sp.offre);
  const user = await requireUser(`/paiement?plan=${planId}${jobId ? `&offre=${jobId}` : ""}`);

  const supabase = await createClient();
  const [{ data: plan }, { data: job }] = await Promise.all([
    supabase.from("plans").select("*").eq("id", planId).eq("is_available", true).maybeSingle<Plan>(),
    jobId
      ? supabase.from("jobs").select("id, title").eq("id", jobId).maybeSingle<{ id: string; title: string }>()
      : Promise.resolve({ data: null }),
  ]);
  if (!plan) notFound();

  // Si un abonnement est en cours, le nouveau prend la suite de l'échéance actuelle
  const start = user.subscription?.isActive ? new Date(user.subscription.expires_at) : new Date();
  const renewal = new Date(start.getTime() + SUBSCRIPTION_DAYS * 86_400_000);
  const returnTo = job ? `/offres/${job.id}?debloque=1` : "/espace/abonnement";

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paiement</h1>
        <span className="inline-flex items-center gap-1 text-xs text-muted"><Lock aria-hidden className="size-3.5" /> Vérifié par notre équipe</span>
      </div>

      {isSimulation() && (
        <p className="mt-4 rounded-xl border border-star-400 bg-star-400/10 px-4 py-3 text-sm">
          <strong>Mode test :</strong> aucun paiement réel n&apos;est effectué. Vous pourrez simuler le succès ou l&apos;échec.
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-3 self-start rounded-2xl bg-cream p-6" aria-label="Récapitulatif">
          <p className="text-xs text-muted">Votre abonnement</p>
          <p className="text-lg font-bold">{plan.name}</p>
          <p>
            <span className="text-3xl font-bold">{formatNumber(plan.price)}</span>
            <span className="text-sm text-muted"> FCFA / mois</span>
          </p>
          <ul className="space-y-1 text-sm text-muted">
            {plan.features.map((f) => <li key={f} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />{f}</li>)}
          </ul>
          <div className="flex justify-between border-t border-dashed border-ink/20 pt-3 text-sm">
            <span>Total aujourd&apos;hui</span>
            <strong>{formatNumber(plan.price)} FCFA</strong>
          </div>
          <p className="text-xs text-muted">
            {isManualOrangeMoney()
              ? `${SUBSCRIPTION_DAYS} jours à partir de la validation du dépôt · sans renouvellement automatique`
              : `Valable jusqu'au ${formatDate(renewal)} · sans renouvellement automatique`}
          </p>
          {job && (
            <p className="rounded-lg border border-dashed border-ink/20 px-3 py-2 text-xs"><CornerDownLeft aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />Retour ensuite à : {job.title}</p>
          )}
          <Link href={job ? `/abonnements/choisir?offre=${job.id}` : "/abonnements"} className="text-xs underline">
            Changer de plan
          </Link>
        </section>

        {isPaymentConfigured() ? (
          <CheckoutForm
            planId={plan.id}
            amount={plan.price}
            returnTo={returnTo}
            defaultPhone={user.profile.phone ?? ""}
            mode={isManualOrangeMoney() ? "orange_money" : "simulation"}
          />
        ) : (
          <div className="card space-y-2 self-start p-6">
            <h2 className="text-lg font-bold">Paiement en ligne bientôt disponible</h2>
            <p className="text-sm text-muted">
              Le paiement n&apos;est pas encore ouvert. Contactez-nous à{" "}
              <a href="mailto:contact@fasoemplois.tech" className="underline">contact@fasoemplois.tech</a> pour activer votre abonnement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
