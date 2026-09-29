import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cancelSubscriptionAdmin, movePlan } from "@/app/actions/admin";
import { formatDate, formatNumber, param } from "@/lib/format";
import { SubscriptionBadge } from "@/components/status-badge";
import type { Plan, Subscription } from "@/lib/types";
import { PlanEditor } from "./plan-editor";

export const metadata: Metadata = { title: "Abonnements" };

const TABS = [
  { key: "", label: "Plans" },
  { key: "actifs", label: "Actifs" },
  { key: "expires", label: "Expirés" },
  { key: "annules", label: "Annulés" },
];

type SubRow = Subscription & { plan: { name: string } | null; profile: { full_name: string } | null };

export default async function AdminPlansPage(props: PageProps<"/admin/plans">) {
  const sp = await props.searchParams;
  const tab = param(sp.onglet);
  const supabase = await createClient();

  const { data: plans } = await supabase.from("plans").select("*").order("position").returns<Plan[]>();
  const selectedId = param(sp.plan);
  const selected = selectedId === "nouveau" ? null : plans?.find((p) => p.id === selectedId) ?? plans?.[0] ?? null;

  let subs: SubRow[] = [];
  if (tab) {
    const now = new Date().toISOString();
    let q = supabase
      .from("subscriptions")
      .select("*, plan:plans(name), profile:profiles(full_name)")
      .order("expires_at", { ascending: false })
      .limit(100);
    if (tab === "actifs") q = q.eq("status", "active").gt("expires_at", now);
    if (tab === "annules") q = q.eq("status", "cancelled");
    if (tab === "expires") q = q.or(`status.eq.expired,expires_at.lte.${now}`);
    subs = (await q.returns<SubRow[]>()).data ?? [];
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Abonnements</h1>
        {TABS.map((t) => (
          <Link key={t.key} href={t.key ? `/admin/plans?onglet=${t.key}` : "/admin/plans"} className={`chip ${tab === t.key ? "chip-active" : ""}`}>
            {t.label}
          </Link>
        ))}
        <Link href="/admin/paiements" className="chip">Paiements</Link>
        <Link href="/admin/plans?plan=nouveau" className="btn-primary">+ Créer un plan</Link>
      </div>

      {tab ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b-2 border-ink text-left text-xs">
                <th className="px-4 py-3">Abonné</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Échéance</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const active = s.status !== "expired" && new Date(s.expires_at) > new Date();
                return (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2 font-medium">{s.profile?.full_name || "—"}</td>
                    <td className="px-4 py-2">{s.plan?.name}</td>
                    <td className="px-4 py-2">{formatDate(s.started_at)}</td>
                    <td className="px-4 py-2">{formatDate(s.expires_at)}</td>
                    <td className="px-4 py-2"><SubscriptionBadge active={active} cancelled={s.status === "cancelled"} /></td>
                    <td className="px-4 py-2 text-right">
                      {active && s.status === "active" && (
                        <form action={cancelSubscriptionAdmin.bind(null, s.id)}>
                          <button type="submit" className="text-xs underline">Ne pas renouveler</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!subs.length && <p className="p-8 text-center text-sm text-muted">Aucun abonnement.</p>}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <p className="text-xs text-muted">Ordre d&apos;affichage</p>
            {plans?.map((p, i) => (
              <div key={p.id} className={`card flex items-center gap-2 p-3 ${selected?.id === p.id ? "border-2 border-ink" : ""}`}>
                <div className="flex flex-col">
                  <form action={movePlan.bind(null, p.id, "up")}>
                    <button type="submit" disabled={i === 0} aria-label={`Monter ${p.name}`} className="px-1 text-xs disabled:opacity-30">▲</button>
                  </form>
                  <form action={movePlan.bind(null, p.id, "down")}>
                    <button type="submit" disabled={i === plans.length - 1} aria-label={`Descendre ${p.name}`} className="px-1 text-xs disabled:opacity-30">▼</button>
                  </form>
                </div>
                <Link href={`/admin/plans?plan=${p.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-xs text-muted">{formatNumber(p.price)} FCFA / mois</span>
                </Link>
                <span className="text-xs text-muted">{p.is_available ? "actif" : "masqué"}</span>
              </div>
            ))}
          </div>
          <PlanEditor key={selected?.id ?? "nouveau"} plan={selected} />
        </div>
      )}
    </div>
  );
}
