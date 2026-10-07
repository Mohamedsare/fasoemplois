import { ArrowLeft, Crown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { getTemplateCatalog } from "@/lib/template-catalog";
import { getAvailablePlans } from "@/lib/queries";
import { FREE_CV_LIMIT } from "@/lib/constants";
import { param } from "@/lib/format";
import { CvStart } from "./cv-start";

export const metadata: Metadata = { title: "Nouveau CV", robots: { index: false } };

// Import d'un ancien CV, transcription et rédaction par l'IA : jusqu'à plusieurs dizaines de secondes
export const maxDuration = 60;

export default async function NewCvPage(props: PageProps<"/cv/nouveau">) {
  const sp = await props.searchParams;
  const requested = param(sp.modele);
  const user = await requireUser(requested ? `/cv/nouveau?modele=${encodeURIComponent(requested)}` : "/cv/nouveau");

  const supabase = await createClient();
  const [{ count }, templates] = await Promise.all([
    supabase.from("cvs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getTemplateCatalog(),
  ]);
  const used = count ?? 0;
  const isAdmin = user.profile.is_admin;
  const limit = user.subscription?.isActive ? user.subscription.plan.cv_limit ?? FREE_CV_LIMIT : FREE_CV_LIMIT;

  // Quota atteint : on le dit avant que l'utilisateur ne prenne le temps de raconter son parcours
  if (!isAdmin && used >= limit) {
    const plans = await getAvailablePlans();
    const upgrade = plans.filter((p) => p.cv_limit > limit).sort((a, b) => a.price - b.price)[0];
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-lg space-y-5 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink text-star-400">
            <Crown aria-hidden className="size-7" />
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">Vous avez atteint votre nombre de CV</h1>
          <p className="text-muted">
            {used} / {limit} CV utilisé{limit > 1 ? "s" : ""}.{" "}
            {upgrade
              ? `Avec le plan ${upgrade.name}, créez jusqu'à ${upgrade.cv_limit} CV différents (un par type de poste visé).`
              : "Vous pouvez modifier ou dupliquer vos CV existants."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {upgrade && <Link href="/abonnements" className="btn-primary h-12 px-6 sm:h-auto">Voir les abonnements</Link>}
            <Link href="/cv" className="btn-secondary h-12 px-6 sm:h-auto"><ArrowLeft aria-hidden className="size-4" /> Mes CV</Link>
          </div>
        </div>
      </div>
    );
  }

  const p = user.profile;
  return (
    <div className="container-page py-6 sm:py-10">
      <CvStart
        aiEnabled={isAiConfigured()}
        templates={templates}
        initialTemplate={templates.some((t) => t.value === requested) ? requested : "moderne"}
        defaults={{
          full_name: p.full_name,
          email: user.email || null,
          phone: p.phone,
          city: p.city,
          headline: p.headline,
          skills: p.skills,
          languages: p.languages,
        }}
        firstName={p.first_name}
        isFirst={used === 0}
        subscribed={user.isSubscribed || isAdmin}
      />
    </div>
  );
}
