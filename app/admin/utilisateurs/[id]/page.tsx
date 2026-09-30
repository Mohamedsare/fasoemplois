import { ArrowLeft, Bot, Crown, Eye, FileDown, FileText, Mail, MessageCircle, Phone, ShieldCheck, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { ADMIN_ACTION_LABELS, formatLogDetails } from "@/lib/admin-log";
import { AI_DAILY_LIMIT, FREE_CV_LIMIT } from "@/lib/constants";
import { getTemplateCatalog } from "@/lib/template-catalog";
import { daysAgoIso, formatDate, formatDateTime, formatNumber, formatRelative, formatShortDate, initials, nowTime, whatsappLink } from "@/lib/format";
import { PaymentBadge, SubscriptionBadge } from "@/components/status-badge";
import { TemplateBadge } from "@/components/template-card";
import type { AdminLog, Cv, Payment, Plan, Profile, Subscription } from "@/lib/types";
import { StatCard } from "../../ui";
import { GrantSubscriptionForm, UserQuickActions } from "./user-actions";

export const metadata: Metadata = { title: "Fiche utilisateur" };

type SubRow = Subscription & { plan: Pick<Plan, "name" | "cv_limit"> | null };
type PaymentRow = Payment & { plan: { name: string } | null };
type LogRow = AdminLog & { admin: { full_name: string } | null };

export default async function AdminUserPage(props: PageProps<"/admin/utilisateurs/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profile }, { data: cvs }, { data: subs }, { data: payments }, ai24, ai30, pdfs, { data: logs }, { data: plans }, authUser] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    supabase
      .from("cvs")
      .select("id, title, template, full_name, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false })
      .returns<Pick<Cv, "id" | "title" | "template" | "full_name" | "updated_at">[]>(),
    supabase.from("subscriptions").select("*, plan:plans(name, cv_limit)").eq("user_id", id).order("expires_at", { ascending: false }).returns<SubRow[]>(),
    supabase.from("payments").select("*, plan:plans(name)").eq("user_id", id).order("created_at", { ascending: false }).returns<PaymentRow[]>(),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", daysAgoIso(1)),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", daysAgoIso(30)),
    supabase.from("pdf_downloads").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase
      .from("admin_logs")
      .select("*, admin:profiles!admin_logs_admin_id_fkey(full_name)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<LogRow[]>(),
    supabase.from("plans").select("id, name, price, is_available").order("position").returns<Pick<Plan, "id" | "name" | "price" | "is_available">[]>(),
    createAdminClient().auth.admin.getUserById(id).then((r) => r.data.user),
  ]);
  if (!profile) notFound();

  const now = nowTime();
  const current = subs?.find((s) => s.status !== "expired" && new Date(s.expires_at).getTime() > now) ?? null;
  // Les administrateurs ont accès à tout sans abonnement
  const cvLimit = profile.is_admin ? "∞" : current?.plan?.cv_limit ?? FREE_CV_LIMIT;
  const aiLimit = profile.is_admin ? "∞" : current ? AI_DAILY_LIMIT.subscribed : AI_DAILY_LIMIT.free;
  const totalPaid = (payments ?? []).filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0);
  const providers = (authUser?.app_metadata?.providers as string[] | undefined) ?? [authUser?.app_metadata?.provider].filter(Boolean);
  const name = profile.full_name || profile.email || "Cet utilisateur";
  const wa = whatsappLink(profile.phone, `Bonjour${profile.first_name ? ` ${profile.first_name}` : ""}, c'est l'équipe ${BRAND.name}.`);
  const catalog = await getTemplateCatalog(true);
  const templateLabel = (t: string) => catalog.find((x) => x.value === t);

  return (
    <div className="space-y-6">
      <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Utilisateurs
      </Link>

      {sp.erreur === "suppression" && (
        <p role="alert" className="rounded-xl border border-accent-500/30 bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
          La suppression du compte a échoué. Réessayez.
        </p>
      )}

      {/* Identité */}
      <section className="card flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-cream">{initials(name)}</span>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold">
              {profile.full_name || "Sans nom"}
              {profile.is_admin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  <ShieldCheck aria-hidden className="size-3.5" /> Admin
                </span>
              )}
            </h1>
            <p className="truncate text-sm text-muted">{[profile.headline, profile.city].filter(Boolean).join(" · ") || "—"}</p>
            <p className="mt-1 text-xs text-muted">
              Inscrit le {formatDate(profile.created_at)}
              {providers.length > 0 && ` · via ${providers.map((p) => (p === "google" ? "Google" : "e-mail")).join(" et ")}`}
              {authUser?.last_sign_in_at && ` · dernière connexion ${formatRelative(authUser.last_sign_in_at)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="btn-secondary max-w-full"><Mail aria-hidden className="size-4" /> <span className="truncate">{profile.email}</span></a>
          )}
          {profile.phone && <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="btn-secondary"><Phone aria-hidden className="size-4" /> {profile.phone}</a>}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn border border-[#25d366] bg-[#25d366]/10 text-ink hover:bg-[#25d366]/20">
              <MessageCircle aria-hidden className="size-4" /> WhatsApp
            </a>
          )}
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Abonnement"
          icon={Crown}
          tone={current ? "brand" : "default"}
          value={current ? current.plan?.name ?? "Actif" : "Gratuit"}
          hint={current ? `jusqu'au ${formatShortDate(current.expires_at)}${current.status === "cancelled" ? " · non renouvelé" : ""}` : "sans abonnement actif"}
        />
        <StatCard label="CV" icon={FileText} value={`${cvs?.length ?? 0} / ${cvLimit}`} hint={`${formatNumber(pdfs.count ?? 0)} PDF téléchargé(s)`} />
        <StatCard label="Assistant IA" icon={Bot} value={`${ai24.count ?? 0} / ${aiLimit}`} hint={`aujourd'hui · ${formatNumber(ai30.count ?? 0)} sur 30 jours`} />
        <StatCard label="Total payé" icon={Wallet} value={`${formatNumber(totalPaid)} FCFA`} hint={`${payments?.filter((p) => p.status === "paid").length ?? 0} paiement(s) validé(s)`} />
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-6">
          {/* CV */}
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">CV ({cvs?.length ?? 0})</h2>
            <ul className="divide-y divide-line">
              {cvs?.map((c) => {
                const t = templateLabel(c.template);
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{c.title}</span>
                      <span className="text-xs text-muted">{c.full_name || "Sans nom"} · modifié {formatRelative(c.updated_at)}</span>
                    </span>
                    {t && <span className="text-xs text-muted">{t.label}</span>}
                    {t && <TemplateBadge premium={t.premium} />}
                    <Link href={`/cv/${c.id}/apercu`} target="_blank" className="btn-secondary px-3 py-1.5 text-xs"><Eye aria-hidden className="size-3.5" /> Aperçu</Link>
                    <a href={`/cv/${c.id}/pdf`} className="btn-secondary px-3 py-1.5 text-xs"><FileDown aria-hidden className="size-3.5" /> PDF</a>
                  </li>
                );
              })}
              {!cvs?.length && <li className="py-3 text-sm text-muted">Aucun CV.</li>}
            </ul>
          </section>

          {/* Paiements */}
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Paiements ({payments?.length ?? 0})</h2>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-140 text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-5 py-2 font-medium">Date</th><th className="px-2 py-2 font-medium">Référence</th><th className="px-2 py-2 font-medium">Plan</th>
                    <th className="px-2 py-2 font-medium">ID transaction</th><th className="px-2 py-2 text-right font-medium">Montant</th><th className="px-5 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                      <td className="px-2 py-2 font-mono text-xs">{p.reference}</td>
                      <td className="px-2 py-2">{p.plan?.name}</td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {p.provider_ref ?? "—"}
                        {p.admin_note && <span className="block font-sans text-accent-600">{p.admin_note}</span>}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">{formatNumber(p.amount)} FCFA</td>
                      <td className="px-5 py-2"><PaymentBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!payments?.length && <p className="px-5 py-3 text-sm text-muted">Aucun paiement.</p>}
            </div>
          </section>

          {/* Abonnements */}
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Historique des abonnements</h2>
            <ul className="divide-y divide-line text-sm">
              {subs?.map((s) => {
                const active = s.status !== "expired" && new Date(s.expires_at).getTime() > now;
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <span className="min-w-0 flex-1 font-medium">{s.plan?.name ?? "—"}</span>
                    <span className="text-xs text-muted">
                      {formatShortDate(s.started_at)} → {formatShortDate(s.expires_at)}
                      {!s.payment_id && " · offert"}
                    </span>
                    <SubscriptionBadge active={active} cancelled={s.status === "cancelled"} />
                  </li>
                );
              })}
              {!subs?.length && <li className="py-3 text-muted">Jamais abonné.</li>}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <div>
              <h2 className="font-semibold">Offrir ou prolonger un abonnement</h2>
              <p className="mt-1 text-xs text-muted">Sans paiement : dépôt reçu hors application, geste commercial, partenariat. Enregistré dans le journal.</p>
            </div>
            <GrantSubscriptionForm
              userId={id}
              plans={(plans ?? []).map((p) => ({ id: p.id, name: p.is_available ? p.name : `${p.name} (masqué)`, price: p.price }))}
              defaultPlanId={current?.plan_id ?? plans?.find((p) => p.is_available)?.id ?? null}
            />
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Actions</h2>
            <UserQuickActions userId={id} name={name} hasActiveSubscription={Boolean(current)} isAdmin={profile.is_admin} isSelf={id === me.id} />
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Journal</h2>
            <ol className="space-y-3 text-sm">
              {logs?.map((l) => (
                <li key={l.id} className="border-l-2 border-line pl-3">
                  <p className="font-medium">{ADMIN_ACTION_LABELS[l.action] ?? l.action}</p>
                  {formatLogDetails(l.details) && <p className="text-xs text-muted">{formatLogDetails(l.details)}</p>}
                  <p className="text-xs text-muted" title={formatDateTime(l.created_at)}>
                    {l.admin?.full_name ?? "Admin"} · {formatRelative(l.created_at)}
                  </p>
                </li>
              ))}
              {!logs?.length && <li className="text-muted">Aucune action d&apos;administration.</li>}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
