import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai";
import { signedPhotoUrl } from "@/lib/cv-photos";
import type { Cv, CvDraft } from "@/lib/types";
import { CvEditor } from "./cv-editor";

export const metadata: Metadata = { title: "Créer mon CV" };

// Les appels à l'assistant IA (Server Actions de cette page) peuvent prendre plusieurs secondes
export const maxDuration = 60;

export default async function CvEditorPage(props: PageProps<"/cv/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/cv/${id}`);

  const supabase = await createClient();
  const { data: cv } = await supabase.from("cvs").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Cv>();
  if (!cv) notFound();

  const { id: _id, user_id: _u, updated_at: _up, ...draft } = cv;
  void _id; void _u; void _up;
  const isEmpty = !cv.summary && !cv.experiences.length && !cv.education.length;

  return (
    <div className="container-page py-8">
      <CvEditor
        cvId={cv.id}
        initial={draft as CvDraft}
        initialPhotoUrl={await signedPhotoUrl(cv.photo_path)}
        isNew={sp.nouveau === "1" || isEmpty}
        aiEnabled={isAiConfigured()}
      />
    </div>
  );
}
