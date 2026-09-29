import { CircleCheck, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/format";
import type { Tip } from "@/lib/types";

export const metadata: Metadata = { title: "Contenu" };

export default async function AdminTipsPage(props: PageProps<"/admin/astuces">) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: tips } = await supabase.from("tips").select("*").order("published_at", { ascending: false }).returns<Tip[]>();

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <h1 className="flex-1 text-2xl font-bold">Contenu · Astuces</h1>
        <Link href="/admin/astuces/nouvelle" className="btn-primary">+ Nouvelle astuce</Link>
      </div>
      {sp.enregistre === "1" && <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Astuce enregistrée.</p>}
      <ul className="card divide-y divide-line">
        {tips?.map((t) => (
          <li key={t.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/astuces/${t.id}`} className="font-medium hover:text-brand-700">{t.title}</Link>
              <p className="text-xs text-muted">{t.category} · {formatShortDate(t.published_at)}</p>
            </div>
            <span className={`badge ${t.is_published ? "bg-brand-50 text-brand-700" : ""}`}>{t.is_published ? <><CircleCheck aria-hidden className="mr-1 size-3" />Publiée</> : <><PencilLine aria-hidden className="mr-1 size-3" />Brouillon</>}</span>
            {t.is_published && <Link href={`/astuces/${t.slug}`} target="_blank" className="text-xs underline">Voir</Link>}
          </li>
        ))}
        {!tips?.length && <li className="p-8 text-center text-sm text-muted">Aucune astuce.</li>}
      </ul>
    </div>
  );
}
