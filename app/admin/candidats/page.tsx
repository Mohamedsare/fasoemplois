import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatShortDate, param, sanitizeSearch } from "@/lib/format";
import { SubscriptionBadge } from "@/components/status-badge";
import type { Profile, Subscription } from "@/lib/types";

export const metadata: Metadata = { title: "Candidats" };

type Row = Profile & {
  subscriptions: Pick<Subscription, "status" | "expires_at">[];
  applications: { count: number }[];
};

export default async function AdminCandidatesPage(props: PageProps<"/admin/candidats">) {
  const sp = await props.searchParams;
  const q = sanitizeSearch(param(sp.q));
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*, subscriptions(status, expires_at), applications(count)", { count: "exact" })
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
  const { data: users, count } = await query.returns<Row[]>();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Candidats <span className="text-base font-normal text-muted">({count ?? 0})</span></h1>
      <Form action="/admin/candidats" className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nom, téléphone, ville…" aria-label="Rechercher" className="input max-w-xs rounded-full" />
        <button type="submit" className="btn-dark">Rechercher</button>
      </Form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-left text-xs">
              <th className="px-4 py-3">Nom</th><th className="px-4 py-3">Titre</th><th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Inscrit le</th><th className="px-4 py-3">Candidatures</th><th className="px-4 py-3">Abonnement</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => {
              const latest = [...u.subscriptions].sort((a, b) => b.expires_at.localeCompare(a.expires_at))[0];
              const active = latest && latest.status !== "expired" && new Date(latest.expires_at) > new Date();
              return (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/admin/candidats/${u.id}`} className="hover:text-brand-700">{u.full_name || "—"}</Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{u.headline ?? "—"}</td>
                  <td className="px-4 py-2">{u.city ?? "—"}</td>
                  <td className="px-4 py-2">{formatShortDate(u.created_at)}</td>
                  <td className="px-4 py-2">{u.applications[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">{latest ? <SubscriptionBadge active={Boolean(active)} cancelled={latest.status === "cancelled"} /> : <span className="text-muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!users?.length && <p className="p-8 text-center text-sm text-muted">Aucun candidat.</p>}
      </div>
    </div>
  );
}
