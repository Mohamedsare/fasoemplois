import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Import d'un ancien CV (PDF, Word, photos : 4 Mo max) et dictées vocales, envoyés aux Server Actions
      bodySizeLimit: "5mb",
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
