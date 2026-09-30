"use client";

import { useState } from "react";
import { savePlan } from "@/app/actions/admin";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { PlanCard } from "@/components/plan-card";
import type { Plan } from "@/lib/types";

const EMPTY: Plan = {
  id: "",
  name: "",
  price: 0,
  description: "",
  features: [],
  application_limit: null,
  cv_limit: 4,
  badge: null,
  is_featured: false,
  is_available: true,
  cta_label: "Choisir ce plan",
  position: 0,
};

export function PlanEditor({ plan }: { plan: Plan | null }) {
  const { state, onSubmit, pending } = useFormAction(savePlan.bind(null, plan?.id ?? null));
  const [draft, setDraft] = useState<Plan>(plan ?? EMPTY);
  const [features, setFeatures] = useState((plan?.features ?? []).join("\n"));
  const e = state?.fieldErrors ?? {};
  const set = <K extends keyof Plan>(key: K, value: Plan[K]) => setDraft({ ...draft, [key]: value });

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <h2 className="font-semibold">{plan ? `Modifier · ${plan.name}` : "Nouveau plan"}</h2>
        <FormAlert state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du plan" name="name" required error={e.name}>
            <input id="name" name="name" value={draft.name} onChange={(ev) => set("name", ev.target.value)} className="input" />
          </Field>
          <Field label="Prix (FCFA / mois)" name="price" required error={e.price}>
            <input id="price" name="price" type="number" min={0} step={50} value={draft.price} onChange={(ev) => set("price", Number(ev.target.value))} className="input" />
          </Field>
        </div>
        <Field label="Description" name="description">
          <input id="description" name="description" value={draft.description ?? ""} onChange={(ev) => set("description", ev.target.value)} className="input" />
        </Field>
        <Field label="Fonctionnalités" name="features" hint="Une par ligne.">
          <textarea id="features" name="features" rows={5} value={features} onChange={(ev) => setFeatures(ev.target.value)} className="input" />
        </Field>
        <Field label="Nombre de CV" name="cv_limit" hint="CV que l'abonné peut créer avec le créateur de CV." error={e.cv_limit}>
          <input
            id="cv_limit"
            name="cv_limit"
            type="number"
            min={1}
            max={50}
            value={draft.cv_limit}
            onChange={(ev) => set("cv_limit", Number(ev.target.value))}
            className="input max-w-40"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Limite de candidatures / mois" name="application_limit" hint="Vide = illimité" error={e.application_limit}>
            <input
              id="application_limit"
              name="application_limit"
              type="number"
              min={1}
              value={draft.application_limit ?? ""}
              onChange={(ev) => set("application_limit", ev.target.value ? Number(ev.target.value) : null)}
              className="input"
            />
          </Field>
          <Field label="Badge" name="badge">
            <input id="badge" name="badge" value={draft.badge ?? ""} placeholder="Recommandé" onChange={(ev) => set("badge", ev.target.value || null)} className="input" />
          </Field>
          <Field label="Libellé du bouton" name="cta_label">
            <input id="cta_label" name="cta_label" value={draft.cta_label} onChange={(ev) => set("cta_label", ev.target.value)} className="input" />
          </Field>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_featured" checked={draft.is_featured} onChange={(ev) => set("is_featured", ev.target.checked)} className="size-4 accent-brand-600" />
            Mettre en avant (populaire)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_available" checked={draft.is_available} onChange={(ev) => set("is_available", ev.target.checked)} className="size-4 accent-brand-600" />
            Disponible
          </label>
        </div>
        <div className="flex justify-end">
          <SubmitButton pending={pending} pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-muted">Aperçu public</p>
        <div className="pointer-events-none">
          <PlanCard
            plan={{ ...draft, name: draft.name || "Nom du plan", features: features.split("\n").map((f) => f.trim()).filter(Boolean) }}
            href="#"
          />
        </div>
      </div>
    </div>
  );
}
