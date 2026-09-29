import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/supabase/env";

// Régénéré au plus toutes les heures
export const revalidate = 3600;

const STATIC_PAGES = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/offres", priority: 0.9, changeFrequency: "hourly" },
  { path: "/abonnements", priority: 0.7, changeFrequency: "monthly" },
  { path: "/astuces", priority: 0.6, changeFrequency: "weekly" },
  { path: "/cv", priority: 0.6, changeFrequency: "monthly" },
  { path: "/inscription", priority: 0.5, changeFrequency: "yearly" },
  { path: "/connexion", priority: 0.3, changeFrequency: "yearly" },
  { path: "/conditions", priority: 0.2, changeFrequency: "yearly" },
  { path: "/politique-abonnement", priority: 0.2, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${base}${p.path}`,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    // Client anonyme sans cookies : la RLS ne renvoie que les contenus publics
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const [{ data: jobs }, { data: tips }] = await Promise.all([
      supabase.from("jobs").select("id, updated_at").order("published_at", { ascending: false }).limit(5000),
      supabase.from("tips").select("slug, published_at").eq("is_published", true).limit(1000),
    ]);
    for (const j of jobs ?? []) {
      entries.push({ url: `${base}/offres/${j.id}`, lastModified: j.updated_at, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const t of tips ?? []) {
      entries.push({ url: `${base}/astuces/${t.slug}`, lastModified: t.published_at, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch {
    // Base injoignable (ex. build sans clés) : sitemap limité aux pages fixes
  }
  return entries;
}
