import type { Metadata } from "next";
import { Geist, Geist_Mono, Mr_Dafoe } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/supabase/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Police manuscrite du nom du site dans le logo
const mrDafoe = Mr_Dafoe({
  variable: "--font-mr-dafoe",
  weight: "400",
  subsets: ["latin"],
});

const description =
  "Créez un CV professionnel en quelques minutes avec l'IA : modèles soignés, rédaction assistée, téléchargement PDF.";

export const metadata: Metadata = {
  // Base des URL absolues (Open Graph, sitemap) : le domaine de production sur Vercel
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "fr_FR",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${mrDafoe.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
