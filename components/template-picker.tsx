"use client";

import { Crown } from "lucide-react";
import { CvPreview } from "./cv-preview";
import { sampleForTemplate } from "@/lib/sample-cvs";
import type { CatalogTemplate } from "@/lib/template-spec";
import type { CvDraft } from "@/lib/types";

/**
 * Grille des modèles. Chaque vignette montre le CV d'exemple du modèle, ou le CV de
 * l'utilisateur (`content`) quand il est déjà rempli : il voit directement son CV dans chaque modèle.
 */
export function TemplatePicker({
  templates,
  value,
  accent,
  onChange,
  content,
  photoUrl = null,
  className = "grid grid-cols-3 gap-2 sm:gap-3",
}: {
  templates: CatalogTemplate[];
  value: string;
  accent: string;
  onChange: (template: CatalogTemplate) => void;
  content?: CvDraft | null;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <div className={className} role="radiogroup" aria-label="Modèle de CV">
      {templates.map((t) => (
        <label
          key={t.value}
          className={`card relative cursor-pointer p-1.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand-600 sm:p-2 ${value === t.value ? "border-2 border-ink" : "hover:border-ink/30"}`}
        >
          <input type="radio" name="template" value={t.value} checked={value === t.value} onChange={() => onChange(t)} className="sr-only" />
          <TemplateThumb template={t} accent={accent} content={content} photoUrl={photoUrl} />
          {t.premium && (
            <span className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-ink text-star-400 shadow-sm sm:size-6" title="Modèle Premium">
              <Crown aria-hidden className="size-3 sm:size-3.5" />
              <span className="sr-only">Premium</span>
            </span>
          )}
          <span className="mt-1.5 block truncate text-center text-xs font-semibold sm:text-left sm:text-sm">{t.label}</span>
          <span className="hidden truncate text-xs text-muted sm:block">{t.description}</span>
        </label>
      ))}
    </div>
  );
}

function TemplateThumb({
  template,
  accent,
  content,
  photoUrl,
}: {
  template: CatalogTemplate;
  accent: string;
  content?: CvDraft | null;
  photoUrl: string | null;
}) {
  if (content) {
    return (
      <span className="pointer-events-none block" aria-hidden>
        <CvPreview cv={{ ...content, template: template.value, template_spec: template.spec, accent }} photoUrl={photoUrl} />
      </span>
    );
  }
  const sample = sampleForTemplate(template);
  return (
    <span className="pointer-events-none block" aria-hidden>
      <CvPreview cv={{ ...sample.cv, accent }} photoUrl={sample.photo} />
    </span>
  );
}
