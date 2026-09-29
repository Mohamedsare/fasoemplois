import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safePath } from "@/lib/auth";
import { param } from "@/lib/format";
import { AuthTabs } from "@/components/auth-tabs";
import { GoogleButton } from "@/components/google-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage(props: PageProps<"/connexion">) {
  const sp = await props.searchParams;
  const next = safePath(param(sp.suivant));
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="flex justify-center bg-cream px-4 py-16">
      <div className="card w-full max-w-sm space-y-5 p-6 sm:p-8">
        <AuthTabs active="connexion" next={param(sp.suivant) || undefined} />
        <h1 className="text-2xl font-bold">Bon retour</h1>
        {sp.erreur === "lien-invalide" && (
          <p role="alert" className="rounded-lg bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
            Ce lien est invalide ou a expiré. Connectez-vous ou refaites une demande.
          </p>
        )}
        {sp.erreur === "oauth" && (
          <p role="alert" className="rounded-lg bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
            La connexion avec Google n&apos;a pas abouti. Réessayez ou utilisez votre e-mail.
          </p>
        )}
        <GoogleButton next={param(sp.suivant) || null} />
        <LoginForm next={next} />
      </div>
    </div>
  );
}
