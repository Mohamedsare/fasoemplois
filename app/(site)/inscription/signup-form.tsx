"use client";

import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";

export function SignupForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signUp);
  const errors = state?.fieldErrors ?? {};

  if (state?.success) return <FormAlert state={state} />;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert state={state} />
      <input type="hidden" name="suivant" value={next} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" name="last_name" required error={errors.last_name}>
          <input id="last_name" name="last_name" autoComplete="family-name" className="input" required />
        </Field>
        <Field label="Prénom" name="first_name" required error={errors.first_name}>
          <input id="first_name" name="first_name" autoComplete="given-name" className="input" required />
        </Field>
      </div>

      <Field label="E-mail" name="email" required error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </Field>
      <Field label="Téléphone" name="phone" hint="Facultatif — utile pour le paiement Mobile Money.">
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+226 …" className="input" />
      </Field>
      <Field label="Mot de passe" name="password" required error={errors.password} hint="8 caractères minimum">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </Field>
      <Field label="Confirmation" name="password_confirm" required error={errors.password_confirm}>
        <input id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" className="input" required />
      </Field>

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-brand-600" />
          <span>
            J&apos;accepte les{" "}
            <Link href="/conditions" target="_blank" className="underline">conditions d&apos;utilisation</Link> et la{" "}
            <Link href="/confidentialite" target="_blank" className="underline">politique de confidentialité</Link>
          </span>
        </label>
        {errors.terms && <p className="mt-1 text-xs text-accent-600">{errors.terms}</p>}
      </div>

      <SubmitButton pending={pending} className="btn-primary w-full py-2.5" pendingLabel="Création du compte…">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}
