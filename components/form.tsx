"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/types";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Comme useActionState, mais sans la réinitialisation automatique du formulaire
 * de React 19 : les champs saisis restent en place si le serveur renvoie une erreur.
 */
export function useFormAction(
  action: Action,
  options?: {
    /** Étape côté navigateur avant l'action (ex. envoi direct d'un fichier). Renvoie un message d'erreur ou null. */
    prepare?: (formData: FormData) => Promise<string | null>;
  },
) {
  const prepare = options?.prepare;
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    if (prepare) {
      const error = await prepare(formData);
      if (error) return { error };
    }
    return action(prev, formData);
  }, null);
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Inclut le name/value du bouton cliqué (ex. intent=publish)
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };
  return { state, onSubmit, pending };
}

export function SubmitButton({
  children,
  pendingLabel = "Envoi…",
  className = "btn-primary",
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  /** À fournir avec useFormAction (useFormStatus ne voit pas ces envois). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormAlert({ state }: { state: ActionState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-lg border border-accent-500/30 bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="rounded-lg border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        {state.success}
      </p>
    );
  }
  return null;
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function Field({ label, name, error, hint, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs text-accent-600">
          {error}
        </p>
      )}
    </div>
  );
}
