import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { JOB_SUMMARY_COLUMNS, JobCard, type JobSummary } from "@/components/job-card";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Favoris" };

export default async function FavoritesPage() {
  const user = await requireUser("/espace/favoris");
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select(`created_at, job:jobs(${JOB_SUMMARY_COLUMNS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<{ created_at: string; job: JobSummary | null }[]>();

  // Les offres retirées ou archivées ne sont plus renvoyées (RLS)
  const jobs = (data ?? []).map((f) => f.job).filter((j): j is JobSummary => Boolean(j));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Offres enregistrées</h1>
      {jobs.length ? (
        <div className="space-y-3">
          {jobs.map((job) => <JobCard key={job.id} job={job} isFavorite />)}
        </div>
      ) : (
        <EmptyState
          title="Vous n'avez enregistré aucune offre."
          text="Touchez le cœur sur une offre pour la retrouver ici."
          action={<Link href="/offres" className="btn-primary">Explorer les opportunités</Link>}
        />
      )}
    </div>
  );
}
