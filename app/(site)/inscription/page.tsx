import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safePath } from "@/lib/auth";
import { param } from "@/lib/format";
import { Logo } from "@/components/logo";
import { GoogleButton } from "@/components/google-button";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignupPage(props: PageProps<"/inscription">) {
  const sp = await props.searchParams;
  const rawNext = param(sp.suivant);
  if (await getCurrentUser()) redirect(safePath(rawNext));

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-cream p-10 lg:flex">
        <Logo />
        <div
          aria-hidden
          className="my-10 flex-1 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,var(--color-brand-100),transparent_60%),radial-gradient(circle_at_70%_70%,rgb(252_209_22/0.35),transparent_55%)]"
        />
        <p className="max-w-md text-2xl font-bold">Votre CV professionnel, rédigé avec l&apos;IA, prêt en quelques minutes.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5">
          <h1 className="text-3xl font-bold">Créer mon compte</h1>
          <GoogleButton next={rawNext ? safePath(rawNext) : null} />
          <SignupForm next={rawNext ? safePath(rawNext) : ""} />
          <p className="text-center text-sm text-muted">
            Vous avez déjà un compte ?{" "}
            <Link
              href={rawNext ? `/connexion?suivant=${encodeURIComponent(rawNext)}` : "/connexion"}
              className="font-semibold text-ink underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
