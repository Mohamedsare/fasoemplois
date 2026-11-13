import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canDownloadPdf, getCurrentUser } from "@/lib/auth";
import { buildCvDocx } from "@/lib/cv-docx";
import { pdfFileName } from "@/lib/pdf";
import type { Cv } from "@/lib/types";

/** CV au format Word (.docx), modifiable. Mêmes droits que le PDF (abonnés et administrateurs). */
export async function GET(_request: Request, ctx: RouteContext<"/cv/[id]/word">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "CV introuvable" }, { status: 404 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour télécharger ce CV." }, { status: 401 });
  if (!canDownloadPdf(user)) {
    return NextResponse.json({ error: "Le téléchargement Word est réservé aux abonnés." }, { status: 402 });
  }

  const supabase = await createClient();
  // La RLS ne renvoie le CV qu'à son propriétaire ou à un administrateur
  const { data: cv } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle<Cv>();
  if (!cv) return NextResponse.json({ error: "CV introuvable" }, { status: 404 });

  try {
    let photo: Buffer | null = null;
    if (cv.photo_path) {
      const { data } = await supabase.storage.from("photos").download(cv.photo_path);
      if (data) photo = Buffer.from(await data.arrayBuffer());
    }
    const docx = await buildCvDocx(cv, photo);
    const filename = pdfFileName(cv.full_name, cv.title, "docx");
    return new NextResponse(new Uint8Array(docx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[cv/word] génération impossible :", error);
    return NextResponse.json({ error: "La génération du document Word a échoué. Réessayez." }, { status: 500 });
  }
}
