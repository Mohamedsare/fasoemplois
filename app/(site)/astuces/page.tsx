import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TIP_SUMMARY_COLUMNS, TipCard, type TipSummary } from "@/components/tip-card";

export const metadata: Metadata = {
  title: "Astuces",
  description: "Conseils pour rédiger votre CV, réussir vos entretiens et trouver un emploi.",
};

export default async function TipsPage(props: PageProps<"/astuces">) {
  const sp = await props.searchParams;
  const categorie = typeof sp.categorie === "string" ? sp.categorie : "";

  const supabase = await createClient();
  const { data } = await supabase
    .from("tips")
    .select(TIP_SUMMARY_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<TipSummary[]>();

  const tips = data ?? [];
  const categories = [...new Set(tips.map((t) => t.category))].sort();
  const visible = categorie ? tips.filter((t) => t.category === categorie) : tips;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Astuces</h1>
      <p className="mt-1 text-muted">
        Nos conseils pour préparer votre candidature et décrocher le poste.
      </p>

      {categories.length > 1 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
          {["", ...categories].map((c) => (
            <li key={c || "all"}>
              <Link
                href={c ? `/astuces?categorie=${encodeURIComponent(c)}` : "/astuces"}
                aria-current={c === categorie ? "page" : undefined}
                className={`inline-block rounded-full border px-4 py-1.5 text-sm ${
                  c === categorie
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-white hover:border-brand-600"
                }`}
              >
                {c || "Toutes"}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((tip) => (
          <TipCard key={tip.id} tip={tip} />
        ))}
      </div>
      {!visible.length && <p className="card mt-8 p-8 text-center text-muted">Aucune astuce pour le moment.</p>}
    </div>
  );
}
