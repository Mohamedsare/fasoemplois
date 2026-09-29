import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/queries";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const [user, categories] = await Promise.all([requireUser("/espace/profil"), getCategories()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Mon profil</h1>
        <p className="mt-1 text-sm text-muted">Connecté avec {user.email}</p>
      </div>
      <ProfileForm profile={user.profile} categories={categories} />
    </div>
  );
}
