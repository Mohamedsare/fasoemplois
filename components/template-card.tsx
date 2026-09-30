import { Crown } from "lucide-react";
import { sampleForTemplate } from "@/lib/sample-cvs";
import type { CatalogTemplate } from "@/lib/template-spec";
import { CvPreview } from "./cv-preview";

/** Badge « Premium » (modèles inclus dans les abonnements) ou « Gratuit ». */
export function TemplateBadge({ premium, className = "" }: { premium: boolean; className?: string }) {
  return premium ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-semibold text-star-400 ${className}`}>
      <Crown aria-hidden className="size-3" /> Premium
    </span>
  ) : (
    <span className={`inline-flex items-center rounded-full bg-brand-600/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-700 ${className}`}>
      Gratuit
    </span>
  );
}

/** Carte de présentation d'un modèle, avec un CV d'exemple complet. */
export function TemplateCard({ template: meta, children }: { template: CatalogTemplate; children?: React.ReactNode }) {
  const sample = sampleForTemplate(meta);
  return (
    <div className="flex h-full flex-col">
      <div className="relative rounded-2xl bg-surface p-3 sm:p-4">
        <CvPreview cv={sample.cv} photoUrl={sample.photo} />
        <TemplateBadge premium={meta.premium} className="absolute top-2 right-2 shadow-sm" />
      </div>
      <p className="mt-3 font-semibold">{meta.label}</p>
      <p className="text-sm text-muted">{meta.description}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
