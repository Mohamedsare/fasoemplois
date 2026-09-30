"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { startCheckout } from "@/app/actions/payments";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { ORANGE_MONEY } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

type Props = {
  planId: string;
  amount: number;
  returnTo: string;
  defaultPhone: string;
  /** "orange_money" : dépôt manuel vérifié par l'admin ; "simulation" : paiement fictif (développement). */
  mode: "orange_money" | "simulation";
};

export function CheckoutForm(props: Props) {
  return props.mode === "orange_money" ? <OrangeMoneyForm {...props} /> : <SimulationForm {...props} />;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value.replace(/\s/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium hover:bg-surface"
      aria-label={label}
    >
      {copied ? <Check aria-hidden className="size-3.5 text-brand-600" /> : <Copy aria-hidden className="size-3.5" />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

function OrangeMoneyForm({ planId, amount, returnTo, defaultPhone }: Props) {
  const { state, onSubmit, pending } = useFormAction(startCheckout);
  const e = state?.fieldErrors ?? {};

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Paiement par Orange Money</h2>

      {/* Étape 1 : le dépôt */}
      <section className="space-y-3 rounded-2xl border-2 border-[#ff7900] bg-[#ff7900]/5 p-5" aria-labelledby="om-step1">
        <p id="om-step1" className="text-sm font-semibold">1. Envoyez le montant par Orange Money</p>
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="w-28 text-muted">Montant exact</dt>
            <dd className="text-lg font-bold">{formatNumber(amount)} FCFA</dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="w-28 text-muted">Numéro</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider">{ORANGE_MONEY.number}</span>
              <CopyButton value={ORANGE_MONEY.number} label="Copier le numéro Orange Money" />
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dt className="w-28 text-muted">Bénéficiaire</dt>
            <dd className="font-semibold">{ORANGE_MONEY.holder}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted">
          Composez <strong>{ORANGE_MONEY.ussd}</strong> sur votre téléphone (ou utilisez l&apos;application Orange Money),
          choisissez le transfert d&apos;argent et vérifiez que le nom affiché est bien <strong>{ORANGE_MONEY.holder}</strong> avant de valider.
          Vous recevrez ensuite un SMS de confirmation contenant l&apos;<strong>ID de la transaction</strong>.
        </p>
      </section>

      {/* Étape 2 : la déclaration */}
      <form onSubmit={onSubmit} className="space-y-4" aria-labelledby="om-step2">
        <p id="om-step2" className="text-sm font-semibold">2. Saisissez les informations du dépôt</p>
        <input type="hidden" name="plan_id" value={planId} />
        <input type="hidden" name="retour" value={returnTo} />
        <FormAlert state={state} />

        <Field label="Numéro Orange utilisé pour le dépôt" name="phone" required error={e.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={defaultPhone} placeholder="07 00 00 00" className="input" />
        </Field>
        <Field
          label="ID de la transaction"
          name="transaction_id"
          required
          error={e.transaction_id}
          hint="Recopiez l'identifiant indiqué dans le SMS de confirmation Orange Money."
        >
          <input id="transaction_id" name="transaction_id" autoComplete="off" spellCheck={false} placeholder="Ex. PP251001.1234.A12345" className="input font-mono uppercase" />
        </Field>
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="depot" className="mt-0.5 size-4 accent-brand-600" />
            <span>J&apos;ai envoyé {formatNumber(amount)} FCFA au {ORANGE_MONEY.number} ({ORANGE_MONEY.holder}).</span>
          </label>
          {e.depot && <p className="mt-1 text-xs text-accent-600">{e.depot}</p>}
        </div>

        <SubmitButton pending={pending} className="btn-primary w-full py-3" pendingLabel="Envoi…">
          Envoyer pour vérification
        </SubmitButton>
        <p className="text-xs text-muted">
          Votre abonnement est activé dès que notre équipe a vérifié le dépôt. En continuant, vous acceptez la{" "}
          <Link href="/politique-abonnement" target="_blank" className="underline">politique d&apos;abonnement</Link>.
        </p>
      </form>
    </div>
  );
}

const SIMULATION_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Carte bancaire" },
];

function SimulationForm({ planId, amount, returnTo, defaultPhone }: Props) {
  const { state, onSubmit, pending } = useFormAction(startCheckout);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="retour" value={returnTo} />
      <h2 className="text-lg font-bold">Méthode de paiement (test)</h2>
      <FormAlert state={state} />
      <fieldset className="space-y-2">
        <legend className="sr-only">Méthode de paiement</legend>
        {SIMULATION_METHODS.map((m) => (
          <label key={m.value} className={`card flex cursor-pointer items-center gap-3 p-4 ${method === m.value ? "border-2 border-ink" : ""}`}>
            <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="size-4 accent-brand-600" />
            <span className="font-semibold">{m.label}</span>
          </label>
        ))}
      </fieldset>
      {method === "mobile_money" && (
        <Field label="Numéro de téléphone" name="phone" required error={state?.fieldErrors?.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={defaultPhone} placeholder="+226 70 00 00 00" className="input" />
        </Field>
      )}
      <SubmitButton pending={pending} className="btn-primary w-full py-3" pendingLabel="Initialisation…">
        Payer {formatNumber(amount)} FCFA
      </SubmitButton>
    </form>
  );
}
