import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex justify-center bg-cream px-4 py-16">
      <div className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        <p className="text-sm text-muted">Indiquez votre e-mail : nous vous enverrons un lien de réinitialisation.</p>
        <ForgotForm />
        <Link href="/connexion" className="block text-center text-sm text-muted hover:text-ink">← Retour à la connexion</Link>
      </div>
    </div>
  );
}
