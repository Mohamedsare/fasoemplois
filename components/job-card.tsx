import Link from "next/link";
import { EXPERIENCE_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import type { Job } from "@/lib/types";
import { CompanyLogo } from "./ui";
import { FavoriteButton } from "./favorite-button";

export type JobSummary = Pick<
  Job,
  | "id"
  | "title"
  | "city"
  | "contract_type"
  | "experience_level"
  | "skills"
  | "is_featured"
  | "is_urgent"
  | "published_at"
  | "deadline"
> & {
  company: { name: string; logo_url: string | null } | null;
  category: { name: string } | null;
};

export const JOB_SUMMARY_COLUMNS =
  "id, title, city, contract_type, experience_level, skills, is_featured, is_urgent, published_at, deadline, company:companies(name, logo_url), category:categories(name)";

export function jobMeta(job: Pick<JobSummary, "city" | "contract_type" | "experience_level">) {
  return [job.city, job.contract_type, job.experience_level && EXPERIENCE_LABELS[job.experience_level]]
    .filter(Boolean)
    .join(" · ");
}

export function jobBadge(job: Pick<JobSummary, "is_urgent" | "is_featured" | "published_at">) {
  if (job.is_urgent) return { label: "Urgent", className: "bg-accent-500/10 text-accent-600" };
  if (job.is_featured) return { label: "À la une", className: "bg-star-400/25 text-ink" };
  if (job.published_at && Date.now() - new Date(job.published_at).getTime() < 3 * 86_400_000)
    return { label: "Nouveau", className: "bg-brand-50 text-brand-700" };
  return null;
}

type Props = { job: JobSummary; isFavorite?: boolean; layout?: "grid" | "row" };

export function JobCard({ job, isFavorite = false, layout = "row" }: Props) {
  const badge = jobBadge(job);
  const companyName = job.company?.name ?? "Entreprise";
  const href = `/offres/${job.id}`;

  if (layout === "grid") {
    return (
      <article className="card relative flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2">
          <CompanyLogo name={companyName} url={job.company?.logo_url} size={32} />
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{companyName}</span>
          <FavoriteButton jobId={job.id} isFavorite={isFavorite} />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold leading-snug">
            <Link href={href} className="hover:text-brand-700">{job.title}</Link>
          </h3>
          <p className="text-xs text-muted">{jobMeta(job)}</p>
        </div>
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="text-xs text-muted">{job.published_at && formatRelative(job.published_at)}</span>
          {badge && <span className={`badge ${badge.className}`}>{badge.label}</span>}
          <Link href={href} className="btn-secondary ml-auto px-3 py-1.5 text-xs">Voir l&apos;offre</Link>
        </div>
      </article>
    );
  }

  return (
    <article className="card flex items-start gap-4 p-4 transition-shadow hover:shadow-md">
      <CompanyLogo name={companyName} url={job.company?.logo_url} size={48} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">
            <Link href={href} className="hover:text-brand-700">{job.title}</Link>
          </h3>
          {badge && <span className={`badge ${badge.className}`}>{badge.label}</span>}
        </div>
        <p className="text-sm text-muted">{companyName} · {jobMeta(job)}</p>
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <FavoriteButton jobId={job.id} isFavorite={isFavorite} />
        <span className="text-xs text-muted">{job.published_at && formatRelative(job.published_at)}</span>
        <Link href={href} className="btn-secondary hidden px-3 py-1.5 text-xs sm:inline-flex">Voir l&apos;offre</Link>
      </div>
    </article>
  );
}
