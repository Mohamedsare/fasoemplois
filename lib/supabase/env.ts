function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.local.example en .env.local et renseignez vos clés Supabase.`,
    );
  }
  return value;
}

export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = () =>
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * URL publique du site (liens des e-mails, retour OAuth, sitemap, Open Graph).
 * Ordre : NEXT_PUBLIC_SITE_URL, puis le domaine de production fourni par Vercel, puis localhost.
 */
export const siteUrl = () => {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercel ? `https://${vercel}` : "http://localhost:3000")
  ).replace(/\/$/, "");
};
