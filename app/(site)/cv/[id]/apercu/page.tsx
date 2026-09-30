import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canDownloadPdf, requireUser } from "@/lib/auth";
import { signedPhotoUrl } from "@/lib/cv-photos";
import { CvDocument } from "@/components/cv-document";
import type { Cv } from "@/lib/types";
import { PrintButton } from "@/components/print-button";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { CvPreview } from "@/components/cv-preview";
import { PreviewWatermark } from "@/components/preview-watermark";

export const metadata: Metadata = { title: "Aperçu du CV" };

/** Aperçu pleine taille + téléchargement PDF / impression (réservés aux abonnés). */
export default async function CvPrintPage(props: PageProps<"/cv/[id]/apercu">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/cv/${id}/apercu`);

  // La RLS limite l'accès au propriétaire du CV et aux administrateurs
  const supabase = await createClient();
  const { data: cv } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle<Cv>();
  if (!cv) notFound();
  const isOwner = cv.user_id === user.id;
  const canDownload = canDownloadPdf(user);
  const photoUrl = await signedPhotoUrl(cv.photo_path);

  return (
    <div className="cv-print-page bg-surface py-8 print:bg-white print:p-0">
      {/* Format de page pour l'impression : A4 sans marges, le CV gère ses propres marges */}
      <style>{`@page { size: A4; margin: 0; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="no-print container-page mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={isOwner ? `/cv/${cv.id}` : `/admin/utilisateurs/${cv.user_id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> {isOwner ? "Modifier ce CV" : "Retour"}
        </Link>
        <div className="flex items-center gap-2">
          <DownloadPdfButton cvId={cv.id} locked={!canDownload} className="btn-primary w-full py-3 sm:w-auto sm:py-2" />
          {canDownload && <PrintButton />}
        </div>
      </div>

      {!canDownload && (
        <p className="no-print container-page mb-6">
          <span className="block rounded-xl border border-dashed border-brand-600/50 bg-cream px-4 py-3 text-sm">
            Ceci est un aperçu. <strong>Abonnez-vous</strong> pour télécharger votre CV en PDF, sans filigrane, prêt à
            être envoyé.
          </span>
        </p>
      )}

      {/* Mobile : aperçu ajusté à la largeur de l'écran */}
      <div className="container-page print:hidden md:hidden">
        <div className="relative">
          <CvPreview cv={cv} photoUrl={photoUrl} />
          {!canDownload && <PreviewWatermark />}
        </div>
      </div>

      {/* Écran large et impression : taille réelle A4 */}
      <div className={`hidden px-4 md:block print:p-0 ${canDownload ? "print:block" : "print:hidden"}`}>
        <div className="relative mx-auto w-fit shadow-[0_4px_32px_rgba(0,0,0,0.12)] print:shadow-none">
          <CvDocument cv={cv} photoUrl={photoUrl} />
          {!canDownload && <PreviewWatermark />}
        </div>
      </div>

      {!canDownload && (
        <p className="hidden p-10 text-center print:block">
          L&apos;impression et le téléchargement du CV sont réservés aux abonnés.
        </p>
      )}
    </div>
  );
}
