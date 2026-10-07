"use client";

import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { resendConfirmation, signUp } from "@/app/actions/auth";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import type { ActionState } from "@/lib/types";

export function SignupForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signUp);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const errors = state?.fieldErrors ?? {};

  if (state?.success) return <CheckEmail email={email} next={next} />;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert state={state} />
      <input type="hidden" name="suivant" value={next} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Field label="Prénom" name="first_name" required error={errors.first_name}>
          <input id="first_name" name="first_name" autoComplete="given-name" className="input" required autoFocus />
        </Field>
        <Field label="Nom" name="last_name" required error={errors.last_name}>
          <input id="last_name" name="last_name" autoComplete="family-name" className="input" required />
        </Field>
      </div>

      <Field label="E-mail" name="email" required error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          className="input"
          required
        />
      </Field>

      <Field label="Mot de passe" name="password" required error={errors.password}>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {!errors.password && (
          <p className={`text-xs ${password.length >= 8 ? "text-brand-700" : "text-muted"}`}>
            {password.length >= 8 ? "✓ Mot de passe valide" : `8 caractères minimum${password ? ` (encore ${8 - password.length})` : ""}`}
          </p>
        )}
      </Field>

      <Field label="Téléphone" name="phone" hint="Facultatif : il apparaîtra sur votre CV.">
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+226 70 00 00 00" className="input" />
      </Field>

      <SubmitButton pending={pending} className="btn-primary h-12 w-full text-base" pendingLabel="Création du compte…">
        Créer mon compte gratuit
      </SubmitButton>
      <p className="text-center text-xs text-muted">
        En créant un compte, vous acceptez les{" "}
        <Link href="/conditions" target="_blank" className="underline">conditions d&apos;utilisation</Link> et la{" "}
        <Link href="/confidentialite" target="_blank" className="underline">politique de confidentialité</Link>.
      </p>
    </form>
  );
}

/** Écran « Vérifiez vos e-mails » : adresse rappelée, raccourci vers la messagerie, renvoi du lien. */
function CheckEmail({ email, next }: { email: string; next: string }) {
  const [state, setState] = useState<ActionState>(null);
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const inbox = domain === "gmail.com"
    ? { href: "https://mail.google.com/mail/u/0/#search/votrecv", label: "Ouvrir Gmail" }
    : /^(outlook|hotmail|live)\./.test(domain)
      ? { href: "https://outlook.live.com/mail/", label: "Ouvrir Outlook" }
      : /^yahoo\./.test(domain)
        ? { href: "https://mail.yahoo.com/", label: "Ouvrir Yahoo Mail" }
        : null;

  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-50 text-brand-700">
        <MailCheck aria-hidden className="size-8" />
      </span>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Vérifiez vos e-mails</h2>
        <p className="text-muted">
          Nous avons envoyé un lien d&apos;activation à <strong className="text-ink">{email}</strong>. Cliquez dessus pour activer
          votre compte : vous arriverez directement sur la création de votre CV.
        </p>
      </div>
      {inbox && (
        <a href={inbox.href} target="_blank" rel="noopener noreferrer" className="btn-primary h-12 w-full text-base">
          {inbox.label}
        </a>
      )}
      <FormAlert state={state} />
      <div className="space-y-1 text-sm text-muted">
        <p>Rien reçu ? Regardez dans les courriers indésirables (spam).</p>
        <button
          type="button"
          disabled={pending || cooldown > 0}
          onClick={() =>
            start(async () => {
              setState(await resendConfirmation(email, next));
              setCooldown(60);
            })
          }
          className="inline-flex items-center gap-1.5 font-semibold text-ink underline disabled:no-underline disabled:opacity-60"
        >
          {pending && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
          {cooldown > 0 ? `Renvoyer l'e-mail (${cooldown} s)` : "Renvoyer l'e-mail"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Mauvaise adresse ?{" "}
        <button type="button" onClick={() => window.location.reload()} className="underline">Recommencer l&apos;inscription</button>
      </p>
    </div>
  );
}
