"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { markPaymentFailed, markPaymentPaid } from "@/lib/payments";
import { CONTRACT_TYPES, EXPERIENCE_LABELS, SECTION_ORDER } from "@/lib/constants";
import { nullable, str, strList } from "@/lib/format";
import type { ActionState, ContractType, ExperienceLevel, Job } from "@/lib/types";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Offres
// ---------------------------------------------------------------------------

export async function saveJob(jobId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const intent = str(formData, "intent"); // "draft" | "publish" | "save"
  const publication = str(formData, "publication"); // brouillon | publie | programme | archive
  const experience = str(formData, "experience_level");

  const values = {
    title: str(formData, "title"),
    company_id: str(formData, "company_id"),
    category_id: nullable(formData, "category_id"),
    city: str(formData, "city"),
    contract_type: str(formData, "contract_type") as ContractType,
    experience_level: experience in EXPERIENCE_LABELS ? (experience as ExperienceLevel) : null,
    salary: nullable(formData, "salary"),
    deadline: nullable(formData, "deadline"),
    summary: str(formData, "summary"),
    skills: strList(formData, "skills", 12),
    is_featured: formData.get("is_featured") === "on",
    is_urgent: formData.get("is_urgent") === "on",
  };

  const fieldErrors: Record<string, string> = {};
  if (values.title.length < 3) fieldErrors.title = "Intitulé trop court.";
  if (!values.company_id) fieldErrors.company_id = "Choisissez une entreprise.";
  if (!values.city) fieldErrors.city = "Indiquez la localisation.";
  if (!CONTRACT_TYPES.includes(values.contract_type)) fieldErrors.contract_type = "Choisissez un type de contrat.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, error: "Corrigez les champs en rouge." };

  // Statut de publication
  let status: Job["status"] = "brouillon";
  let publishedAt: string | null = null;
  const target = intent === "draft" ? "brouillon" : intent === "publish" ? "publie" : publication;
  if (target === "publie") {
    status = "publie";
    publishedAt = new Date().toISOString();
  } else if (target === "programme") {
    const at = str(formData, "publish_at");
    if (!at || Number.isNaN(Date.parse(at))) return { fieldErrors: { publish_at: "Indiquez la date de publication." } };
    status = "publie";
    publishedAt = new Date(at).toISOString();
  } else if (target === "archive") {
    status = "archive";
  }

  const supabase = await createClient();
  let id = jobId;
  if (id) {
    const { data: current } = await supabase.from("jobs").select("status, published_at").eq("id", id).single<Pick<Job, "status" | "published_at">>();
    // Ne pas repousser la date d'une offre déjà en ligne
    if (target === "publie" && current?.status === "publie" && current.published_at) publishedAt = current.published_at;
    const { error } = await supabase.from("jobs").update({ ...values, status, published_at: publishedAt }).eq("id", id);
    if (error) return { error: "Impossible d'enregistrer l'offre." };
  } else {
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...values, status, published_at: publishedAt, created_by: admin.id })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: "Impossible de créer l'offre." };
    id = data.id;
  }

  // Sections : upsert des remplies, suppression des vides
  const filled = SECTION_ORDER.filter((kind) => str(formData, `section_${kind}`));
  const empty = SECTION_ORDER.filter((kind) => !str(formData, `section_${kind}`));
  if (filled.length) {
    await supabase.from("job_sections").upsert(
      filled.map((kind) => ({
        job_id: id,
        kind,
        content: str(formData, `section_${kind}`),
        is_public: formData.get(`section_${kind}_public`) === "on",
      })),
      { onConflict: "job_id,kind" },
    );
  }
  if (empty.length) await supabase.from("job_sections").delete().eq("job_id", id).in("kind", empty);

  revalidatePublic();
  if (!jobId) redirect(`/admin/offres/${id}?enregistre=1`);
  return { success: status === "publie" ? "Offre enregistrée et publiée." : "Offre enregistrée." };
}

