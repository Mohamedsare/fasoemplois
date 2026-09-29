import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { PlanCard } from "@/components/plan-card";

export const metadata: Metadata = {
  title: "Abonnements",
  description: "Débloquez les offres d'emploi complètes et postulez en ligne. Mensuel, sans engagement.",
};

const FAQ = [
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
    a: "Mobile Money et carte bancaire. Aucun montant n'est débité si le paiement échoue.",
  },
  {
    q: "Que se passe-t-il à l'expiration ?",
    a: "Les offres complètes redeviennent verrouillées, mais votre profil, votre CV, vos favoris et vos candidatures sont conservés.",
  },
];

export default async function PricingPage() {
  const [plans, user] = await Promise.all([getAvailablePlans(), getCurrentUser()]);
  const currentPlanId = user?.subscription?.isActive ? user.subscription.plan_id : null;

  return (
    <div className="container-page py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choisissez votre abonnement</h1>
        <p className="mt-2 text-muted">Mensuel · sans engagement · résiliable à tout moment</p>
      </div>

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
