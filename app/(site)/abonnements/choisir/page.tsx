import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getAvailablePlans } from "@/lib/queries";
import { param } from "@/lib/format";
import { CompanyLogo } from "@/components/ui";
import { PlanPicker } from "./plan-picker";

export const metadata: Metadata = { title: "Choisir un abonnement" };

type JobRecap = { id: string; title: string; company: { name: string; logo_url: string | null } | null };

/** 4c — pricing contextuel depuis une offre verrouillée. */
export default async function ChoosePlanPage(props: PageProps<"/abonnements/choisir">) {
  const sp = await props.searchParams;
  const jobId = param(sp.offre);
  const user = await requireUser(`/abonnements/choisir${jobId ? `?offre=${jobId}` : ""}`);
  if (user.isSubscribed && jobId) redirect(`/offres/${jobId}?debloque=1`);

  const supabase = await createClient();
  const [plans, { data: job }] = await Promise.all([
    getAvailablePlans(),
    jobId
      ? supabase.from("jobs").select("id, title, company:companies(name, logo_url)").eq("id", jobId).maybeSingle<JobRecap>()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="container-page py-10">
      <p className="text-xs font-medium text-muted">Étape 2/3 · Abonnement</p>
      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {job && (
            <div className="flex items-center gap-3 rounded-2xl bg-cream p-4">
              <CompanyLogo name={job.company?.name ?? "?"} url={job.company?.logo_url} size={40} />
              <div>
                <p className="text-xs text-muted">Vous débloquez</p>
                <p className="font-semibold">{job.title}</p>
                <p className="text-xs text-muted">{job.company?.name}</p>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold">Choisissez votre abonnement</h1>
          <p className="text-muted">
            {job
              ? "Vous reviendrez directement à cette offre après le paiement."
              : "Accédez aux offres complètes et postulez en ligne."}
          </p>
        </div>
        <PlanPicker plans={plans} jobId={job?.id ?? null} />
      </div>
    </div>
  );
}