export async function bulkJobs(formData: FormData) {
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const action = str(formData, "bulk");
  if (!ids.length) return;

  const supabase = await createClient();
  if (action === "desactiver") await supabase.from("jobs").update({ status: "brouillon" }).in("id", ids);
  if (action === "archiver") await supabase.from("jobs").update({ status: "archive" }).in("id", ids);
  if (action === "supprimer") await supabase.from("jobs").delete().in("id", ids);
  revalidatePublic();
}

export async function setJobStatus(jobId: string, status: Job["status"]) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("jobs")
    .update(status === "publie" ? { status, published_at: new Date().toISOString() } : { status })
    .eq("id", jobId);
  revalidatePublic();
}

export async function duplicateJob(jobId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single<Job>();
  if (!job) return;

  const { data: copy } = await supabase
    .from("jobs")
    .insert({
      title: `${job.title} (copie)`,
      company_id: job.company_id,
      category_id: job.category_id,
      city: job.city,
      contract_type: job.contract_type,
      experience_level: job.experience_level,
      salary: job.salary,
      deadline: job.deadline,
      summary: job.summary,
      skills: job.skills,
      is_featured: job.is_featured,
      is_urgent: job.is_urgent,
      status: "brouillon",
      published_at: null,
      created_by: admin.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (!copy) return;

  const { data: sections } = await supabase.from("job_sections").select("kind, content, is_public").eq("job_id", jobId);
  if (sections?.length) {
    await supabase.from("job_sections").insert(sections.map((s) => ({ ...s, job_id: copy.id })));
  }
  redirect(`/admin/offres/${copy.id}`);
}

export async function deleteJob(jobId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", jobId);
  revalidatePublic();
  redirect("/admin/offres");
}

// ---------------------------------------------------------------------------
// Entreprises
// ---------------------------------------------------------------------------

export async function saveCompany(companyId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(formData, "name");
  if (name.length < 2) return { fieldErrors: { name: "Indiquez le nom de l'entreprise." } };

  const supabase = await createClient();
  const values: Record<string, string | null> = {
    name,
    city: nullable(formData, "city"),
    website: nullable(formData, "website"),
    description: nullable(formData, "description"),
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/") || logo.size > 1024 * 1024)
      return { fieldErrors: { logo: "Image de 1 Mo maximum (PNG, JPG, WebP, SVG)." } };
    const ext = logo.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, logo, { contentType: logo.type });
    if (error) return { error: "Échec de l'envoi du logo." };
    values.logo_url = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = companyId
    ? await supabase.from("companies").update(values).eq("id", companyId)
    : await supabase.from("companies").insert(values);
  if (error) return { error: "Impossible d'enregistrer l'entreprise." };

  revalidatePublic();
  if (!companyId) redirect("/admin/entreprises?enregistre=1");
  return { success: "Entreprise enregistrée." };
}

export async function deleteCompany(companyId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  revalidatePublic();
  redirect(error ? "/admin/entreprises?erreur=liee" : "/admin/entreprises");
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (name.length < 2) return { error: "Nom de catégorie trop court." };

  const supabase = await createClient();
  const values = { name, slug: slugify(name), position: Number(str(formData, "position")) || 0 };
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert(values);
  if (error) return { error: error.code === "23505" ? "Cette catégorie existe déjà." : "Enregistrement impossible." };

  revalidatePublic();
  return { success: id ? "Catégorie mise à jour." : "Catégorie ajoutée." };
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePublic();
}

// ---------------------------------------------------------------------------
// Plans d'abonnement
// ---------------------------------------------------------------------------

export async function savePlan(planId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(formData, "name");
  const price = Number(str(formData, "price").replace(/\s/g, ""));
  const limitRaw = str(formData, "application_limit");
  const limit = limitRaw ? Number(limitRaw) : null;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Indiquez le nom du plan.";
  if (!Number.isInteger(price) || price < 0) fieldErrors.price = "Prix invalide.";
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) fieldErrors.application_limit = "Limite invalide.";
  const cvLimit = Number(str(formData, "cv_limit"));
  if (!Number.isInteger(cvLimit) || cvLimit < 1 || cvLimit > 50) fieldErrors.cv_limit = "Entre 1 et 50.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const values = {
    name,
    price,
    description: nullable(formData, "description"),
    features: str(formData, "features").split("\n").map((f) => f.trim()).filter(Boolean).slice(0, 12),
    application_limit: limit,
    cv_limit: cvLimit,
    badge: nullable(formData, "badge"),
    is_featured: formData.get("is_featured") === "on",
    is_available: formData.get("is_available") === "on",
    cta_label: str(formData, "cta_label") || "Choisir ce plan",
  };

  const supabase = await createClient();
  if (planId) {
    const { error } = await supabase.from("plans").update(values).eq("id", planId);
    if (error) return { error: "Impossible d'enregistrer le plan." };
  } else {
    const { count } = await supabase.from("plans").select("id", { count: "exact", head: true });
    const { data, error } = await supabase
      .from("plans")
      .insert({ ...values, position: (count ?? 0) + 1 })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return { error: "Impossible de créer le plan." };
    revalidatePublic();
    redirect(`/admin/plans?plan=${data.id}`);
  }
  // Un seul plan « populaire »
  if (values.is_featured) await supabase.from("plans").update({ is_featured: false }).neq("id", planId);

  revalidatePublic();
  return { success: "Plan enregistré." };
}

