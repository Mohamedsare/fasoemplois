import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CvView } from "@/components/cv-view";
import type { Cv } from "@/lib/types";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Aperçu du CV" };

export default async function CvPreviewPage() {
  const user = await requireUser("/cv/apercu");
  const supabase = await createClient();
  const { data: cv } = await supabase.from("cvs").select("*").eq("user_id", user.id).maybeSingle<Cv>();
  if (!cv) redirect("/cv");

  return (
    <div className="bg-surface py-8 print:bg-white print:py-0">
      <div className="no-print container-page mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/cv" className="text-sm text-muted hover:text-ink">← Modifier mon CV</Link>
        <PrintButton />
      </div>
      <div className="container-page">
        <div className="card overflow-hidden shadow-sm print:border-0 print:shadow-none">
          <CvView cv={cv} />
        </div>
      </div>
    </div>
  );
}
