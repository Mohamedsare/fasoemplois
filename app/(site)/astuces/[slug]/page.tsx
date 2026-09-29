import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { RichText } from "@/components/rich-text";
import { TIP_SUMMARY_COLUMNS, TipCard, type TipSummary } from "@/components/tip-card";
import type { Tip } from "@/lib/types";

async function getTip(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tips")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<Tip>();
  return data;
}

export async function generateMetadata(props: PageProps<"/astuces/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const tip = await getTip(slug);
  return tip ? { title: tip.title, description: tip.excerpt } : { title: "Astuce introuvable" };
}

export default async function TipPage(props: PageProps<"/astuces/[slug]">) {
  const { slug } = await props.params;
  const tip = await getTip(slug);
  if (!tip) notFound();

  const supabase = await createClient();
  const { data: related } = await supabase
    .from("tips")
    .select(TIP_SUMMARY_COLUMNS)
    .eq("is_published", true)
    .neq("id", tip.id)
    .order("published_at", { ascending: false })
    .limit(3)
    .returns<TipSummary[]>();

  return (
    <div className="container-page py-10">
      <Link href="/astuces" className="text-sm text-muted hover:text-ink">← Toutes les astuces</Link>

      <article className="mx-auto mt-6 max-w-2xl">
        <span className="badge bg-star-400/20 text-ink">{tip.category}</span>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{tip.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {formatDate(tip.published_at)} · {tip.reading_minutes} min de lecture
        </p>
        <p className="mt-6 text-lg text-muted">{tip.excerpt}</p>
        <div className="mt-8">
          <RichText text={tip.content} />
        </div>

        <div className="card mt-12 flex flex-col items-start gap-4 bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">Prêt à passer à l&apos;action ?</p>
          <div className="flex gap-2">
            <Link href="/cv" className="btn-secondary">Créer mon CV</Link>
            <Link href="/offres" className="btn-primary">Voir les offres</Link>
          </div>
        </div>
      </article>

      {related?.length ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">À lire aussi</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((t) => <TipCard key={t.id} tip={t} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
