import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos d'entreprise (1 Mo) ; les CV PDF sont envoyés directement à Supabase Storage
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
