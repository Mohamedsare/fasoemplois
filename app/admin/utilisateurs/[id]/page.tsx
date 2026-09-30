import { ArrowLeft, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso, formatDate, formatNumber, formatShortDate } from "@/lib/format";
import { PaymentBadge, SubscriptionBadge } from "@/components/status-badge";
import type { Cv, Payment, Plan, Profile, Subscription } from "@/lib/types";

export const metadata: Metadata = { title: "Fiche utilisateur" };

export default async function AdminUserPage(props: PageProps<"/admin/utilisateurs/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const since = daysAgoIso(30);

  const [{ data: profile }, { data: cvs }, { data: subs }, { data: payments }, { count: aiCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    supabase
      .from("cvs")
      .select("id, title, template, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false })
      .returns<Pick<Cv, "id" | "title" | "template" | "updated_at">[]>(),
    supabase
      .from("subscriptions")
      .select("*, plan:plans(name, cv_limit)")
      .eq("user_id", id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .returns<(Subscription & { plan: Pick<Plan, "name" | "cv_limit"> | null })[]>(),
    supabase
      .from("payments")
      .select("*, plan:plans(name)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .returns<(Payment & { plan: { name: string } | null })[]>(),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", id).gte("created_at", since),
  ]);
  if (!profile) notFound();

  const sub = subs?.[0];
  const active = Boolean(sub && sub.status !== "expired" && new Date(sub.expires_at) > new Date());

  return (
    <div className="space-y-6">
      <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Utilisateurs
      </Link>
      <div className="card space-y-2 p-6">
        <h1 className="text-2xl font-bold">{profile.full_name || "Sans nom"}</h1>
        <p className="text-sm text-muted">{[profile.headline, profile.city, profile.phone].filter(Boolean).join(" · ") || "—"}</p>
        <p className="text-xs text-muted">Inscrit le {formatDate(profile.created_at)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <dt className="text-xs text-muted">Abonnement</dt>
          <dd className="mt-1 space-y-1">
            {sub ? <SubscriptionBadge active={active} cancelled={sub.status === "cancelled"} /> : <span className="text-sm">Gratuit</span>}
            {sub?.plan && <p className="text-xs text-muted">{sub.plan.name} · jusqu&apos;au {formatShortDate(sub.expires_at)}</p>}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs text-muted">CV créés</dt>
          <dd className="mt-1 text-xl font-semibold">{cvs?.length ?? 0}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs text-muted">Demandes IA (30 j)</dt>
          <dd className="mt-1 text-xl font-semibold">{formatNumber(aiCount ?? 0)}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs text-muted">Paiements réussis</dt>
          <dd className="mt-1 text-xl font-semibold">{payments?.filter((p) => p.status === "paid").length ?? 0}</dd>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">CV</h2>
          <ul className="space-y-2 text-sm">
            {cvs?.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="flex-1 truncate">{c.title}</span>
                <span className="text-xs text-muted">{c.template} · {formatShortDate(c.updated_at)}</span>
                <Link href={`/cv/${c.id}/apercu`} target="_blank" className="rounded-full p-1.5 hover:bg-surface" aria-label={`Voir ${c.title}`}>
                  <Eye aria-hidden className="size-4" />
                </Link>
              </li>
            ))}
            {!cvs?.length && <li className="text-muted">Aucun CV.</li>}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Paiements</h2>
          <ul className="space-y-2 text-sm">
            {payments?.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="font-mono text-xs">{p.reference}</span>
                <span className="flex-1 text-muted">{p.plan?.name} · {formatNumber(p.amount)} FCFA</span>
                <PaymentBadge status={p.status} />
              </li>
            ))}
            {!payments?.length && <li className="text-muted">Aucun.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
