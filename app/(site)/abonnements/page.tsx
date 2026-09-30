import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { PlanCard } from "@/components/plan-card";

export const metadata: Metadata = {
  title: "Abonnements",
  description: "Téléchargez vos CV en PDF, créez plus de CV et profitez de l'assistant IA. Mensuel, sans engagement.",
};

const FAQ = [
  {
    q: "Que débloque un abonnement ?",
    a: "Le téléchargement de vos CV en PDF (sans filigrane), la création de plusieurs CV selon le plan et un usage quotidien étendu de l'assistant IA.",
  },
  {
    q: "Comment fonctionne le renouvellement ?",
    a: "L'abonnement dure 30 jours. Avant l'échéance, vous pouvez le renouveler en un clic depuis votre espace : la durée restante est conservée.",
  },
  {
    q: "Puis-je changer de plan ?",
    a: "Oui, à tout moment depuis la page Abonnement de votre espace. Le nouveau plan prend effet immédiatement.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Orange Money : vous envoyez le montant au 64 71 20 44 (SARE MOHAMED), puis vous saisissez l'ID de la transaction reçu par SMS. Votre abonnement est activé dès que notre équipe a vérifié le dépôt.",
  },
  {
    q: "Que se passe-t-il à l'expiration ?",
    a: "Tous vos CV sont conservés et restent modifiables. Le téléchargement PDF et la création de nouveaux CV redeviennent réservés aux abonnés.",
  },
];

export default async function PricingPage(props: PageProps<"/abonnements">) {
  const sp = await props.searchParams;
  const [plans, user] = await Promise.all([getAvailablePlans(), getCurrentUser()]);
  const currentPlanId = user?.subscription?.isActive ? user.subscription.plan_id : null;

  return (
    <div className="container-page py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choisissez votre abonnement</h1>
        <p className="mt-2 text-muted">Mensuel · sans engagement · résiliable à tout moment</p>
      </div>

      {sp.pdf === "1" && !currentPlanId && (
        <p role="status" className="mx-auto mt-6 max-w-2xl rounded-xl border border-dashed border-brand-600/50 bg-cream px-4 py-3 text-center text-sm">
          Le téléchargement de votre CV en PDF est inclus dans tous les abonnements ci-dessous.
        </p>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={plan.id === currentPlanId}
            href={user ? `/paiement?plan=${plan.id}` : `/inscription?suivant=${encodeURIComponent(`/paiement?plan=${plan.id}`)}`}
          />
        ))}
      </div>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-4 text-xl font-bold">Questions fréquentes</h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details key={item.q} className="card group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.q}
                <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
