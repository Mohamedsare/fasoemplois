"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// Pixel Meta (Facebook) : identifiant public, surchargeable par variable d'environnement
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1589772549303378";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Dernière page comptée : survit aux remontages (double effet de React en dev, changement de layout)
let lastTrackedPath: string | null = null;

/**
 * Le script de Meta n'envoie PageView qu'au chargement complet de la page ; les navigations
 * côté client (next/link) ne rechargent pas la page, on envoie donc PageView à chaque changement d'URL.
 */
function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastTrackedPath === null) {
      // Premier affichage : PageView est déjà envoyé par le script d'initialisation
      lastTrackedPath = pathname;
      return;
    }
    if (lastTrackedPath === pathname) return;
    lastTrackedPath = pathname;
    window.fbq?.("track", "PageView");
  }, [pathname]);
  return null;
}

export function MetaPixel() {
  // Uniquement en production : pas de trafic de développement dans les statistiques Meta
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <PageViewTracker />
    </>
  );
}
