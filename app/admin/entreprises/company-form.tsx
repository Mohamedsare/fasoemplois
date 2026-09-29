"use client";

import { saveCompany } from "@/app/actions/admin";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { CITIES } from "@/lib/constants";
import type { Company } from "@/lib/types";

export function CompanyForm({ company }: { company: Company | null }) {
  const { state, onSubmit, pending } = useFormAction(saveCompany.bind(null, company?.id ?? null));
  const e = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormAlert state={state} />
      <Field label="Nom" name="name" required error={e.name}>
        <input id="name" name="name" defaultValue={company?.name} className="input" />
      </Field>
      <Field label="Ville" name="city">
        <input id="city" name="city" list="company-cities" defaultValue={company?.city ?? ""} className="input" />
        <datalist id="company-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Site web" name="website">
        <input id="website" name="website" type="url" defaultValue={company?.website ?? ""} placeholder="https://" className="input" />
      </Field>
      <Field label="Description" name="description">
        <textarea id="description" name="description" rows={3} defaultValue={company?.description ?? ""} className="input" />
      </Field>
      <Field label="Logo" name="logo" hint="PNG, JPG, WebP ou SVG · 1 Mo max." error={e.logo}>
        <input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="text-sm" />
      </Field>
      <SubmitButton pending={pending} className="btn-primary w-full" pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
