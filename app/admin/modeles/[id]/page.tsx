import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { SAMPLE_PEOPLE } from "@/lib/sample-cvs";
import { isCustomTemplateId, sanitizeSpec } from "@/lib/template-spec";
import type { CustomTemplateRow } from "@/lib/template-catalog";
import { PageHeader } from "../../ui";
import { TemplateDesigner } from "./template-designer";

export const metadata: Metadata = { title: "Concepteur de modèle" };

// La génération par l'IA (Server Action de cette page) peut prendre plusieurs secondes
export const maxDuration = 60;

export default async function TemplateDesignerPage(props: PageProps<"/admin/modeles/[id]">) {
  const { id } = await props.params;
  let row: CustomTemplateRow | null = null;
  if (id !== "nouveau") {
    if (!isCustomTemplateId(id)) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("cv_templates").select("*").eq("id", id).maybeSingle<CustomTemplateRow>();
    if (!data) notFound();
    row = data;
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/modeles" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Modèles
      </Link>
      <PageHeader
        title={row ? `Modèle « ${row.name} »` : "Nouveau modèle avec l'IA"}
        description="Décrivez le style voulu : l'IA dessine le modèle, vous l'ajustez, puis vous le publiez dans la galerie."
      />
      <TemplateDesigner
        aiEnabled={isAiConfigured()}
        initial={{
          id: row?.id ?? null,
          name: row?.name ?? "",
          description: row?.description ?? "",
          premium: row?.premium ?? true,
          sample: row?.sample ?? SAMPLE_PEOPLE[0].id,
          prompt: row?.prompt ?? null,
          spec: row ? sanitizeSpec(row.spec) : null,
          published: row?.is_published ?? false,
        }}
      />
    </div>
  );
}
