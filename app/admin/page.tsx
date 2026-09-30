import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso, formatNumber, formatRelative, param } from "@/lib/format";
import { ColumnChart, DataTable, LineChart, type Point } from "@/components/charts";
import { PaymentBadge } from "@/components/status-badge";
import type { PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Tableau de bord" };

const PERIODS = [7, 30, 90] as const;
const DAY = 86_400_000;

function buckets(days: number) {
  // ≤ 30 jours : un point par jour ; au-delà : par semaine
  const size = days > 30 ? 7 : 1;
  const count = Math.ceil(days / size);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return Array.from({ length: count }, (_, i) => {
    const to = new Date(end.getTime() - (count - 1 - i) * size * DAY);
    const from = new Date(to.getTime() - size * DAY);
    return { from, to, label: to.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) };
  });
}

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const days = PERIODS.find((p) => String(p) === param(sp.periode)) ?? 30;
  const since = daysAgoIso(days);
  const now = daysAgoIso(0);

  const supabase = await createClient();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [toReview, users, activeSubs, activeJobs, applications, payments, subs, newUsers, lastApps, lastPayments, lastUsers] = await Promise.all([
    count(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending").eq("provider", "orange_money")),
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", false)),
    count(supabase.from("subscriptions").select("id", { count: "exact", head: true }).neq("status", "expired").gt("expires_at", now)),
    count(supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "publie").lte("published_at", now)),
    count(supabase.from("applications").select("id", { count: "exact", head: true }).gte("created_at", since)),
    supabase.from("payments").select("amount, status, paid_at, created_at").gte("created_at", since).limit(10000)
      .returns<{ amount: number; status: PaymentStatus; paid_at: string | null; created_at: string }[]>(),
    supabase.from("subscriptions").select("started_at, expires_at, status").gte("expires_at", since).limit(10000)
      .returns<{ started_at: string; expires_at: string; status: string }[]>(),
    supabase.from("profiles").select("created_at").eq("is_admin", false).gte("created_at", since).limit(10000)
      .returns<{ created_at: string }[]>(),
    supabase.from("applications").select("id, full_name, created_at, job:jobs(title)").order("created_at", { ascending: false }).limit(5)
      .returns<{ id: string; full_name: string; created_at: string; job: { title: string } | null }[]>(),
    supabase.from("payments").select("id, reference, amount, status, created_at").order("created_at", { ascending: false }).limit(5)
      .returns<{ id: string; reference: string; amount: number; status: PaymentStatus; created_at: string }[]>(),
    supabase.from("profiles").select("id, full_name, created_at").eq("is_admin", false).order("created_at", { ascending: false }).limit(5)
      .returns<{ id: string; full_name: string; created_at: string }[]>(),
  ]);

  const paid = (payments.data ?? []).filter((p) => p.status === "paid");
  const revenue = paid.reduce((n, p) => n + p.amount, 0);
  const b = buckets(days);
  const inBucket = (iso: string | null, from: Date, to: Date) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t > from.getTime() && t <= to.getTime();
  };

  const subsSeries: Point[] = b.map(({ to, label }) => ({
    label,
    value: (subs.data ?? []).filter((s) => new Date(s.started_at) <= to && new Date(s.expires_at) > to).length,
  }));
  const revenueSeries: Point[] = b.map(({ from, to, label }) => ({
    label,
    value: paid.filter((p) => inBucket(p.paid_at ?? p.created_at, from, to)).reduce((n, p) => n + p.amount, 0),
  }));
  const usersSeries: Point[] = b.map(({ from, to, label }) => ({
    label,
    value: (newUsers.data ?? []).filter((u) => inBucket(u.created_at, from, to)).length,
  }));

  const kpis = [
    { label: "Utilisateurs", value: formatNumber(users) },
    { label: "Abonnés actifs", value: formatNumber(activeSubs) },
    { label: "Offres actives", value: formatNumber(activeJobs) },
    { label: `Candidatures (${days} j)`, value: formatNumber(applications) },
    { label: `Revenus (${days} j)`, value: `${formatNumber(revenue)} FCFA` },
    { label: `Paiements réussis (${days} j)`, value: formatNumber(paid.length) },
  ];
  const step = days > 30 ? "par semaine" : "par jour";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Tableau de bord</h1>
        {PERIODS.map((p) => (
          <Link key={p} href={p === 30 ? "/admin" : `/admin?periode=${p}`} className={`chip ${days === p ? "chip-active" : ""}`}>
            {p} derniers jours
          </Link>
        ))}
        <Link href="/admin/offres/nouvelle" className="btn-primary">+ Nouvelle offre</Link>
      </div>

      {toReview > 0 && (
        <Link
          href="/admin/paiements"
          className="flex items-center gap-3 rounded-2xl border-2 border-[#ff7900] bg-[#ff7900]/10 px-5 py-4 text-sm font-medium hover:bg-[#ff7900]/15"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[#ff7900] font-bold text-white">{toReview}</span>
          {toReview > 1 ? "dépôts Orange Money attendent" : "dépôt Orange Money attend"} votre vérification
          <span className="ml-auto underline">Vérifier →</span>
        </Link>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <dt className="text-xs text-muted">{k.label}</dt>
            <dd className="mt-1 text-xl font-semibold">{k.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr]">
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Abonnements actifs</h2>
          <p className="mb-2 text-xs text-muted">Nombre d&apos;abonnés actifs, {step}</p>
          <LineChart points={subsSeries} ariaLabel="Évolution du nombre d'abonnés actifs" />
          <DataTable points={subsSeries} />
        </section>
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Revenus</h2>
          <p className="mb-2 text-xs text-muted">FCFA encaissés, {step}</p>
          <ColumnChart points={revenueSeries} unit="FCFA" ariaLabel="Revenus encaissés" />
          <DataTable points={revenueSeries} unit="FCFA" />
        </section>
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Nouveaux utilisateurs</h2>
          <p className="mb-2 text-xs text-muted">Inscriptions, {step}</p>
          <ColumnChart points={usersSeries} ariaLabel="Nouveaux utilisateurs" />
          <DataTable points={usersSeries} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-4">
          <div className="mb-2 flex items-center"><h2 className="flex-1 text-sm font-semibold">Dernières candidatures</h2><Link href="/admin/candidatures" className="text-xs underline">Tout voir</Link></div>
          <ul className="space-y-2 text-sm">
            {lastApps.data?.map((a) => (
              <li key={a.id} className="flex gap-2"><span className="flex-1 truncate">{a.full_name} · <span className="text-muted">{a.job?.title}</span></span><span className="text-xs text-muted">{formatRelative(a.created_at)}</span></li>
            ))}
            {!lastApps.data?.length && <li className="text-muted">Aucune.</li>}
          </ul>
        </section>
        <section className="card p-4">
          <div className="mb-2 flex items-center"><h2 className="flex-1 text-sm font-semibold">Derniers paiements</h2><Link href="/admin/paiements" className="text-xs underline">Tout voir</Link></div>
          <ul className="space-y-2 text-sm">
            {lastPayments.data?.map((p) => (
              <li key={p.id} className="flex items-center gap-2"><span className="flex-1 truncate font-mono text-xs">{p.reference}</span><span>{formatNumber(p.amount)}</span><PaymentBadge status={p.status} /></li>
            ))}
            {!lastPayments.data?.length && <li className="text-muted">Aucun.</li>}
          </ul>
        </section>
        <section className="card p-4">
          <div className="mb-2 flex items-center"><h2 className="flex-1 text-sm font-semibold">Derniers utilisateurs</h2><Link href="/admin/candidats" className="text-xs underline">Tout voir</Link></div>
          <ul className="space-y-2 text-sm">
            {lastUsers.data?.map((u) => (
              <li key={u.id} className="flex gap-2"><Link href={`/admin/candidats/${u.id}`} className="flex-1 truncate hover:text-brand-700">{u.full_name || "—"}</Link><span className="text-xs text-muted">inscrit {formatRelative(u.created_at)}</span></li>
            ))}
            {!lastUsers.data?.length && <li className="text-muted">Aucun.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
