"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signIn);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert state={state} />
      <input type="hidden" name="suivant" value={next} />
      <Field label="E-mail" name="email" required>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </Field>
      <Field label="Mot de passe" name="password" required>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="input pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 px-3 text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
      </Field>
      <div className="flex items-center justify-between text-sm">
        {/* Les sessions Supabase sont persistantes : la case reste indicative */}
        <label className="flex items-center gap-2">
          <input type="checkbox" name="remember" defaultChecked className="size-4 accent-brand-600" />
          Se souvenir de moi
        </label>
        <Link href="/mot-de-passe-oublie" className="text-muted underline hover:text-ink">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton pending={pending} className="btn-primary w-full py-2.5" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
    </form>
  );
}
