"use client";

import { useFormStatus } from "react-dom";

/** Bouton d'envoi qui demande confirmation (actions destructives). */
export function ConfirmSubmit({
  children,
  message,
  className = "btn-danger",
  form,
  name,
  value,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  form?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      form={form}
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
