"use client";

import { saveCategory } from "@/app/actions/admin";
import { SubmitButton, useFormAction } from "@/components/form";
import type { Category } from "@/lib/types";

export function CategoryForm({ category }: { category: Category | null }) {
  const { state, onSubmit, pending } = useFormAction(saveCategory);
  const idp = category?.id ?? "new";

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <label htmlFor={`cat-name-${idp}`} className="sr-only">Nom</label>
      <input id={`cat-name-${idp}`} name="name" defaultValue={category?.name} placeholder="Nom de la catégorie" className="input max-w-56 py-1.5" />
      <label htmlFor={`cat-pos-${idp}`} className="sr-only">Ordre</label>
      <input id={`cat-pos-${idp}`} name="position" type="number" defaultValue={category?.position ?? 0} className="input w-20 py-1.5" title="Ordre d'affichage" />
      <SubmitButton pending={pending} className="btn-secondary py-1.5" pendingLabel="…">{category ? "Enregistrer" : "Ajouter"}</SubmitButton>
      {state?.error && <span className="text-xs text-accent-600">{state.error}</span>}
      {state?.success && <span className="text-xs text-brand-700">{state.success}</span>}
    </form>
  );
}
