import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos d'entreprise (1 Mo) ; les CV PDF sont envoyés directement à Supabase Storage
      bodySizeLimit: "2mb",
    },
  },
  // Génération des CV en PDF : Chromium et Puppeteer utilisent des fonctionnalités Node natives
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Le binaire Chromium (compressé) doit être embarqué dans la fonction Vercel de la route PDF
  outputFileTracingIncludes: {
    "/cv/\\[id\\]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default nextConfig;
