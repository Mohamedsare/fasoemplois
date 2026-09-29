"use client";

import { updatePassword } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";

export function ResetForm() {
  const { state, onSubmit, pending } = useFormAction(updatePassword);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert state={state} />
      <Field label="Nouveau mot de passe" name="password" required error={errors.password} hint="8 caractères minimum">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </Field>
      <Field label="Confirmation" name="password_confirm" required error={errors.password_confirm}>
        <input id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" className="input" required />
      </Field>
      <SubmitButton pending={pending} className="btn-dark w-full py-2.5" pendingLabel="Enregistrement…">
        Réinitialiser
      </SubmitButton>
    </form>
  );
}
