import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import type { Company, Job, JobSection } from "@/lib/types";
import { JobEditor } from "../job-editor";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default async function EditJobPage(props: PageProps<"/admin/offres/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [categories, { data: companies }, { data: job }, { data: sections }] = await Promise.all([
    getCategories(),
    supabase.from("companies").select("id, name").order("name").returns<Pick<Company, "id" | "name">[]>(),
    supabase.from("jobs").select("*").eq("id", id).maybeSingle<Job>(),
    supabase.from("job_sections").select("*").eq("job_id", id).returns<JobSection[]>(),
  ]);
  if (!job) notFound();

  return (
    <>
      {sp.enregistre === "1" && (
        <p role="status" className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Offre créée.</p>
      )}
      <JobEditor job={job} sections={sections ?? []} companies={companies ?? []} categories={categories} />
    </>
  );
}
