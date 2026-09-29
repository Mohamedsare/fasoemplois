import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteTip } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Tip } from "@/lib/types";
import { TipForm } from "./tip-form";

export const metadata: Metadata = { title: "Astuce" };

export default async function AdminTipPage(props: PageProps<"/admin/astuces/[id]">) {
  const { id } = await props.params;
  let tip: Tip | null = null;
  if (id !== "nouvelle") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createClient();
    const { data } = await supabase.from("tips").select("*").eq("id", id).maybeSingle<Tip>();
    if (!data) notFound();
    tip = data;
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/admin/astuces" className="text-sm text-muted hover:text-ink">← Contenu</Link>
      <h1 className="text-2xl font-bold">{tip ? "Modifier l'astuce" : "Nouvelle astuce"}</h1>
      <TipForm tip={tip} />
      {tip && (
        <form action={deleteTip.bind(null, tip.id)} className="border-t border-line pt-5">
          <ConfirmSubmit message="Supprimer définitivement cette astuce ?">Supprimer l&apos;astuce</ConfirmSubmit>
        </form>
      )}
    </div>
  );
}
