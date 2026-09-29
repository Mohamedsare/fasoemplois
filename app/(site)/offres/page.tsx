import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getFavoriteIds, getMinPrice } from "@/lib/queries";
import { CONTRACT_TYPES, EXPERIENCE_LABELS, JOBS_PER_PAGE } from "@/lib/constants";
import { daysAgoIso, formatNumber, param, sanitizeSearch } from "@/lib/format";
import { JOB_SUMMARY_COLUMNS, JobCard, type JobSummary } from "@/components/job-card";
import { UpgradeCard } from "@/components/upgrade-card";
import { EmptyState } from "@/components/ui";
import { FilterSheet } from "./filter-sheet";
import { JobFilters } from "./job-filters";

export const metadata: Metadata = { title: "Offres d'emploi" };

function list(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
}

export default async function JobsPage(props: PageProps<"/offres">) {
  const sp = await props.searchParams;
  const filters = {
    q: sanitizeSearch(param(sp.q)),
    ville: param(sp.ville),
    categorie: param(sp.categorie),
    contrat: list(sp.contrat).filter((c) => (CONTRACT_TYPES as string[]).includes(c)),
    experience: list(sp.experience).filter((e) => e in EXPERIENCE_LABELS),
    publication: ["7", "30"].includes(param(sp.publication)) ? param(sp.publication) : "",
    tri: param(sp.tri) === "recent" ? "recent" : "pertinence",
  };
  const page = Math.max(1, Number.parseInt(param(sp.page), 10) || 1);

  const [user, categories, minPrice] = await Promise.all([getCurrentUser(), getCategories(), getMinPrice()]);
  const category = categories.find((c) => c.slug === filters.categorie);

  const supabase = await createClient();
  let query = supabase.from("jobs").select(JOB_SUMMARY_COLUMNS, { count: "exact" });
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,summary.ilike.%${filters.q}%,city.ilike.%${filters.q}%`);
  if (filters.ville) query = query.eq("city", filters.ville);
  if (category) query = query.eq("category_id", category.id);
  if (filters.contrat.length) query = query.in("contract_type", filters.contrat);
  if (filters.experience.length) query = query.in("experience_level", filters.experience);
  if (filters.publication) {
    query = query.gte("published_at", daysAgoIso(Number(filters.publication)));
  }
  if (filters.tri === "pertinence") {
    query = query.order("is_featured", { ascending: false }).order("is_urgent", { ascending: false });
  }

  const from = (page - 1) * JOBS_PER_PAGE;
  const [{ data: jobs, count }, favorites] = await Promise.all([
    query.order("published_at", { ascending: false }).range(from, from + JOBS_PER_PAGE - 1).returns<JobSummary[]>(),
    getFavoriteIds(user?.id),
  ]);

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));

  const hrefWith = (changes: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...changes } as Record<string, string | string[] | null>;
    for (const [key, value] of Object.entries(merged)) {
      if (key === "tri" && value === "pertinence") continue;
      for (const v of Array.isArray(value) ? value : value ? [value] : []) params.append(key, v);
    }
    if (changes.page) params.set("page", String(changes.page));
    const s = params.toString();
    return s ? `/offres?${s}` : "/offres";
  };

  // Pastilles des filtres actifs (cliquer = retirer)
  const activeChips = [
    filters.q && { label: `« ${filters.q} »`, href: hrefWith({ q: null }) },
    filters.ville && { label: filters.ville, href: hrefWith({ ville: null }) },
    category && { label: category.name, href: hrefWith({ categorie: null }) },
    ...filters.contrat.map((c) => ({ label: c, href: hrefWith({ contrat: filters.contrat.filter((x) => x !== c) }) })),
    ...filters.experience.map((e) => ({
      label: EXPERIENCE_LABELS[e as keyof typeof EXPERIENCE_LABELS],
      href: hrefWith({ experience: filters.experience.filter((x) => x !== e) }),
    })),
    filters.publication && { label: `${filters.publication} derniers jours`, href: hrefWith({ publication: null }) },
  ].filter(Boolean) as { label: string; href: string }[];


  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24"><JobFilters filters={filters} categories={categories} idPrefix="fd" /></div>
        </aside>

        <section aria-label="Résultats" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold">
              {formatNumber(total)} opportunité{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
            </h1>
            <div className="lg:hidden">
              <FilterSheet count={activeChips.length} total={total}>
                <JobFilters filters={filters} categories={categories} idPrefix="fm" />
              </FilterSheet>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted">Trier :</span>
              <Link href={hrefWith({ tri: "pertinence", page: null })} className={`chip ${filters.tri === "pertinence" ? "chip-active" : ""}`}>
                Pertinence
              </Link>
              <Link href={hrefWith({ tri: "recent", page: null })} className={`chip ${filters.tri === "recent" ? "chip-active" : ""}`}>
                Plus récent
              </Link>
            </div>
          </div>

          {activeChips.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Filtres actifs">
              {activeChips.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="chip hover:border-ink" aria-label={`Retirer le filtre ${c.label}`}>
                    {c.label} <X aria-hidden className="size-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {jobs?.length ? (
            <div className="space-y-3">
              {jobs.map((job, i) => (
                <div key={job.id} className="space-y-3">
                  <JobCard job={job} isFavorite={favorites.has(job.id)} />
                  {i === 3 && !user?.isSubscribed && <UpgradeCard minPrice={minPrice} />}
                </div>
              ))}
              {jobs.length <= 3 && !user?.isSubscribed && <UpgradeCard minPrice={minPrice} />}
            </div>
          ) : (
            <EmptyState
              title="Aucune offre ne correspond à votre recherche."
              text="Essayez d'élargir vos critères ou de retirer un filtre."
              action={<Link href="/offres" className="btn-secondary">Réinitialiser les filtres</Link>}
            />
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-4">
              {page > 1 && <Link href={hrefWith({ page: String(page - 1) })} className="chip" aria-label="Page précédente">‹</Link>}
              {Array.from({ length: pageCount }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pageCount)
                .map((p) => (
                  <Link
                    key={p}
                    href={hrefWith({ page: p > 1 ? String(p) : null })}
                    aria-current={p === page ? "page" : undefined}
                    className={`chip ${p === page ? "chip-active" : ""}`}
                  >
                    {p}
                  </Link>
                ))}
              {page < pageCount && <Link href={hrefWith({ page: String(page + 1) })} className="chip" aria-label="Page suivante">›</Link>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
