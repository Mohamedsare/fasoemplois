"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

/** Mobile : les filtres s'ouvrent dans une feuille en bas d'écran. */
export function FilterSheet({ count, total, children }: { count: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary" aria-haspopup="dialog">
        <SlidersHorizontal aria-hidden className="size-4" /> Filtres{count ? ` (${count})` : ""}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Filtres" className="fixed inset-0 z-50">
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl"
            // Le formulaire navigue à l'envoi : on referme la feuille
            onSubmit={() => setOpen(false)}
          >
            <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            {children}
            <p className="mt-3 text-center text-xs text-muted">{total} offre{total > 1 ? "s" : ""} actuellement</p>
          </div>
        </div>
      )}
    </>
  );
}
