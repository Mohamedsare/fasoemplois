import Link from "next/link";
import { formatNumber } from "@/lib/format";
import type { Plan } from "@/lib/types";

export function PlanCard({ plan, href, current }: { plan: Plan; href: string; current?: boolean }) {
  return (
    <div
      className={`card relative flex flex-col gap-4 p-6 ${
        plan.is_featured ? "border-2 border-ink shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className="font-bold">{plan.name}</h3>
        {plan.badge && <span className="chip ml-auto">{plan.badge}</span>}
      </div>
      <p>
        <span className="text-3xl font-bold">{formatNumber(plan.price)}</span>
        <span className="text-sm text-muted"> FCFA / mois</span>
      </p>
      {plan.description && <p className="text-sm text-muted">{plan.description}</p>}
      <ul className="flex-1 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden className="text-brand-600">✓</span>
            {f}
          </li>
        ))}
        <li className="flex gap-2">
          <span aria-hidden className="text-brand-600">✓</span>
          {plan.application_limit ? `${plan.application_limit} candidatures / mois` : "Candidatures illimitées"}
        </li>
      </ul>
      {current ? (
        <span className="btn-secondary w-full cursor-default">✓ Plan actuel</span>
      ) : (
        <Link href={href} className={`${plan.is_featured ? "btn-primary" : "btn-secondary"} w-full`}>
          {plan.cta_label}
        </Link>
      )}
    </div>
  );
}
