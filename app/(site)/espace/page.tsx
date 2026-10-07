import { ArrowRight, Bot, Crown, Download, FileText, PencilLine, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getMinPrice } from "@/lib/queries";
import { signedPhotoUrls } from "@/lib/cv-photos";
import { AI_DAILY_LIMIT, FREE_CV_LIMIT } from "@/lib/constants";
import { daysAgoIso, formatDate, formatNumber, formatRelative, formatShortDate } from "@/lib/format";
import { CvPreview } from "@/components/cv-preview";
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
    // Les dictées vocales ont leur propre limite : seules les demandes à l'assistant sont comptées ici
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("kind", "transcription").gte("created_at", since),
    getMinPrice(),
  ]);
  const photos = await signedPhotoUrls((cvs ?? []).map((c) => c.photo_path));

  const sub = user.subscription;
  // Administrateurs : accès à tout sans abonnement (CV et assistant IA illimités, PDF inclus)
  const isAdmin = user.profile.is_admin;
  const fullAccess = user.isSubscribed || isAdmin;
  const cvLimit = isAdmin ? Infinity : user.isSubscribed ? sub?.plan.cv_limit ?? FREE_CV_LIMIT : FREE_CV_LIMIT;
  const aiLimit = isAdmin ? Infinity : user.isSubscribed ? AI_DAILY_LIMIT.subscribed : AI_DAILY_LIMIT.free;
  const limitLabel = (n: number) => (Number.isFinite(n) ? n : "∞");
  const used = cvCount ?? 0;
  const canCreate = used < cvLimit;
  const last = cvs?.[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {sp.mdp === "1" && (
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Mot de passe mis à jour.</p>
      )}

      <div>
        <h1 className="text-2xl leading-tight font-bold sm:text-3xl">Bonjour {user.profile.first_name || "et bienvenue"}</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Voici où en sont vos CV.</p>
      </div>

      {/* Action principale : reprendre le dernier CV ou en créer un */}
      {last ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-ink p-5 text-white sm:flex-row sm:items-center sm:gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/60">Dernier CV modifié {formatRelative(last.updated_at)}</p>
            <p className="mt-0.5 truncate text-lg font-semibold">{last.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link href={`/cv/${last.id}`} className={`btn h-12 bg-star-400 text-ink hover:bg-star-400/90 sm:h-auto ${canCreate ? "" : "col-span-2"}`}>
              <PencilLine aria-hidden className="size-4" /> Reprendre
            </Link>
            {canCreate && (
              <Link href="/cv/nouveau" className="btn h-12 w-full border border-white/25 text-white hover:bg-white/10 sm:h-auto">
                <Plus aria-hidden className="size-4" /> Nouveau CV
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-ink px-5 py-8 text-center text-white">
          <Sparkles aria-hidden className="size-9 text-star-400" />
          <div>
            <p className="text-lg font-semibold">Créez votre premier CV</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/70">
              Importez votre ancien CV ou racontez votre parcours à voix haute : l&apos;IA rédige votre CV, vous n&apos;avez plus qu&apos;à relire.
            </p>
          </div>
          <Link href="/cv/nouveau" className="btn h-12 w-full bg-star-400 px-6 text-ink hover:bg-star-400/90 sm:w-auto">
            <Plus aria-hidden className="size-4" /> Créer mon CV
          </Link>
        </div>
      )}

      {/* Indicateurs */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card space-y-2 p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted"><FileText aria-hidden className="size-3.5" /> CV utilisés</dt>
          <dd className="text-2xl font-bold">{used} <span className="text-sm font-normal text-muted">/ {limitLabel(cvLimit)}</span></dd>
          <dd><ProgressBar value={Math.min(100, (used / cvLimit) * 100)} label="CV utilisés" /></dd>
        </div>
        <div className="card space-y-2 p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted"><Bot aria-hidden className="size-3.5" /> IA aujourd&apos;hui</dt>
          <dd className="text-2xl font-bold">{formatNumber(aiToday ?? 0)} <span className="text-sm font-normal text-muted">/ {limitLabel(aiLimit)}</span></dd>
          <dd><ProgressBar value={Math.min(100, ((aiToday ?? 0) / aiLimit) * 100)} label="Demandes IA" /></dd>
        </div>
        <div className="card space-y-1 p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted"><Download aria-hidden className="size-3.5" /> PDF</dt>
          <dd className={`font-semibold ${fullAccess ? "text-brand-700" : ""}`}>{fullAccess ? "Inclus" : "Réservé aux abonnés"}</dd>
        </div>
        <div className="card relative space-y-1 p-4 hover:border-ink/30">
          <dt className="flex items-center gap-1.5 text-xs text-muted"><Crown aria-hidden className="size-3.5" /> Abonnement</dt>
          <dd className="font-semibold">
            {/* Lien étendu à toute la carte */}
            <Link href="/espace/abonnement" className="after:absolute after:inset-0">
              {sub?.isActive ? sub.plan.name : isAdmin ? "Administrateur" : sub ? "Expiré" : "Gratuit"}
            </Link>
          </dd>
          {sub?.isActive && <dd className="text-xs text-muted">jusqu&apos;au {formatShortDate(sub.expires_at)}</dd>}
        </div>
      </dl>

      {!fullAccess && (
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-brand-600/50 bg-cream p-5 sm:flex-row sm:items-center">
          <Download aria-hidden className="hidden size-8 shrink-0 text-brand-600 sm:block" />
          <p className="flex-1 text-sm">
            <strong>{sub ? "Votre abonnement a expiré." : "Téléchargez votre CV en PDF."}</strong>{" "}
            Débloquez le PDF, les modèles Premium, plus de CV et plus d&apos;assistant IA
            {minPrice !== null ? ` dès ${formatNumber(minPrice)} FCFA / mois` : ""}.
          </p>
          <Link href="/abonnements" className="btn-primary h-12 w-full sm:h-auto sm:w-auto">{sub ? "Renouveler" : "Voir les abonnements"}</Link>
        </div>
      )}

      {cvs?.length ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">Mes derniers CV</h2>
            <Link href="/cv" className="-my-2 inline-flex min-h-10 items-center gap-1 px-1 text-sm font-semibold text-brand-700 hover:underline">
              Tous <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          {/* Mobile : carrousel horizontal ; écran large : grille */}
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {cvs.map((cv) => (
              <li key={cv.id} className="w-[62%] shrink-0 snap-start sm:w-auto">
                <Link href={`/cv/${cv.id}`} className="card block overflow-hidden hover:border-ink/30">
                  <div className="pointer-events-none bg-surface p-3 sm:p-4">
                    <CvPreview cv={cv} photoUrl={photos.get(cv.photo_path ?? "") ?? null} />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="truncate text-sm font-medium">{cv.title}</p>
                    <p className="text-xs text-muted">Modifié le {formatDate(cv.updated_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
