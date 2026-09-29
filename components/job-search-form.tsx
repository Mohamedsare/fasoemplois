import Form from "next/form";
import { CITIES } from "@/lib/constants";

type Props = { q?: string; ville?: string };

/** Barre de recherche « pilule » (accueil). */
export function JobSearchForm({ q = "", ville = "" }: Props) {
  return (
    <Form
      action="/offres"
      className="flex w-full flex-col gap-2 rounded-3xl border border-line bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="sr-only" htmlFor="search-q">Métier, compétence ou mot-clé</label>
      <input
        id="search-q"
        name="q"
        defaultValue={q}
        placeholder="Métier, compétence ou mot-clé"
        className="min-w-0 flex-1 rounded-full px-4 py-2.5 text-sm focus:outline-none"
      />
      <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
      <label className="sr-only" htmlFor="search-ville">Localisation</label>
      <select
        id="search-ville"
        name="ville"
        defaultValue={ville}
        className="rounded-full bg-transparent px-4 py-2.5 text-sm text-ink/80 focus:outline-none sm:w-48"
      >
        <option value="">Localisation</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button type="submit" className="btn-primary px-6 py-2.5">Rechercher</button>
    </Form>
  );
}
