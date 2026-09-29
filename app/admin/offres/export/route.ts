import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { displayStatus, DISPLAY_STATUS } from "@/lib/job-status";
import type { Job } from "@/lib/types";

type Row = Job & { company: { name: string } | null; category: { name: string } | null; applications: { count: number }[] };

function csvCell(value: unknown) {
  const s = String(value ?? "");
  // Neutralise les formules (injection CSV dans Excel)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: me } = await supabase.auth.getUser();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!me.user || !isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  let query = supabase
    .from("jobs")
    .select("*, company:companies(name), category:categories(name), applications(count)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (sp.get("q")) query = query.ilike("title", `%${sp.get("q")!.replace(/[%,()*\\]/g, " ")}%`);
  if (sp.get("categorie")) query = query.eq("category_id", sp.get("categorie")!);
  if (sp.get("entreprise")) query = query.eq("company_id", sp.get("entreprise")!);
  const { data } = await query.returns<Row[]>();

  const header = ["Titre", "Entreprise", "Catégorie", "Lieu", "Contrat", "Publication", "Limite", "Candidatures", "Statut"];
  const lines = (data ?? []).map((j) =>
    [
      j.title,
      j.company?.name,
      j.category?.name,
      j.city,
      j.contract_type,
      j.published_at?.slice(0, 10),
      j.deadline,
      j.applications[0]?.count ?? 0,
      DISPLAY_STATUS[displayStatus(j)].label,
    ]
      .map(csvCell)
      .join(";"),
  );
  // BOM pour qu'Excel lise correctement les accents
  const body = "﻿" + [header.map(csvCell).join(";"), ...lines].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="offres-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
