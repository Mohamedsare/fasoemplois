import { Bot, CalendarClock, Crown, FileDown, FileText, MessageCircle, TrendingUp, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { CV_TEMPLATES } from "@/lib/constants";
import { daysAgoIso, formatNumber, formatRelative, formatShortDate, param, whatsappLink } from "@/lib/format";
import { ColumnChart, DataTable, LineChart, type Point } from "@/components/charts";
import { PaymentBadge } from "@/components/status-badge";
import type { CvTemplate, PaymentStatus } from "@/lib/types";
import { FilterChips, PageHeader, StatCard } from "./ui";

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

type Expiring = {
  id: string;
  user_id: string;
  expires_at: string;
  status: string;
  plan: { name: string } | null;
  profile: { full_name: string; first_name: string; phone: string | null } | null;
};

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const sp = await props.searchParams;
  const days = PERIODS.find((p) => String(p) === param(sp.periode)) ?? 30;
  const since = daysAgoIso(days);
  const now = daysAgoIso(0);
  const in7 = daysAgoIso(-7);

  const supabase = await createClient();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [toReview, users, cvCount, cvNew, aiRequests, pdfCount, active, payments, subs, newUsers, expiring, templates, lastPayments, lastUsers] = await Promise.all([
    count(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending").eq("provider", "orange_money")),
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", false)),
    count(supabase.from("cvs").select("id", { count: "exact", head: true })),
    count(supabase.from("cvs").select("id", { count: "exact", head: true }).gte("created_at", since)),
    count(supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", since)),
    count(supabase.from("pdf_downloads").select("id", { count: "exact", head: true }).gte("created_at", since)),
    supabase.from("subscriptions").select("plan:plans(price)").neq("status", "expired").gt("expires_at", now).limit(10000)
      .returns<{ plan: { price: number } | null }[]>(),
    supabase.from("payments").select("amount, status, paid_at, created_at").gte("created_at", since).limit(10000)
      .returns<{ amount: number; status: PaymentStatus; paid_at: string | null; created_at: string }[]>(),
    supabase.from("subscriptions").select("started_at, expires_at, status").gte("expires_at", since).limit(10000)
      .returns<{ started_at: string; expires_at: string; status: string }[]>(),
    supabase.from("profiles").select("created_at").eq("is_admin", false).gte("created_at", since).limit(10000)
      .returns<{ created_at: string }[]>(),
    supabase
      .from("subscriptions")
      .select("id, user_id, expires_at, status, plan:plans(name), profile:profiles(full_name, first_name, phone)")
      .neq("status", "expired")
      .gt("expires_at", now)
      .lte("expires_at", in7)
      .order("expires_at")
      .limit(20)
      .returns<Expiring[]>(),
    supabase.from("cvs").select("template").limit(50000).returns<{ template: CvTemplate }[]>(),
    supabase.from("payments").select("id, reference, amount, status, created_at, user_id").order("created_at", { ascending: false }).limit(6)
      .returns<{ id: string; reference: string; amount: number; status: PaymentStatus; created_at: string; user_id: string }[]>(),
    supabase.from("profiles").select("id, full_name, email, created_at").eq("is_admin", false).order("created_at", { ascending: false }).limit(6)
      .returns<{ id: string; full_name: string; email: string | null; created_at: string }[]>(),
  ]);

  const activeSubs = active.data ?? [];
  const mrr = activeSubs.reduce((n, s) => n + (s.plan?.price ?? 0), 0);
  const conversion = users ? Math.round((activeSubs.length / users) * 1000) / 10 : 0;
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

  const popular = CV_TEMPLATES.map((t) => ({ ...t, count: (templates.data ?? []).filter((c) => c.template === t.value).length }))
    .sort((a, b2) => b2.count - a.count)
    .slice(0, 5);
  const maxPopular = Math.max(1, ...popular.map((t) => t.count));
  const step = days > 30 ? "par semaine" : "par jour";

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description={`Vue d'ensemble de ${BRAND.name}.`}>
        <FilterChips
          active={String(days)}
          items={PERIODS.map((p) => ({ key: String(p), label: `${p} jours`, href: p === 30 ? "/admin" : `/admin?periode=${p}` }))}
        />
      </PageHeader>

      {toReview > 0 && (
        <Link
          href="/admin/paiements"
          className="flex items-center gap-3 rounded-2xl border-2 border-[#ff7900] bg-[#ff7900]/10 px-5 py-4 text-sm font-medium hover:bg-[#ff7900]/15"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ff7900] font-bold text-white">{toReview}</span>
          {toReview > 1 ? "dépôts Orange Money attendent" : "dépôt Orange Money attend"} votre vérification
          <span className="ml-auto underline">Vérifier →</span>
        </Link>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Utilisateurs" icon={Users} value={formatNumber(users)} hint={`+${formatNumber(newUsers.data?.length ?? 0)} sur ${days} jours`} href="/admin/utilisateurs" />
        <StatCard label="Abonnés actifs" icon={Crown} tone="brand" value={formatNumber(activeSubs.length)} hint={`${String(conversion).replace(".", ",")} % des utilisateurs`} href="/admin/utilisateurs?segment=abonne" />
        <StatCard label="Revenu mensuel récurrent" icon={TrendingUp} tone="brand" value={`${formatNumber(mrr)} FCFA`} hint="abonnements actifs × prix du plan" />
        <StatCard label={`Encaissé (${days} j)`} icon={Wallet} value={`${formatNumber(revenue)} FCFA`} hint={`${formatNumber(paid.length)} paiement(s) validé(s)`} href="/admin/paiements?statut=paid" />
        <StatCard label="CV créés" icon={FileText} value={formatNumber(cvCount)} hint={`+${formatNumber(cvNew)} sur ${days} jours`} href="/admin/cv" />
        <StatCard label={`PDF téléchargés (${days} j)`} icon={FileDown} value={formatNumber(pdfCount)} href="/admin/cv" />
        <StatCard label={`Demandes IA (${days} j)`} icon={Bot} value={formatNumber(aiRequests)} hint={users ? `${String(Math.round((aiRequests / users) * 10) / 10).replace(".", ",")} par utilisateur` : undefined} />
        <StatCard label="Expirent sous 7 jours" icon={CalendarClock} tone={expiring.data?.length ? "warn" : "default"} value={formatNumber(expiring.data?.length ?? 0)} hint="abonnements à relancer" />
      </dl>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] [&>section]:min-w-0">
        <section className="card p-4">
          <h2 className="text-sm font-semibold">Abonnés actifs</h2>
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
          <h2 className="text-sm font-semibold">Inscriptions</h2>
          <p className="mb-2 text-xs text-muted">Nouveaux utilisateurs, {step}</p>
          <ColumnChart points={usersSeries} ariaLabel="Nouveaux utilisateurs" />
          <DataTable points={usersSeries} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex-1 text-sm font-semibold">Abonnements qui expirent sous 7 jours</h2>
            <Link href="/admin/plans?onglet=bientot" className="text-xs underline">Tout voir</Link>
          </div>
          <ul className="divide-y divide-line text-sm">
            {expiring.data?.map((s) => {
              const wa = whatsappLink(
                s.profile?.phone,
                `Bonjour${s.profile?.first_name ? ` ${s.profile.first_name}` : ""}, votre abonnement ${BRAND.name} (${s.plan?.name ?? ""}) se termine le ${formatShortDate(s.expires_at)}. Renouvelez-le sur ${BRAND.domain}/abonnements pour continuer à télécharger vos CV en PDF.`,
              );
              return (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <Link href={`/admin/utilisateurs/${s.user_id}`} className="block truncate font-medium hover:text-brand-700">{s.profile?.full_name || "—"}</Link>
                    <span className="text-xs text-muted">{s.plan?.name} · fin le {formatShortDate(s.expires_at)}{s.status === "cancelled" && " · non renouvelé"}</span>
                  </span>
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn border border-[#25d366] bg-[#25d366]/10 px-3 py-1.5 text-xs text-ink hover:bg-[#25d366]/20">
                      <MessageCircle aria-hidden className="size-3.5" /> Relancer
                    </a>
                  ) : (
                    <span className="text-xs text-muted">pas de téléphone</span>
                  )}
                </li>
              );
            })}
            {!expiring.data?.length && <li className="py-2 text-muted">Aucun abonnement n&apos;expire cette semaine.</li>}
          </ul>
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex-1 text-sm font-semibold">Modèles les plus utilisés</h2>
            <Link href="/admin/cv" className="text-xs underline">Détails</Link>
          </div>
          <ul className="space-y-2.5 text-sm">
            {popular.map((t) => (
              <li key={t.value} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
                <span className="flex items-center gap-1 truncate">
                  {t.label}
                  {t.premium && <Crown aria-label="Premium" className="size-3.5 shrink-0 text-star-400" />}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
                  <span className={`block h-full rounded-full ${t.premium ? "bg-ink" : "bg-brand-600"}`} style={{ width: `${(t.count / maxPopular) * 100}%` }} />
                </span>
                <span className="text-right text-muted tabular-nums">{formatNumber(t.count)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <div className="mb-3 flex items-center"><h2 className="flex-1 text-sm font-semibold">Derniers paiements</h2><Link href="/admin/paiements" className="text-xs underline">Tout voir</Link></div>
          <ul className="divide-y divide-line text-sm">
            {lastPayments.data?.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <Link href={`/admin/utilisateurs/${p.user_id}`} className="flex-1 truncate font-mono text-xs hover:text-brand-700">{p.reference}</Link>
                <span className="text-xs text-muted">{formatRelative(p.created_at)}</span>
                <span className="w-24 text-right whitespace-nowrap">{formatNumber(p.amount)} F</span>
                <PaymentBadge status={p.status} />
              </li>
            ))}
            {!lastPayments.data?.length && <li className="py-2 text-muted">Aucun.</li>}
          </ul>
        </section>
        <section className="card p-4">
          <div className="mb-3 flex items-center"><h2 className="flex-1 text-sm font-semibold">Derniers inscrits</h2><Link href="/admin/utilisateurs" className="text-xs underline">Tout voir</Link></div>
          <ul className="divide-y divide-line text-sm">
            {lastUsers.data?.map((u) => (
              <li key={u.id} className="flex items-center gap-2 py-2">
                <Link href={`/admin/utilisateurs/${u.id}`} className="min-w-0 flex-1 hover:text-brand-700">
                  <span className="block truncate font-medium">{u.full_name || "Sans nom"}</span>
                  <span className="block truncate text-xs text-muted">{u.email}</span>
                </Link>
                <span className="text-xs text-muted">{formatRelative(u.created_at)}</span>
              </li>
            ))}
            {!lastUsers.data?.length && <li className="py-2 text-muted">Aucun.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
