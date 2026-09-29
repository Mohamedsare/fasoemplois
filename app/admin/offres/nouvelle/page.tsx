import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import type { Company } from "@/lib/types";
import { JobEditor } from "../job-editor";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default async function NewJobPage() {
  const supabase = await createClient();
  const [categories, { data: companies }] = await Promise.all([
    getCategories(),
    supabase.from("companies").select("id, name").order("name").returns<Pick<Company, "id" | "name">[]>(),
  ]);
  return <JobEditor job={null} sections={[]} companies={companies ?? []} categories={categories} />;
}
