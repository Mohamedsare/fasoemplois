import { ArrowLeft, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EXPERIENCE_LABELS } from "@/lib/constants";
import { formatDate, formatNumber, formatShortDate } from "@/lib/format";
import { PaymentBadge, StatusBadge } from "@/components/status-badge";
import type { ApplicationStatus, Cv, CvFile, Payment, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Fiche candidat" };

export default async function AdminCandidatePage(props: PageProps<"/admin/candidats/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();

  const [{ data: profile }, { data: cvs }, { data: files }, { data: apps }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    supabase.from("cvs").select("id, title, updated_at").eq("user_id", id).order("updated_at", { ascending: false }).returns<Pick<Cv, "id" | "title" | "updated_at">[]>(),
    supabase.from("cv_files").select("*").eq("user_id", id).order("created_at", { ascending: false }).returns<CvFile[]>(),
    supabase
      .from("applications")
      .select("id, status, created_at, job:jobs(id, title)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .returns<{ id: string; status: ApplicationStatus; created_at: string; job: { id: string; title: string } | null }[]>(),
    supabase
      .from("payments")
      .select("*, plan:plans(name)")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .returns<(Payment & { plan: { name: string } | null })[]>(),
  ]);
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/candidats" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft aria-hidden className="size-4" /> Candidats</Link>
      <div className="card space-y-3 p-6">
        <h1 className="text-2xl font-bold">{profile.full_name || "Sans nom"}</h1>
        <p className="text-sm text-muted">
          {[profile.headline, profile.experience_level && EXPERIENCE_LABELS[profile.experience_level], profile.city, profile.phone].filter(Boolean).join(" · ")}
        </p>
        <p className="text-xs text-muted">Inscrit le {formatDate(profile.created_at)}</p>
        {profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">{profile.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Candidatures</h2>
          <ul className="space-y-2 text-sm">
            {apps?.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="flex-1 truncate">{a.job?.title ?? "Offre supprimée"}</span>
                <span className="text-xs text-muted">{formatShortDate(a.created_at)}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {!apps?.length && <li className="text-muted">Aucune.</li>}
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

      <section id="cv" className="scroll-mt-8 space-y-3">
        <h2 className="font-semibold">CV</h2>
        {files?.length ? (
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <a key={f.id} href={`/cv/fichier/${f.id}`} target="_blank" rel="noreferrer" className="btn-secondary text-xs"><FileText aria-hidden className="size-4" /> {f.name}</a>
            ))}
          </div>
        ) : null}
        {cvs?.length ? (
          <div className="flex flex-wrap gap-2">
            {cvs.map((c) => (
              <Link key={c.id} href={`/cv/${c.id}/apercu`} target="_blank" className="btn-secondary text-xs">
                {c.title} · {formatShortDate(c.updated_at)}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Pas de CV en ligne.</p>
        )}
      </section>
    </div>
  );
}
