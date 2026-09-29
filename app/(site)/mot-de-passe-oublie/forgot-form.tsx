"use client";

import { requestPasswordReset } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";

export function ForgotForm() {
  const { state, onSubmit, pending } = useFormAction(requestPasswordReset);
  if (state?.success) return <FormAlert state={state} />;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert state={state} />
      <Field label="E-mail" name="email" required error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </Field>
      <SubmitButton pending={pending} className="btn-dark w-full py-2.5" pendingLabel="Envoi…">
        Envoyer le lien
      </SubmitButton>
    </form>
  );
}
