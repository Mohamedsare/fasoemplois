"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNumber } from "@/lib/format";
import type { Plan } from "@/lib/types";

export function PlanPicker({ plans, jobId }: { plans: Plan[]; jobId: string | null }) {
  const [selected, setSelected] = useState(plans.find((p) => p.is_featured)?.id ?? plans[0]?.id);
  const plan = plans.find((p) => p.id === selected);
  const href = plan ? `/paiement?plan=${plan.id}${jobId ? `&offre=${jobId}` : ""}` : "#";

  return (
    <div className="space-y-3 pb-24 lg:pb-0">
      <fieldset className="space-y-3">
        <legend className="sr-only">Plans</legend>
        {plans.map((p) => (
          <label
            key={p.id}
            className={`card flex cursor-pointer items-center gap-4 p-4 transition-colors ${
              selected === p.id ? "border-2 border-ink" : "hover:border-ink/30"
            }`}
          >
            <input type="radio" name="plan" value={p.id} checked={selected === p.id} onChange={() => setSelected(p.id)} className="size-4 accent-brand-600" />
            <span className="flex-1">
              <span className="flex items-center gap-2 font-semibold">
                {p.name}
                {p.badge && <span className="chip">{p.badge}</span>}
              </span>
              <span className="text-xs text-muted">
                {p.features.slice(0, 2).join(" · ")}
                {p.application_limit ? ` · ${p.application_limit} candidatures / mois` : " · candidatures illimitées"}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-bold">{formatNumber(p.price)}</span>
              <span className="text-xs text-muted">FCFA / mois</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div id="mobile-actionbar" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 lg:static lg:border-0 lg:p-0">
        <Link href={href} className="btn-primary w-full py-3" aria-disabled={!plan}>
          Continuer{plan ? ` · ${formatNumber(plan.price)} FCFA / mois` : ""}
        </Link>
        <p className="mt-2 text-center text-xs text-muted">Paiement mensuel · sans engagement</p>
      </div>
    </div>
  );
}
