import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Cv, CvFile } from "@/lib/types";
import { CvForm } from "./cv-form";
import { CvFileForm } from "./cv-file-form";

export const metadata: Metadata = {
  title: "CV",
  description: "Créez votre CV en ligne, téléchargez-le en PDF et joignez-le à vos candidatures.",
};

const STEPS = [
  { title: "Remplissez", text: "Vos expériences, formations et compétences, étape par étape." },
  { title: "Téléchargez", text: "Imprimez ou enregistrez votre CV en PDF en un clic." },
  { title: "Postulez", text: "Votre CV est joint automatiquement à chaque candidature." },
];

export default async function CvPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Créez votre CV en ligne</h1>
          <p className="mt-3 text-muted">
            Un CV clair et professionnel, prêt à être envoyé aux recruteurs du Burkina Faso.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/inscription" className="btn-primary">Créer un compte</Link>
            <Link href="/connexion?suivant=/cv" className="btn-secondary">Connexion</Link>
          </div>
        </div>
        <ol className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h2 className="mt-4 font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-sm text-muted">
          Besoin d&apos;inspiration ? Lisez notre astuce{" "}
          <Link href="/astuces/rediger-un-cv-efficace" className="text-brand-700 underline">
            Rédiger un CV efficace
          </Link>.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: cv }, { data: files }] = await Promise.all([
    supabase.from("cvs").select("*").eq("user_id", user.id).maybeSingle<Cv>(),
    supabase.from("cv_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<CvFile[]>(),
  ]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mon CV</h1>
          <p className="mt-1 text-muted">
            {cv ? `Dernière mise à jour le ${formatDate(cv.updated_at)}.` : "Remplissez votre CV, il sera joint à vos candidatures."}
          </p>
        </div>
        {cv && cv.full_name && (
          <Link href="/cv/apercu" className="btn-secondary">Aperçu et téléchargement PDF</Link>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <CvForm
          cv={cv}
          defaults={{
            full_name: user.profile.full_name,
            email: user.email,
            phone: user.profile.phone ?? "",
            city: user.profile.city ?? "",
          }}
        />
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-semibold">Mes CV en PDF</h2>
            <p className="mt-1 text-sm text-muted">
              Choisissez lequel envoyer à chaque candidature.
            </p>
            <div className="mt-4">
              <CvFileForm files={files ?? []} />
            </div>
          </div>
          <div className="card bg-star-400/10 p-6 text-sm">
            <p className="font-semibold">Astuce</p>
            <p className="mt-1 text-muted">
              Chiffrez vos réalisations et adaptez vos compétences aux offres visées.{" "}
              <Link href="/astuces/rediger-un-cv-efficace" className="text-brand-700 underline">En savoir plus</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
