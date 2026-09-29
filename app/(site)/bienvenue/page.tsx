import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { skipOnboarding } from "@/app/actions/candidate";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  const [user, categories] = await Promise.all([requireUser("/bienvenue"), getCategories()]);

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted">Bienvenue {user.profile.first_name} 👋</p>
        <form action={skipOnboarding}>
          <button type="submit" className="text-sm text-muted underline hover:text-ink">Passer pour le moment</button>
        </form>
      </div>
      <OnboardingWizard profile={user.profile} categories={categories} />
    </div>
  );
}
