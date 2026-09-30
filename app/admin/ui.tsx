import { ChevronLeft, ChevronRight, Download, Search, type LucideIcon } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { formatNumber, formatShortDate } from "@/lib/format";
import type { AdminUserRow } from "@/lib/types";

/** En-tête de page du back-office : titre, sous-titre et actions. */
export function PageHeader({ title, description, children }: { title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Indicateur chiffré. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "warn";
  href?: string;
}) {
  const tones = {
    default: "bg-surface text-ink",
    brand: "bg-brand-50 text-brand-700",
    warn: "bg-[#ff7900]/10 text-[#c25a00]",
  };
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <dt className="text-xs font-medium text-muted">{label}</dt>
        {Icon && (
          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon aria-hidden className="size-4" />
          </span>
        )}
      </div>
      <dd className="mt-1 text-2xl font-bold tracking-tight">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs text-muted">{hint}</dd>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition-colors hover:border-ink/30">{body}</Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

/** Filtres en pastilles (liens). */
export function FilterChips({ items, active }: { items: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      {items.map((i) => (
        <Link key={i.key} href={i.href} aria-current={active === i.key ? "page" : undefined} className={`chip ${active === i.key ? "chip-active" : ""}`}>
          {i.label}
          {i.count !== undefined && <span className="opacity-60">{formatNumber(i.count)}</span>}
        </Link>
      ))}
    </div>
  );
}

/** Recherche (formulaire GET, conserve les autres paramètres). */
export function SearchBox({ action, q, placeholder, hidden = {} }: { action: string; q: string; placeholder: string; hidden?: Record<string, string> }) {
  return (
    <Form action={action} className="flex w-full gap-2 sm:max-w-md">
      {Object.entries(hidden).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <div className="relative min-w-0 flex-1">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder={placeholder} aria-label="Rechercher" className="input rounded-full pl-9" />
      </div>
      <button type="submit" className="btn-dark">Rechercher</button>
    </Form>
  );
}

/** Pagination « précédent / suivant ». */
export function Pagination({ page, perPage, total, href }: { page: number; perPage: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted">
        {formatNumber(from)}–{formatNumber(to)} sur {formatNumber(total)}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn-secondary px-3 py-1.5"><ChevronLeft aria-hidden className="size-4" /> Précédent</Link>
        ) : (
          <span className="btn-secondary pointer-events-none px-3 py-1.5 opacity-40"><ChevronLeft aria-hidden className="size-4" /> Précédent</span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className="btn-secondary px-3 py-1.5">Suivant <ChevronRight aria-hidden className="size-4" /></Link>
        ) : (
          <span className="btn-secondary pointer-events-none px-3 py-1.5 opacity-40">Suivant <ChevronRight aria-hidden className="size-4" /></span>
        )}
      </div>
    </nav>
  );
}

export function ExportLink({ href }: { href: string }) {
  return (
    <a href={href} className="btn-secondary" download>
      <Download aria-hidden className="size-4" /> Exporter (CSV)
    </a>
  );
}

/** Numéro de page à partir des paramètres d'URL. */
export function pageParam(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

/** Construit une URL en ignorant les paramètres vides. */
export function buildHref(path: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Statut d'abonnement lisible. */
export function SegmentBadge({ row }: { row: Pick<AdminUserRow, "segment" | "plan_name" | "subscription_status" | "subscription_expires_at"> }) {
  if (row.segment === "abonne") {
    return (
      <span className="inline-flex flex-col">
        <span className="inline-flex w-fit items-center rounded-full border border-brand-600 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
          {row.plan_name ?? "Abonné"}
          {row.subscription_status === "cancelled" && " · non renouvelé"}
        </span>
        {row.subscription_expires_at && <span className="mt-0.5 text-xs text-muted">jusqu&apos;au {formatShortDate(row.subscription_expires_at)}</span>}
      </span>
    );
  }
  if (row.segment === "expire") {
    return <span className="inline-flex w-fit rounded-full border border-star-400 bg-star-400/15 px-2 py-0.5 text-xs font-medium">Expiré</span>;
  }
  return <span className="text-xs text-muted">Gratuit</span>;
}
