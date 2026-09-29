import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { CheckCircle, CompanyLogo } from "@/components/ui";
import { jobMeta } from "@/components/job-card";
import type { CvFile, Job } from "@/lib/types";
import { ApplyWizard } from "./apply-wizard";

export const metadata: Metadata = { title: "Postuler" };

type JobRecap = Pick<Job, "id" | "title" | "city" | "contract_type" | "experience_level" | "deadline"> & {
  company: { name: string; logo_url: string | null } | null;
};

export default async function ApplyPage(props: PageProps<"/offres/[id]/postuler">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const user = await requireUser(`/offres/${id}/postuler`);

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, city, contract_type, experience_level, deadline, company:companies(name, logo_url)")
    .eq("id", id)
    .maybeSingle<JobRecap>();
  if (!job) notFound();

  const companyName = job.company?.name ?? "Entreprise";

  // Succès (8b)
  if (sp.envoyee === "1") {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <CheckCircle />
          <h1 className="text-2xl font-bold">Candidature envoyée</h1>
          <dl className="card w-full space-y-1 p-4 text-left text-sm">
            <div><dt className="inline text-muted">Poste : </dt><dd className="inline font-medium">{job.title}</dd></div>
            <div><dt className="inline text-muted">Entreprise : </dt><dd className="inline font-medium">{companyName}</dd></div>
            <div><dt className="inline text-muted">Date : </dt><dd className="inline font-medium">{formatDate(new Date())}</dd></div>
          </dl>
          <Link href="/espace/candidatures" className="btn-primary w-full">Voir mes candidatures</Link>
          <Link href="/offres" className="text-sm text-muted hover:text-ink">Continuer à explorer</Link>
        </div>
      </div>
    );
  }

  if (!user.isSubscribed) redirect(`/abonnements/choisir?offre=${job.id}`);

  const [{ data: existing }, { data: files }, { data: cv }] = await Promise.all([
    supabase.from("applications").select("id").eq("job_id", job.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("cv_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).returns<CvFile[]>(),
    supabase.from("cvs").select("updated_at").eq("user_id", user.id).maybeSingle<{ updated_at: string }>(),
  ]);
  if (existing) redirect("/espace/candidatures");

  return (
    <div className="container-page py-8">
      <Link href={`/offres/${job.id}`} className="text-sm text-muted hover:text-ink">← Retour à l&apos;offre</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_280px]">
        <ApplyWizard
          jobId={job.id}
          files={files ?? []}
          onlineCvDate={cv?.updated_at ?? null}
          defaults={{ full_name: user.profile.full_name, email: user.email, phone: user.profile.phone ?? "" }}
        />
        <aside className="order-first lg:order-none">
          <div className="card space-y-2 bg-cream p-5 lg:sticky lg:top-24">
            <CompanyLogo name={companyName} url={job.company?.logo_url} size={40} />
            <p className="font-semibold">{job.title}</p>
            <p className="text-xs text-muted">{companyName} · {jobMeta(job)}</p>
            {job.deadline && <p className="text-xs text-muted">Limite : {formatDate(job.deadline)}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
