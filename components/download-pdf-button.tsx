"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

/** Télécharge le CV en vrai fichier PDF (généré côté serveur). */
export function DownloadPdfButton({
  cvId,
  className = "btn-primary",
  label = "Télécharger en PDF",
}: {
  cvId: string;
  className?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/cv/${cvId}/pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "La génération du PDF a échoué. Réessayez.");
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "CV.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "La génération du PDF a échoué.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-1">
      <button type="button" onClick={download} disabled={pending} className={className} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Download aria-hidden className="size-4" />}
        {pending ? "Génération du PDF…" : label}
      </button>
      {error && <span role="alert" className="text-xs text-accent-600">{error}</span>}
    </span>
  );
}
