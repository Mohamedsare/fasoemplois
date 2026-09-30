import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canDownloadPdf, getCurrentUser } from "@/lib/auth";
import { createPrintToken, launchBrowser, pdfFileName } from "@/lib/pdf";

// Démarrage de Chromium + rendu : quelques secondes
export const maxDuration = 60;

/** Génère le vrai fichier PDF (A4, texte sélectionnable) et le renvoie en téléchargement. */
export async function GET(request: NextRequest, ctx: RouteContext<"/cv/[id]/pdf">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "CV introuvable" }, { status: 404 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour télécharger ce CV." }, { status: 401 });
  if (!canDownloadPdf(user)) {
    return NextResponse.json({ error: "Le téléchargement PDF est réservé aux abonnés." }, { status: 402 });
  }

  const supabase = await createClient();

  // La RLS ne renvoie le CV qu'à son propriétaire ou à un administrateur
  const { data: cv } = await supabase
    .from("cvs")
    .select("id, full_name, title")
    .eq("id", id)
    .maybeSingle<{ id: string; full_name: string; title: string }>();
  if (!cv) return NextResponse.json({ error: "CV introuvable" }, { status: 404 });

  const target = `${request.nextUrl.origin}/cv-print/${cv.id}?token=${encodeURIComponent(createPrintToken(cv.id))}`;

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(target, { waitUntil: "networkidle0", timeout: 30_000 });
    // Polices et photo chargées avant l'impression
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });

    const filename = pdfFileName(cv.full_name, cv.title);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[cv/pdf] génération impossible :", error);
    return NextResponse.json({ error: "La génération du PDF a échoué. Réessayez." }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
