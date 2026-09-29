"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // partage annulé
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className="btn-secondary">
      {copied ? <>Lien copié <Check aria-hidden className="size-4" /></> : <><Share2 aria-hidden className="size-4" /> Partager</>}
    </button>
  );
}
