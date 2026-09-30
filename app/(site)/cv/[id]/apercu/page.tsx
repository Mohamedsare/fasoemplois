import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { signedPhotoUrl } from "@/lib/cv-photos";
import { CvDocument } from "@/components/cv-document";
import type { Cv } from "@/lib/types";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Aperçu du CV" };

/** Aperçu pleine taille + impression / enregistrement PDF (A4, sans marges ajoutées par le navigateur). */
export default async function CvPrintPage(props: PageProps<"/cv/[id]/apercu">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/cv/${id}/apercu`);

  // La RLS limite l'accès au propriétaire du CV et aux administrateurs
  const supabase = await createClient();
  const { data: cv } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle<Cv>();
  if (!cv) notFound();
  const isOwner = cv.user_id === user.id;
  const photoUrl = await signedPhotoUrl(cv.photo_path);

  return (
    <div className="cv-print-page bg-surface py-8 print:bg-white print:p-0">
      {/* Format de page pour l'impression : A4 sans marges, le CV gère ses propres marges */}
      <style>{`@page { size: A4; margin: 0; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="no-print container-page mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={isOwner ? `/cv/${cv.id}` : "/admin/candidatures"} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {isOwner ? "Modifier ce CV" : "Retour"}
        </Link>
        <div className="flex flex-col items-end gap-1">
          <PrintButton />
          <p className="text-xs text-muted">Dans la fenêtre d&apos;impression, choisissez « Enregistrer au format PDF ».</p>
        </div>
      </div>
      <div className="overflow-x-auto px-4 print:overflow-visible print:p-0">
        <div className="mx-auto w-fit shadow-[0_4px_32px_rgba(0,0,0,0.12)] print:shadow-none">
          <CvDocument cv={cv} photoUrl={photoUrl} />
        </div>
      </div>
    </div>
  );
}
