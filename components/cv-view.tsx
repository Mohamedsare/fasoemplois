import type { Cv, CvEntry } from "@/lib/types";

function Entries({ title, entries }: { title: string; entries: CvEntry[] }) {
  if (!entries.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="border-b-2 border-brand-600 pb-1 text-sm font-bold uppercase tracking-wider text-brand-700">
        {title}
      </h2>
      {entries.map((e, i) => (
        <div key={i} className="break-inside-avoid">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-semibold">{e.title}</h3>
            {(e.start || e.end) && (
              <p className="text-sm text-muted">
                {e.start}
                {e.start && e.end ? " – " : ""}
                {e.end}
              </p>
            )}
          </div>
          {e.organization && <p className="text-sm text-muted">{e.organization}</p>}
          {e.description && <p className="mt-1 whitespace-pre-line text-sm">{e.description}</p>}
        </div>
      ))}
    </section>
  );
}

/** Rendu du CV, utilisé pour l'aperçu, l'impression et la consultation par un recruteur. */
export function CvView({ cv }: { cv: Cv }) {
  const contact = [cv.email, cv.phone, cv.city].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-white p-8 sm:p-12 print:p-0">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{cv.full_name}</h1>
        {cv.headline && <p className="text-lg text-brand-700">{cv.headline}</p>}
        {contact.length > 0 && <p className="text-sm text-muted">{contact.join(" · ")}</p>}
      </header>

      {cv.summary && <p className="whitespace-pre-line leading-relaxed">{cv.summary}</p>}

      <Entries title="Expériences professionnelles" entries={cv.experiences} />
      <Entries title="Formation" entries={cv.education} />

      {(cv.skills.length > 0 || cv.languages.length > 0) && (
        <div className="grid gap-8 sm:grid-cols-2">
          {cv.skills.length > 0 && (
            <section className="space-y-3">
              <h2 className="border-b-2 border-brand-600 pb-1 text-sm font-bold uppercase tracking-wider text-brand-700">
                Compétences
              </h2>
              <ul className="flex flex-wrap gap-2">
                {cv.skills.map((s) => <li key={s} className="badge">{s}</li>)}
              </ul>
            </section>
          )}
          {cv.languages.length > 0 && (
            <section className="space-y-3">
              <h2 className="border-b-2 border-brand-600 pb-1 text-sm font-bold uppercase tracking-wider text-brand-700">
                Langues
              </h2>
              <ul className="space-y-1 text-sm">
                {cv.languages.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
