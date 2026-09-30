import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser("/espace/profil");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Mon profil</h1>
        <p className="mt-1 text-sm text-muted">
          Connecté avec {user.email}. Ces informations préremplissent chaque nouveau CV.
        </p>
      </div>
      <ProfileForm profile={user.profile} />
    </div>
  );
}
