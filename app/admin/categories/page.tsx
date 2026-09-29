import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { deleteCategory } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*, jobs(count)")
    .order("position")
    .returns<(Category & { jobs: { count: number }[] })[]>();

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Catégories</h1>
      <p className="text-sm text-muted">Les catégories alimentent les filtres, les pastilles de l&apos;accueil et les préférences des candidats.</p>
      <div className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">Ajouter</h2>
        <CategoryForm category={null} />
      </div>
      <ul className="card divide-y divide-line">
        {categories?.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="flex-1"><CategoryForm category={c} /></div>
            <span className="text-xs text-muted">{c.jobs[0]?.count ?? 0} offre(s)</span>
            <form action={deleteCategory.bind(null, c.id)}>
              <ConfirmSubmit message={`Supprimer la catégorie ${c.name} ? Les offres liées resteront sans catégorie.`} className="text-sm text-accent-600 underline">
                Supprimer
              </ConfirmSubmit>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
