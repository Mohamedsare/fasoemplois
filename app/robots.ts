import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages privées ou sans intérêt pour les moteurs de recherche
      disallow: ["/admin", "/espace", "/paiement", "/bienvenue", "/auth", "/cv/", "/cv-print", "/reinitialisation"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
