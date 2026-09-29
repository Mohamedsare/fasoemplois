import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Redirige vers une URL signée (60 s) d'un CV PDF. Droits vérifiés par la RLS :
// le candidat propriétaire ou un administrateur.
export async function GET(_request: NextRequest, ctx: RouteContext<"/cv/fichier/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: file } = await supabase.from("cv_files").select("path").eq("id", id).maybeSingle<{ path: string }>();
  if (!file) return NextResponse.json({ error: "CV introuvable" }, { status: 404 });

  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(file.path, 60);
  if (error || !data) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  return NextResponse.redirect(data.signedUrl);
}
