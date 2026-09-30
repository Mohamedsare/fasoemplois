import { Camera, Copy, Eye, FileText, LayoutTemplate, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAvailablePlans } from "@/lib/queries";
import { signedPhotoUrls } from "@/lib/cv-photos";
import { isAiConfigured } from "@/lib/ai";
import { FREE_CV_LIMIT } from "@/lib/constants";
import { formatDate, param } from "@/lib/format";
import { createCv, deleteCv, duplicateCv } from "@/app/actions/cv";
import { CvPreview } from "@/components/cv-preview";
import { SubmitButton } from "@/components/form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Cv, CvFile } from "@/lib/types";
import { CvFileForm } from "./cv-file-form";

export const metadata: Metadata = {
  title: "CV",
  description: "Créez un CV professionnel guidé par l'IA, avec photo, et téléchargez-le en PDF.",
};

const FEATURES = [
  { icon: Sparkles, title: "Guidé par l'IA", text: "L'assistant rédige votre résumé, reformule vos expériences et suggère vos compétences." },
  { icon: LayoutTemplate, title: "Mise en page soignée", text: "3 modèles au format A4, couleurs au choix, prêts pour les recruteurs." },
  { icon: Camera, title: "Photo de profil", text: "Ajoutez votre photo, recadrée automatiquement." },
  { icon: FileText, title: "PDF en un clic", text: "Téléchargez votre CV et joignez-le à vos candidatures." },
];

export default async function CvPage(props: PageProps<"/cv">) {
  const sp = await props.searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Créez un CV professionnel, guidé par l&apos;IA</h1>
          <p className="mt-3 text-muted">Un CV clair et bien mis en page, prêt à être envoyé aux recruteurs du Burkina Faso.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/inscription?suivant=%2Fcv" className="btn-primary">Créer mon CV gratuitement</Link>
            <Link href="/connexion?suivant=/cv" className="btn-secondary">Connexion</Link>
          </div>
        </div>
        <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="card p-6">
              <f.icon aria-hidden className="size-6 text-brand-600" />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-sm text-muted">1 CV gratuit · jusqu&apos;à 8 CV avec un abonnement.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: cvs }, { data: files }, plans] = await Promise.all([
    supabase.from("cvs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).returns<Cv[]>(),
    supabase.from("cv_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<CvFile[]>(),
    getAvailablePlans(),
  ]);
  const list = cvs ?? [];
  const photos = await signedPhotoUrls(list.map((c) => c.photo_path));

  const limit = user.subscription?.isActive ? user.subscription.plan.cv_limit ?? FREE_CV_LIMIT : FREE_CV_LIMIT;
  const canCreate = list.length < limit;
  // Plan qui permettrait d'en créer davantage
  const upgrade = plans.filter((p) => p.cv_limit > limit).sort((a, b) => a.price - b.price)[0];

  return (
    <div className="container-page space-y-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes CV</h1>
          <p className="mt-1 text-muted">
            {list.length} / {limit} CV utilisé{limit > 1 ? "s" : ""}
            {user.subscription?.isActive ? ` · plan ${user.subscription.plan.name}` : " · sans abonnement"}
          </p>
        </div>
        {canCreate && (
          <form action={createCv}>
            <SubmitButton pendingLabel="Création…"><Plus aria-hidden className="size-4" /> Créer un CV</SubmitButton>
          </form>
        )}
      </div>

      {sp.erreur && (
        <p role="alert" className="rounded-xl bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
          {param(sp.erreur) === "limite" ? "Vous avez atteint le nombre de CV de votre plan." : "Impossible de créer le CV. Réessayez."}
        </p>
      )}

      {!canCreate && upgrade && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand-600/50 bg-cream p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            <strong>Besoin de plus de CV ?</strong> Avec le plan {upgrade.name}, créez jusqu&apos;à {upgrade.cv_limit} CV
            différents (un par type de poste visé).
          </p>
          <Link href="/abonnements" className="btn-primary">Voir les abonnements</Link>
        </div>
      )}

      {list.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((cv) => (
            <li key={cv.id} className="card flex flex-col overflow-hidden">
              <Link href={`/cv/${cv.id}`} className="block bg-surface p-5" aria-label={`Modifier ${cv.title}`}>
                <div className="pointer-events-none">
                  <CvPreview cv={cv} photoUrl={photos.get(cv.photo_path ?? "") ?? null} />
                </div>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="font-semibold">{cv.title}</p>
                  <p className="text-xs text-muted">Modifié le {formatDate(cv.updated_at)}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href={`/cv/${cv.id}`} className="btn-primary px-3 py-1.5 text-xs"><PencilLine aria-hidden className="size-3.5" /> Modifier</Link>
                  <Link href={`/cv/${cv.id}/apercu`} className="btn-secondary px-3 py-1.5 text-xs"><Eye aria-hidden className="size-3.5" /> PDF</Link>
                  {canCreate && (
                    <form action={duplicateCv.bind(null, cv.id)}>
                      <SubmitButton className="btn-secondary px-3 py-1.5 text-xs" pendingLabel="…"><Copy aria-hidden className="size-3.5" /> Dupliquer</SubmitButton>
                    </form>
                  )}
                  <form action={deleteCv.bind(null, cv.id)} className="ml-auto">
                    <ConfirmSubmit message={`Supprimer « ${cv.title} » ? Cette action est définitive.`} className="rounded-full p-2 text-accent-600 hover:bg-accent-500/5">
                      <Trash2 aria-hidden className="size-4" /><span className="sr-only">Supprimer</span>
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <Sparkles aria-hidden className="size-10 text-violet-600" />
          <div>
            <p className="text-lg font-semibold">Créez votre premier CV</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              {isAiConfigured()
                ? "Décrivez votre parcours en quelques phrases : l'assistant IA remplit votre CV, vous n'avez plus qu'à relire."
                : "Remplissez votre CV étape par étape et téléchargez-le en PDF."}
            </p>
          </div>
          <form action={createCv}>
            <SubmitButton pendingLabel="Création…"><Plus aria-hidden className="size-4" /> Créer mon CV</SubmitButton>
          </form>
        </div>
      )}

      <section className="grid gap-6 border-t border-line pt-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-xl font-bold">CV PDF importés</h2>
          <p className="mt-1 text-sm text-muted">
            Vous avez déjà un CV au format PDF ? Ajoutez-le pour le joindre directement à vos candidatures.
          </p>
        </div>
        <div className="card p-5">
          <CvFileForm files={files ?? []} />
        </div>
      </section>
    </div>
  );
}
