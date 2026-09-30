import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ACTION_LABELS, formatLogDetails } from "@/lib/admin-log";
import { formatDateTime, formatRelative, param } from "@/lib/format";
import type { AdminLog } from "@/lib/types";
import { FilterChips, PageHeader, Pagination, buildHref, pageParam } from "../ui";

export const metadata: Metadata = { title: "Journal" };

const PER_PAGE = 40;

const GROUPS = [
  { key: "", label: "Tout", actions: [] as string[] },
  { key: "paiements", label: "Paiements", actions: ["payment_approved", "payment_rejected"] },
  { key: "abonnements", label: "Abonnements", actions: ["subscription_granted", "subscription_revoked", "subscription_not_renewed"] },
  { key: "comptes", label: "Comptes", actions: ["admin_granted", "admin_revoked", "user_deleted", "ai_quota_reset"] },
];

type Row = AdminLog & { admin: { full_name: string } | null; user: { full_name: string; email: string | null } | null };

export default async function AdminJournalPage(props: PageProps<"/admin/journal">) {
  const sp = await props.searchParams;
  const group = GROUPS.find((g) => g.key === param(sp.type)) ?? GROUPS[0];
  const page = pageParam(sp.page);
  const supabase = await createClient();

  let query = supabase
    .from("admin_logs")
    .select("*, admin:profiles!admin_logs_admin_id_fkey(full_name), user:profiles!admin_logs_user_id_fkey(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (group.actions.length) query = query.in("action", group.actions);
  const { data: logs, count } = await query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1).returns<Row[]>();

  return (
    <div className="space-y-5">
      <PageHeader title="Journal" description="Toutes les actions réalisées par les administrateurs : qui, quoi, quand." />
      <FilterChips active={group.key} items={GROUPS.map((g) => ({ key: g.key, label: g.label, href: buildHref("/admin/journal", { type: g.key }) }))} />

      <ol className="card divide-y divide-line">
        {logs?.map((l) => {
          const details = formatLogDetails(l.details);
          const deletedName = typeof l.details.name === "string" ? l.details.name : null;
          return (
            <li key={l.id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-start sm:gap-4">
              <time dateTime={l.created_at} title={formatDateTime(l.created_at)} className="w-32 shrink-0 text-xs text-muted sm:pt-0.5">
                {formatRelative(l.created_at)}
              </time>
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-semibold">{ADMIN_ACTION_LABELS[l.action] ?? l.action}</span>
                  {l.user_id ? (
                    <>
                      {" · "}
                      <Link href={`/admin/utilisateurs/${l.user_id}`} className="underline hover:text-brand-700">{l.user?.full_name || l.user?.email || "utilisateur"}</Link>
                    </>
                  ) : (
                    deletedName && <span className="text-muted"> · {deletedName}</span>
                  )}
                </p>
                {details && <p className="text-xs text-muted">{details}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted">par {l.admin?.full_name || "un admin"}</span>
            </li>
          );
        })}
        {!logs?.length && <li className="p-10 text-center text-sm text-muted">Aucune action enregistrée pour le moment.</li>}
      </ol>
      <Pagination page={page} perPage={PER_PAGE} total={count ?? 0} href={(n) => buildHref("/admin/journal", { type: group.key, page: n })} />
    </div>
  );
}
