import { Download, FileText, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getMinPrice } from "@/lib/queries";
import { signedPhotoUrls } from "@/lib/cv-photos";
import { AI_DAILY_LIMIT, FREE_CV_LIMIT } from "@/lib/constants";
import { daysAgoIso, formatDate, formatNumber } from "@/lib/format";
import { createCv } from "@/app/actions/cv";
import { CvPreview } from "@/components/cv-preview";
import { SubscriptionBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/form";
import { ProgressBar } from "@/components/ui";
import type { Cv } from "@/lib/types";

export const metadata: Metadata = { title: "Mon espace" };

export default async function DashboardPage(props: PageProps<"/espace">) {
  const sp = await props.searchParams;
  const user = await requireUser("/espace");
  const supabase = await createClient();
  const since = daysAgoIso(1);

  const [{ data: cvs, count: cvCount }, { count: aiToday }, minPrice] = await Promise.all([
    supabase
      .from("cvs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(3)
      .returns<Cv[]>(),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
    getMinPrice(),
  ]);
  const photos = await signedPhotoUrls((cvs ?? []).map((c) => c.photo_path));

  const sub = user.subscription;
  const cvLimit = user.isSubscribed ? sub?.plan.cv_limit ?? FREE_CV_LIMIT : FREE_CV_LIMIT;
  const aiLimit = user.isSubscribed ? AI_DAILY_LIMIT.subscribed : AI_DAILY_LIMIT.free;
  const used = cvCount ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {sp.mdp === "1" && (
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Mot de passe mis à jour.</p>
      )}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Bonjour {user.profile.first_name || "et bienvenue"}</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Voici où en sont vos CV.</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card space-y-2 p-4">
          <dt className="text-xs text-muted">CV utilisés</dt>
          <dd className="text-2xl font-bold">{used} <span className="text-sm font-normal text-muted">/ {cvLimit}</span></dd>
          <ProgressBar value={Math.min(100, (used / cvLimit) * 100)} label="CV utilisés" />
        </div>
        <div className="card space-y-2 p-4">
          <dt className="text-xs text-muted">Assistant IA aujourd&apos;hui</dt>
          <dd className="text-2xl font-bold">{formatNumber(aiToday ?? 0)} <span className="text-sm font-normal text-muted">/ {aiLimit}</span></dd>
          <ProgressBar value={Math.min(100, ((aiToday ?? 0) / aiLimit) * 100)} label="Demandes IA" />
        </div>
        <div className="card space-y-1 p-4">
          <dt className="text-xs text-muted">Téléchargement PDF</dt>
          <dd className={`font-semibold ${user.isSubscribed ? "text-brand-700" : ""}`}>{user.isSubscribed ? "Inclus" : "Réservé aux abonnés"}</dd>
        </div>
        <Link href="/espace/abonnement" className="card space-y-2 p-4 hover:border-ink/30">
          <dt className="text-xs text-muted">Abonnement</dt>
          <dd>
            {sub ? <SubscriptionBadge active={sub.isActive} cancelled={sub.status === "cancelled"} /> : <span className="text-sm font-semibold">Gratuit</span>}
            {sub?.isActive && <span className="mt-1 block text-xs text-muted">{sub.plan.name} · jusqu&apos;au {formatDate(sub.expires_at)}</span>}
          </dd>
        </Link>
      </dl>

      {!user.isSubscribed && (
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-brand-600/50 bg-cream p-5 sm:flex-row sm:items-center">
          <Download aria-hidden className="size-8 shrink-0 text-brand-600" />
          <p className="flex-1 text-sm">
            <strong>{sub ? "Votre abonnement a expiré." : "Téléchargez votre CV en PDF."}</strong>{" "}
            Débloquez le PDF, plus de CV et plus d&apos;assistant IA
            {minPrice !== null ? ` dès ${formatNumber(minPrice)} FCFA / mois` : ""}.
          </p>
          <Link href="/abonnements" className="btn-primary w-full sm:w-auto">{sub ? "Renouveler" : "Voir les abonnements"}</Link>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Mes derniers CV</h2>
          <Link href="/cv" className="text-sm font-semibold text-brand-700 hover:underline">Tous mes CV →</Link>
        </div>
        {cvs?.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv) => (
              <li key={cv.id}>
                <Link href={`/cv/${cv.id}`} className="card block overflow-hidden hover:border-ink/30">
                  <div className="pointer-events-none bg-surface p-4">
                    <CvPreview cv={cv} photoUrl={photos.get(cv.photo_path ?? "") ?? null} />
                  </div>
                  <div className="flex items-center gap-2 p-4">
                    <FileText aria-hidden className="size-4 text-muted" />
                    <span className="min-w-0 flex-1 truncate font-medium">{cv.title}</span>
                    <span className="text-xs text-muted">{formatDate(cv.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
            <Sparkles aria-hidden className="size-9 text-violet-600" />
            <p className="max-w-sm text-sm text-muted">
              Décrivez votre parcours en quelques phrases : l&apos;assistant IA rédige votre CV, vous n&apos;avez plus qu&apos;à relire.
            </p>
            <form action={createCv} className="w-full sm:w-auto">
              <SubmitButton className="btn-primary w-full py-3 sm:py-2" pendingLabel="Création…"><Plus aria-hidden className="size-4" /> Créer mon premier CV</SubmitButton>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
