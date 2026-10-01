import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/supabase/env";
import { CITIES_BF, cityPath } from "@/lib/seo-burkina";

// Régénéré au plus toutes les heures
export const revalidate = 3600;

const STATIC_PAGES = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/cv", priority: 0.9, changeFrequency: "monthly" },
  { path: "/modeles", priority: 0.9, changeFrequency: "monthly" },
  // Guides SEO « CV au Burkina Faso » (hors navigation)
  { path: "/cv-burkina-faso", priority: 0.9, changeFrequency: "monthly" },
  { path: "/modele-cv-burkina-faso", priority: 0.8, changeFrequency: "monthly" },
  { path: "/exemple-cv-burkina-faso", priority: 0.8, changeFrequency: "monthly" },
  { path: "/abonnements", priority: 0.8, changeFrequency: "monthly" },
  { path: "/astuces", priority: 0.6, changeFrequency: "weekly" },
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

  // Une page par ville du Burkina Faso
  for (const c of CITIES_BF) {
    entries.push({ url: `${base}${cityPath(c)}`, changeFrequency: "monthly", priority: c.major ? 0.8 : 0.6 });
  }

  try {
    // Client anonyme sans cookies : la RLS ne renvoie que les contenus publics
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data: tips } = await supabase.from("tips").select("slug, published_at").eq("is_published", true).limit(1000);
    for (const t of tips ?? []) {
      entries.push({ url: `${base}/astuces/${t.slug}`, lastModified: t.published_at, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch {
    // Base injoignable (ex. build sans clés) : sitemap limité aux pages fixes
  }
  return entries;
}
