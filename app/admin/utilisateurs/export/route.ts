import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { sanitizeSearch } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "@/lib/types";

const SEGMENT_LABELS = { abonne: "Abonné", gratuit: "Gratuit", expire: "Expiré" } as const;

/** Export CSV des utilisateurs (mêmes filtres que la liste). */
export async function GET(request: NextRequest) {
  await requireAdmin();
  const q = sanitizeSearch(request.nextUrl.searchParams.get("q") ?? "");
  const segment = request.nextUrl.searchParams.get("segment") ?? "";

  const supabase = await createClient();
  let query = supabase.from("admin_users").select("*").order("created_at", { ascending: false }).limit(20000);
  if (segment === "admin") query = query.eq("is_admin", true);
  else {
    query = query.eq("is_admin", false);
    if (segment in SEGMENT_LABELS) query = query.eq("segment", segment);
  }
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
  const { data } = await query.returns<AdminUserRow[]>();

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(
    `utilisateurs-${date}.csv`,
    ["Nom", "E-mail", "Téléphone", "Ville", "Titre", "Inscription", "CV", "Statut", "Plan", "Échéance"],
    (data ?? []).map((u) => [
      u.full_name,
      u.email,
      u.phone,
      u.city,
      u.headline,
      u.created_at.slice(0, 10),
      u.cv_count,
      SEGMENT_LABELS[u.segment],
      u.plan_name,
      u.subscription_expires_at?.slice(0, 10),
    ]),
  );
}