export async function movePlan(planId: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("id, position").order("position");
  if (!plans) return;
  const i = plans.findIndex((p) => p.id === planId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= plans.length) return;
  [plans[i], plans[j]] = [plans[j], plans[i]];
  await Promise.all(plans.map((p, idx) => supabase.from("plans").update({ position: idx + 1 }).eq("id", p.id)));
  revalidatePublic();
}

export async function cancelSubscriptionAdmin(subscriptionId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subscriptionId);
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Astuces (contenu)
// ---------------------------------------------------------------------------

export async function saveTip(tipId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = {
    title: str(formData, "title"),
    slug: str(formData, "slug") || slugify(str(formData, "title")),
    excerpt: str(formData, "excerpt"),
    content: str(formData, "content"),
    category: str(formData, "category"),
    reading_minutes: Math.max(1, Number(str(formData, "reading_minutes")) || 3),
    is_published: formData.get("is_published") === "on",
  };

  const fieldErrors: Record<string, string> = {};
  if (values.title.length < 3) fieldErrors.title = "Titre trop court.";
  if (!values.excerpt) fieldErrors.excerpt = "Ajoutez un résumé.";
  if (values.content.length < 20) fieldErrors.content = "Contenu trop court.";
  if (!values.category) fieldErrors.category = "Indiquez une catégorie.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = tipId
    ? await supabase.from("tips").update(values).eq("id", tipId)
    : await supabase.from("tips").insert(values);
  if (error) return { error: error.code === "23505" ? "Ce lien (slug) est déjà utilisé." : "Enregistrement impossible." };

  revalidatePublic();
  if (!tipId) redirect("/admin/astuces?enregistre=1");
  return { success: "Astuce enregistrée." };
}

export async function deleteTip(tipId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("tips").delete().eq("id", tipId);
  revalidatePublic();
  redirect("/admin/astuces");
}

// ---------------------------------------------------------------------------
// Paiements Orange Money manuels : vérification par un administrateur
// ---------------------------------------------------------------------------

/** Le dépôt a bien été reçu : le paiement passe « Payé » et l'abonnement est activé. */
export async function approvePayment(paymentId: string) {
  const admin = await requireAdmin();
  await markPaymentPaid(paymentId, admin.id);
  revalidatePath("/", "layout");
}

/** Dépôt introuvable ou incorrect : le paiement est rejeté avec un motif visible par l'utilisateur. */
export async function rejectPayment(paymentId: string, formData: FormData) {
  const admin = await requireAdmin();
  const note = nullable(formData, "motif") ?? "Dépôt introuvable ou montant incorrect.";
  await markPaymentFailed(paymentId, "failed", { reviewerId: admin.id, note: note.slice(0, 300) });
  revalidatePath("/", "layout");
}
