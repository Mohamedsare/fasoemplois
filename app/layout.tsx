import type { Metadata } from "next";
import { Geist, Geist_Mono, Mr_Dafoe } from "next/font/google";
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
  "Offres d'emploi, stages et conseils de carrière au Burkina Faso. Créez votre CV et postulez en ligne.";

export const metadata: Metadata = {
  // Base des URL absolues (Open Graph, sitemap) : le domaine de production sur Vercel
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Faso Emplois — L'emploi au Burkina Faso",
    template: "%s · Faso Emplois",
  },
  description,
  applicationName: "Faso Emplois",
  openGraph: {
    type: "website",
    siteName: "Faso Emplois",
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
