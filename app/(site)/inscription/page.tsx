import { FileUp, Mic, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safePath } from "@/lib/auth";
import { param } from "@/lib/format";
import { Logo } from "@/components/logo";
import { GoogleButton } from "@/components/google-button";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

const STEPS = [
  { icon: Sparkles, title: "Créez votre compte", text: "30 secondes, ou un clic avec Google." },
  { icon: FileUp, title: "Importez votre ancien CV", text: "PDF, Word ou simple photo d'un CV papier." },
  { icon: Mic, title: "Ou racontez votre parcours", text: "À voix haute ou en quelques lignes : l'IA rédige tout." },
];

export default async function SignupPage(props: PageProps<"/inscription">) {
  const sp = await props.searchParams;
  const rawNext = param(sp.suivant);
  if (await getCurrentUser()) redirect(safePath(rawNext));

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-cream p-10 lg:flex">
        <Logo />
        <div className="max-w-md space-y-8">
          <p className="text-3xl leading-tight font-bold">Votre CV professionnel, rédigé par l&apos;IA, prêt en quelques minutes.</p>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
                  <s.icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{i + 1}. {s.title}</span>
                  <span className="block text-sm text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm text-muted">Gratuit · Sans carte bancaire · Vos données restent privées</p>
      </div>

      <div className="flex items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-md space-y-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Votre CV en quelques minutes</p>
            <h1 className="mt-1 text-[1.75rem] leading-tight font-bold sm:text-3xl">Créez votre compte gratuit</h1>
            <p className="mt-1.5 text-sm text-muted">
              Ensuite, importez votre ancien CV ou racontez votre parcours : l&apos;IA rédige votre nouveau CV.
            </p>
          </div>
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
