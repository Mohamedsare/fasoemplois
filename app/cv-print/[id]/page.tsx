import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPrintToken } from "@/lib/pdf";
import { CvDocument } from "@/components/cv-document";
import type { Cv } from "@/lib/types";

export const metadata: Metadata = { title: "CV", robots: { index: false, follow: false } };

/**
 * Page utilisée uniquement par le générateur de PDF (Chromium côté serveur).
 * Accès par jeton signé et temporaire, jamais par la session de l'utilisateur.
 */
export default async function CvPrintOnlyPage(props: PageProps<"/cv-print/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !verifyPrintToken(id, token)) notFound();

  const admin = createAdminClient();
  const { data: cv } = await admin.from("cvs").select("*").eq("id", id).maybeSingle<Cv>();
  if (!cv) notFound();

  let photoUrl: string | null = null;
  if (cv.photo_path) {
    const { data } = await admin.storage.from("photos").createSignedUrl(cv.photo_path, 300);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <style>{`@page { size: A4; margin: 0; } html, body { margin: 0; background: #fff; }`}</style>
      <CvDocument cv={cv} photoUrl={photoUrl} />
    </>
  );
}
