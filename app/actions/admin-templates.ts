"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-log";
import { AiError, isAiConfigured } from "@/lib/ai";
import { SAMPLE_PEOPLE } from "@/lib/sample-cvs";
import { generateTemplate, type GeneratedTemplate } from "@/lib/template-ai";
import { CUSTOM_PREFIX, isCustomTemplateId, sanitizeSpec, type TemplateSpec } from "@/lib/template-spec";

function revalidateTemplates() {
  // Galerie, éditeur de CV, accueil et back-office
  revalidatePath("/", "layout");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
}

/** Génère (ou retouche) une fiche de style avec l'IA. Rien n'est enregistré à cette étape. */
export async function generateTemplateAction(input: {
  brief: string;
  current?: { spec: TemplateSpec; name: string; description: string } | null;
}): Promise<{ result?: GeneratedTemplate; error?: string }> {
  await requireAdmin();
  const brief = String(input.brief ?? "").trim().slice(0, 1000);
  if (brief.length < 5) return { error: "Décrivez le modèle souhaité en quelques mots." };
  if (!isAiConfigured()) return { error: "L'assistant IA n'est pas configuré (OPENAI_API_KEY)." };
  const current = input.current ? { spec: sanitizeSpec(input.current.spec), name: String(input.current.name).slice(0, 40), description: String(input.current.description).slice(0, 120) } : null;
  try {
    return { result: await generateTemplate(brief, current) };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : "La génération a échoué. Réessayez." };
  }
}

/** Crée ou met à jour un modèle IA (brouillon ou publié). */
export async function saveTemplateAction(input: {
  id: string | null;
  name: string;
  description: string;
  premium: boolean;
  sample: string;
  prompt: string | null;
  spec: TemplateSpec;
  publish: boolean;
}): Promise<{ id?: string; error?: string; success?: string }> {
  const admin = await requireAdmin();
  const name = String(input.name ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (name.length < 2) return { error: "Donnez un nom au modèle." };
  const values = {
    name,
    description: String(input.description ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
    premium: Boolean(input.premium),
    sample: SAMPLE_PEOPLE.some((p) => p.id === input.sample) ? input.sample : SAMPLE_PEOPLE[0].id,
    prompt: input.prompt ? String(input.prompt).slice(0, 1000) : null,
    spec: sanitizeSpec(input.spec),
    is_published: Boolean(input.publish),
  };

  const supabase = await createClient();
  let id = input.id;
  if (id) {
    if (!isCustomTemplateId(id)) return { error: "Modèle introuvable." };
    const { error } = await supabase.from("cv_templates").update(values).eq("id", id);
    if (error) return { error: "Enregistrement impossible." };
  } else {
    id = `${CUSTOM_PREFIX}${slugify(name) || "modele"}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("cv_templates").insert({ ...values, id, created_by: admin.id });
    if (error) return { error: ["42P01", "PGRST205"].includes(error.code) ? "Appliquez d'abord la migration des modèles IA." : "Création impossible." };
  }

  await logAdminAction(admin.id, input.id ? (values.is_published ? "template_published" : "template_updated") : "template_created", null, {
    name,
    published: values.is_published,
  });
  revalidateTemplates();
  return { id, success: values.is_published ? "Modèle publié : il est proposé à tous les utilisateurs." : "Brouillon enregistré." };
}

export async function setTemplatePublished(id: string, published: boolean) {
  const admin = await requireAdmin();
  if (!isCustomTemplateId(id)) return;
  const supabase = await createClient();
  const { data } = await supabase.from("cv_templates").update({ is_published: published }).eq("id", id).select("name").maybeSingle<{ name: string }>();
  if (data) await logAdminAction(admin.id, published ? "template_published" : "template_unpublished", null, { name: data.name });
  revalidateTemplates();
}

export async function setTemplatePremium(id: string, premium: boolean) {
  await requireAdmin();
  if (!isCustomTemplateId(id)) return;
  const supabase = await createClient();
  await supabase.from("cv_templates").update({ premium }).eq("id", id);
  revalidateTemplates();
}

/** Supprime un modèle IA : les CV qui l'utilisent gardent leur copie de la fiche de style. */
export async function deleteTemplate(id: string) {
  const admin = await requireAdmin();
  if (!isCustomTemplateId(id)) return;
  const supabase = await createClient();
  const { data } = await supabase.from("cv_templates").delete().eq("id", id).select("name").maybeSingle<{ name: string }>();
  if (data) await logAdminAction(admin.id, "template_deleted", null, { name: data.name });
  revalidateTemplates();
  redirect("/admin/modeles?supprime=1");
}
