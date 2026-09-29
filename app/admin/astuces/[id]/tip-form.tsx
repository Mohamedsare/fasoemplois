"use client";

import { useState } from "react";
import { saveTip } from "@/app/actions/admin";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { MarkdownEditor } from "@/components/markdown-editor";
import type { Tip } from "@/lib/types";

export function TipForm({ tip }: { tip: Tip | null }) {
  const { state, onSubmit, pending } = useFormAction(saveTip.bind(null, tip?.id ?? null));
  const [content, setContent] = useState(tip?.content ?? "");
  const e = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <FormAlert state={state} />
      <Field label="Titre" name="title" required error={e.title}>
        <input id="title" name="title" defaultValue={tip?.title} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Catégorie" name="category" required error={e.category}>
          <input id="category" name="category" list="tip-cats" defaultValue={tip?.category} className="input" />
          <datalist id="tip-cats">{["CV", "Entretien", "Candidature", "Recherche", "Sécurité"].map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Lien (slug)" name="slug" hint="Généré depuis le titre si vide.">
          <input id="slug" name="slug" defaultValue={tip?.slug} className="input" />
        </Field>
        <Field label="Minutes de lecture" name="reading_minutes">
          <input id="reading_minutes" name="reading_minutes" type="number" min={1} defaultValue={tip?.reading_minutes ?? 3} className="input" />
        </Field>
      </div>
      <Field label="Résumé" name="excerpt" required error={e.excerpt}>
        <textarea id="excerpt" name="excerpt" rows={2} defaultValue={tip?.excerpt} className="input" />
      </Field>
      <div>
        <label htmlFor="content" className="label">Contenu *</label>
        <MarkdownEditor id="content" name="content" value={content} onChange={setContent} rows={14} placeholder="## Sous-titre&#10;Paragraphe…&#10;- point" />
        {e.content && <p className="mt-1 text-xs text-accent-600">{e.content}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={tip?.is_published ?? true} className="size-4 accent-brand-600" />
        Publiée
      </label>
      <SubmitButton pending={pending} pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
