import { CornerDownLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, safePath } from "@/lib/auth";
import { param } from "@/lib/format";
import { Logo } from "@/components/logo";
import { GoogleButton } from "@/components/google-button";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

/** Récupère le titre de l'offre visée pour le rappel « Après inscription : retour à … ». */
async function targetJobTitle(next: string) {
  const id = next.match(/[?&]offre=([0-9a-f-]{36})/i)?.[1] ?? next.match(/^\/offres\/([0-9a-f-]{36})/i)?.[1];
  if (!id) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("jobs").select("title").eq("id", id).maybeSingle<{ title: string }>();
  return data?.title ?? null;
}

export default async function SignupPage(props: PageProps<"/inscription">) {
  const sp = await props.searchParams;
  const rawNext = param(sp.suivant);
  if (await getCurrentUser()) redirect(safePath(rawNext));
  const jobTitle = rawNext ? await targetJobTitle(rawNext) : null;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-cream p-10 lg:flex">
        <Logo />
        <div
          aria-hidden
          className="my-10 flex-1 rounded-3xl bg-[radial-gradient(circle_at_30%_30%,var(--color-brand-100),transparent_60%),radial-gradient(circle_at_70%_70%,rgb(252_209_22/0.35),transparent_55%)]"
        />
        <p className="max-w-md text-2xl font-bold">Votre prochaine étape professionnelle commence ici.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5">
          {jobTitle && (
            <p className="rounded-xl border border-dashed border-ink/25 px-4 py-2 text-xs">
              <CornerDownLeft aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />Après inscription : retour à « {jobTitle} »
            </p>
          )}
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
