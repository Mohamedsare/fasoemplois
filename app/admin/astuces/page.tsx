import { CircleCheck, ExternalLink, PencilLine, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate } from "@/lib/format";
import type { Tip } from "@/lib/types";
import { PageHeader } from "../ui";

export const metadata: Metadata = { title: "Astuces" };

export default async function AdminTipsPage(props: PageProps<"/admin/astuces">) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: tips } = await supabase.from("tips").select("*").order("published_at", { ascending: false }).returns<Tip[]>();
  const published = tips?.filter((t) => t.is_published).length ?? 0;
  const drafts = (tips?.length ?? 0) - published;

  return (
    <div className="space-y-5">
      <PageHeader title="Astuces" description={`Conseils publiés sur le site : ${published} publiée(s), ${drafts} brouillon(s).`}>
        <Link href="/admin/astuces/nouvelle" className="btn-primary"><Plus aria-hidden className="size-4" /> Nouvelle astuce</Link>
      </PageHeader>
      {sp.enregistre === "1" && <p role="status" className="rounded-xl border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm text-brand-800">Astuce enregistrée.</p>}
      <ul className="card divide-y divide-line">
        {tips?.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1 basis-60">
              <Link href={`/admin/astuces/${t.id}`} className="font-medium hover:text-brand-700">{t.title}</Link>
              <p className="text-xs text-muted">{t.category} · {t.reading_minutes} min · {formatShortDate(t.published_at)}</p>
            </div>
            <span className={`badge ${t.is_published ? "bg-brand-50 text-brand-700" : ""}`}>
              {t.is_published ? <><CircleCheck aria-hidden className="mr-1 size-3" />Publiée</> : <><PencilLine aria-hidden className="mr-1 size-3" />Brouillon</>}
            </span>
            <Link href={`/admin/astuces/${t.id}`} className="btn-secondary px-3 py-1.5 text-xs"><PencilLine aria-hidden className="size-3.5" /> Modifier</Link>
            {t.is_published && (
              <Link href={`/astuces/${t.slug}`} target="_blank" className="btn-secondary px-3 py-1.5 text-xs"><ExternalLink aria-hidden className="size-3.5" /> Voir</Link>
            )}
          </li>
        ))}
        {!tips?.length && <li className="p-10 text-center text-sm text-muted">Aucune astuce.</li>}
      </ul>
    </div>
  );
}
