import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate, initials, param, sanitizeSearch } from "@/lib/format";
import type { AdminUserRow } from "@/lib/types";
import { ExportLink, FilterChips, PageHeader, Pagination, SearchBox, SegmentBadge, buildHref, pageParam } from "../ui";

export const metadata: Metadata = { title: "Utilisateurs" };

const PER_PAGE = 25;

const SEGMENTS = [
  { key: "", label: "Tous" },
  { key: "abonne", label: "Abonnés" },
  { key: "gratuit", label: "Gratuits" },
  { key: "expire", label: "Expirés" },
  { key: "admin", label: "Admins" },
] as const;

type Segment = (typeof SEGMENTS)[number]["key"];

export default async function AdminUsersPage(props: PageProps<"/admin/utilisateurs">) {
  const sp = await props.searchParams;
  const q = sanitizeSearch(param(sp.q));
  const segment = (SEGMENTS.find((s) => s.key === param(sp.segment))?.key ?? "") as Segment;
  const page = pageParam(sp.page);
  const supabase = await createClient();

  let query = supabase.from("admin_users").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (segment === "admin") query = query.eq("is_admin", true);
  else {
    query = query.eq("is_admin", false);
    if (segment) query = query.eq("segment", segment);
  }
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);

  const count = (s: string) =>
    supabase.from("admin_users").select("id", { count: "exact", head: true }).eq("is_admin", false).eq("segment", s).then((r) => r.count ?? 0);
  const [{ data: users, count: total }, subscribed, free, expired] = await Promise.all([
    query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1).returns<AdminUserRow[]>(),
    count("abonne"),
    count("gratuit"),
    count("expire"),
  ]);
  const counts: Record<string, number | undefined> = { "": subscribed + free + expired, abonne: subscribed, gratuit: free, expire: expired };
  const href = (params: { page?: number; segment?: string }) =>
    buildHref("/admin/utilisateurs", { q, segment: params.segment ?? segment, page: params.page });

  return (
    <div className="space-y-5">
      <PageHeader title="Utilisateurs" description="Comptes, abonnements et CV de chaque utilisateur.">
        <ExportLink href={buildHref("/admin/utilisateurs/export", { q, segment })} />
      </PageHeader>

      {sp.supprime === "1" && (
        <p role="status" className="rounded-xl border border-brand-600/30 bg-brand-50 px-4 py-3 text-sm text-brand-800">Le compte a été supprimé définitivement.</p>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          active={segment}
          items={SEGMENTS.map((s) => ({ key: s.key, label: s.label, href: href({ segment: s.key, page: 1 }), count: counts[s.key] }))}
        />
        <SearchBox action="/admin/utilisateurs" q={q} placeholder="Nom, e-mail, téléphone, ville…" hidden={{ segment }} />
      </div>

      {/* Mobile : cartes */}
      <ul className="space-y-2 md:hidden">
        {users?.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/utilisateurs/${u.id}`} className="card flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold">{initials(u.full_name || u.email || "?")}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{u.full_name || "Sans nom"}</span>
                <span className="block truncate text-xs text-muted">{u.email ?? u.phone ?? "—"}</span>
                <span className="mt-1 flex items-center gap-2 text-xs">
                  <SegmentBadge row={u} />
                  <span className="text-muted">{u.cv_count} CV</span>
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      {/* Écran large : tableau */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Inscription</th>
              <th className="px-4 py-3 text-center font-medium">CV</th>
              <th className="px-4 py-3 font-medium">Abonnement</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-xs font-semibold">{initials(u.full_name || u.email || "?")}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-medium hover:text-brand-700">
                        {u.full_name || "Sans nom"}
                        {u.is_admin && <ShieldCheck aria-label="Administrateur" className="size-3.5 text-brand-600" />}
                      </span>
                      <span className="block max-w-64 truncate text-xs text-muted">{u.email ?? "—"}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">{u.phone ?? "—"}</td>
                <td className="px-4 py-2.5">{u.city ?? "—"}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatShortDate(u.created_at)}</td>
                <td className="px-4 py-2.5 text-center">{u.cv_count}</td>
                <td className="px-4 py-2.5"><SegmentBadge row={u} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!users?.length && <p className="card p-10 text-center text-sm text-muted">Aucun utilisateur{q ? ` pour « ${q} »` : ""}.</p>}

      <Pagination page={page} perPage={PER_PAGE} total={total ?? 0} href={(p) => href({ page: p })} />
    </div>
  );
}
