import Form from "next/form";
import Link from "next/link";
import { CITIES, CONTRACT_TYPES, EXPERIENCE_LABELS } from "@/lib/constants";
import type { Category } from "@/lib/types";

type Filters = {
  q: string;
  ville: string;
  categorie: string;
  contrat: string[];
  experience: string[];
  publication: string;
  tri: string;
};

export function JobFilters({ filters, categories, idPrefix }: { filters: Filters; categories: Category[]; idPrefix: string }) {
  return (
    <Form action="/offres" className="space-y-5">
      <h2 className="font-semibold">Filtres</h2>
      {filters.tri === "recent" && <input type="hidden" name="tri" value="recent" />}

      <div>
        <label htmlFor={`${idPrefix}-q`} className="sr-only">Recherche</label>
        <input id={`${idPrefix}-q`} name="q" defaultValue={filters.q} placeholder="Recherche" className="input rounded-full" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-ville`} className="sr-only">Localisation</label>
        <select id={`${idPrefix}-ville`} name="ville" defaultValue={filters.ville} className="input rounded-full">
          <option value="">Localisation</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-cat`} className="sr-only">Catégorie</label>
        <select id={`${idPrefix}-cat`} name="categorie" defaultValue={filters.categorie} className="input rounded-full">
          <option value="">Catégorie</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Type de contrat</legend>
        {CONTRACT_TYPES.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="contrat" value={c} defaultChecked={filters.contrat.includes(c)} className="size-4 accent-brand-600" />
            {c}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Expérience</legend>
        {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="experience" value={value} defaultChecked={filters.experience.includes(value)} className="size-4 accent-brand-600" />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Publication</legend>
        {[
          { value: "", label: "Toutes" },
          { value: "7", label: "7 derniers jours" },
          { value: "30", label: "30 derniers jours" },
        ].map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="publication" value={o.value} defaultChecked={filters.publication === o.value} className="size-4 accent-brand-600" />
            {o.label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <button type="submit" className="btn-primary w-full">Appliquer</button>
        <Link href="/offres" className="btn-secondary w-full">Réinitialiser</Link>
      </div>
    </Form>
  );
}
