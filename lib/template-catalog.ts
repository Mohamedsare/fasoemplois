import "server-only";
import { cache } from "react";
import { CV_TEMPLATES } from "./constants";
import { createClient } from "./supabase/server";
import { isCustomTemplateId, sanitizeSpec, type CatalogTemplate, type TemplateSpec } from "./template-spec";

/** Ligne de la table cv_templates (modèles créés par l'IA). */
export type CustomTemplateRow = {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  spec: TemplateSpec;
  sample: string;
  prompt: string | null;
  is_published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

export const BUILTIN_CATALOG: CatalogTemplate[] = CV_TEMPLATES.map((t) => ({ ...t, spec: null, sample: null, custom: false }));

export function toCatalog(row: Pick<CustomTemplateRow, "id" | "name" | "description" | "premium" | "spec" | "sample">): CatalogTemplate {
  return {
    value: row.id,
    label: row.name,
    description: row.description,
    premium: row.premium,
    spec: sanitizeSpec(row.spec),
    sample: row.sample,
    custom: true,
  };
}

/**
 * Catalogue complet : modèles du code puis modèles IA publiés (ou tous, pour le back-office).
 * Sans la table (migration pas encore appliquée), seuls les modèles du code sont renvoyés.
 */
export const getTemplateCatalog = cache(async (includeDrafts = false): Promise<CatalogTemplate[]> => {
  const supabase = await createClient();
  let query = supabase
    .from("cv_templates")
    .select("id, name, description, premium, spec, sample")
    .order("position")
    .order("created_at", { ascending: false });
  if (!includeDrafts) query = query.eq("is_published", true);
  const { data, error } = await query.returns<CustomTemplateRow[]>();
  if (error) return BUILTIN_CATALOG;
  return [...BUILTIN_CATALOG, ...(data ?? []).map(toCatalog)];
});

/**
 * Modèle à enregistrer pour un CV : jamais la fiche envoyée par le navigateur.
 * - modèle du code : sans fiche ;
 * - modèle IA publié : fiche relue en base ;
 * - modèle IA retiré depuis : le CV garde sa copie ;
 * - sinon : « moderne ».
 */
export async function resolveTemplate(
  requested: string,
  previous?: { template: string; template_spec: TemplateSpec | null } | null,
): Promise<{ template: string; template_spec: TemplateSpec | null }> {
  if (BUILTIN_CATALOG.some((t) => t.value === requested)) return { template: requested, template_spec: null };
  if (isCustomTemplateId(requested)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cv_templates")
      .select("spec")
      .eq("id", requested)
      .eq("is_published", true)
      .maybeSingle<{ spec: TemplateSpec }>();
    if (data) return { template: requested, template_spec: sanitizeSpec(data.spec) };
    if (previous?.template === requested && previous.template_spec) return { template: requested, template_spec: sanitizeSpec(previous.template_spec) };
  }
  return { template: "moderne", template_spec: null };
}
