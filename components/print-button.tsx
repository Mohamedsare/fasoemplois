"use client";

import { Printer } from "lucide-react";

/** Impression papier (secondaire : le téléchargement PDF passe par DownloadPdfButton). */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary shrink-0 px-3" title="Imprimer">
      <Printer aria-hidden className="size-4" />
      <span className="sr-only sm:not-sr-only">Imprimer</span>
    </button>
  );
}
