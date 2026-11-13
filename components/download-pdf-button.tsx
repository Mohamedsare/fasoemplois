"use client";

import { Download, FileText, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const FORMATS = {
  pdf: { path: "pdf", label: "Télécharger en PDF", pending: "Génération du PDF…", error: "La génération du PDF a échoué. Réessayez.", fallback: "CV.pdf" },
  docx: { path: "word", label: "Télécharger en Word", pending: "Génération du Word…", error: "La génération du document Word a échoué. Réessayez.", fallback: "CV.docx" },
} as const;

/**
 * Télécharge le CV en vrai fichier PDF ou Word (générés côté serveur).
 * Sans abonnement (`locked`), le bouton mène à la page des abonnements.
 */
export function DownloadPdfButton({
  cvId,
  className = "btn-primary",
  format = "pdf",
  label,
  locked = false,
}: {
  cvId: string;
  className?: string;
  format?: keyof typeof FORMATS;
  label?: string;
  locked?: boolean;
}) {
  const f = FORMATS[format];
  const text = label ?? f.label;
  const Icon = format === "docx" ? FileText : Download;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (locked) {
    return (
      <Link href="/abonnements?pdf=1" className={className} title="Le téléchargement PDF et Word est inclus dans les abonnements">
        <Lock aria-hidden className="size-4" /> {text}
      </Link>
    );
  }

  async function download() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/cv/${cvId}/${f.path}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? f.error);
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? f.fallback;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : f.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-1">
      <button type="button" onClick={download} disabled={pending} className={className} aria-busy={pending}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Icon aria-hidden className="size-4" />}
        {pending ? f.pending : text}
      </button>
      {error && <span role="alert" className="text-xs text-accent-600">{error}</span>}
    </span>
  );
}
