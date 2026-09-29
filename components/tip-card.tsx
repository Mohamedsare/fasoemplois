import Link from "next/link";
import type { Tip } from "@/lib/types";

export type TipSummary = Pick<Tip, "id" | "slug" | "title" | "excerpt" | "category" | "reading_minutes">;

export const TIP_SUMMARY_COLUMNS = "id, slug, title, excerpt, category, reading_minutes";

export function TipCard({ tip }: { tip: TipSummary }) {
  return (
    <article className="card group relative flex flex-col p-5 transition-shadow hover:shadow-md">
      <span className="badge self-start bg-star-400/20 text-ink">{tip.category}</span>
      <h3 className="mt-3 font-semibold group-hover:text-brand-700">
        <Link href={`/astuces/${tip.slug}`} className="after:absolute after:inset-0">
          {tip.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{tip.excerpt}</p>
      <p className="mt-4 text-xs text-muted">{tip.reading_minutes} min de lecture</p>
    </article>
  );
}
