"use client";

import Link from "next/link";
import { useState } from "react";
import { startCheckout } from "@/app/actions/payments";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { formatNumber } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "mobile_money", label: "Mobile Money", hint: "Orange Money, Moov Money…" },
  { value: "card", label: "Carte bancaire", hint: "Visa, Mastercard" },
  { value: "other", label: "Autre fournisseur", hint: "Selon disponibilité" },
];

type Props = { planId: string; amount: number; returnTo: string; defaultPhone: string };

export function CheckoutForm({ planId, amount, returnTo, defaultPhone }: Props) {
  const { state, onSubmit, pending } = useFormAction(startCheckout);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="retour" value={returnTo} />
      <h2 className="text-lg font-bold">Méthode de paiement</h2>
      <FormAlert state={state} />

      <fieldset className="space-y-2">
        <legend className="sr-only">Méthode de paiement</legend>
        {METHODS.map((m) => (
          <label
            key={m.value}
            className={`card flex cursor-pointer items-center gap-3 p-4 ${method === m.value ? "border-2 border-ink" : ""}`}
          >
            <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="size-4 accent-brand-600" />
            <span className="flex-1 font-semibold">{m.label}</span>
            <span className="text-xs text-muted">{m.hint}</span>
          </label>
        ))}
      </fieldset>
      {state?.fieldErrors?.method && <p className="text-xs text-accent-600">{state.fieldErrors.method}</p>}

      {method === "mobile_money" && (
        <Field label="Numéro de téléphone" name="phone" required error={state?.fieldErrors?.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaultPhone} placeholder="+226 70 00 00 00" className="input" />
        </Field>
      )}

      <SubmitButton pending={pending} className="btn-primary w-full py-3" pendingLabel="Initialisation…">
        Payer {formatNumber(amount)} FCFA
      </SubmitButton>
      <p className="text-xs text-muted">
        En continuant, vous acceptez la{" "}
        <Link href="/politique-abonnement" target="_blank" className="underline">politique d&apos;abonnement</Link>.
      </p>
    </form>
  );
}
