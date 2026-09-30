import { KeyRound, LogOut, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { signOut } from "@/app/actions/auth";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser("/espace/profil");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Mon profil</h1>
        <p className="mt-1 text-sm text-muted">Ces informations préremplissent chaque nouveau CV.</p>
      </div>
      <ProfileForm profile={user.profile} />

      <section className="card divide-y divide-line">
        <h2 className="px-5 pt-5 pb-3 font-semibold">Mon compte</h2>
        <p className="flex items-center gap-3 px-5 py-4 text-sm">
          <Mail aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted">Adresse e-mail</span>
            <span className="block truncate font-medium">{user.email}</span>
          </span>
        </p>
        <Link href="/mot-de-passe-oublie" className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-surface">
          <KeyRound aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="flex-1 font-medium">Changer mon mot de passe</span>
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-accent-600 hover:bg-surface">
            <LogOut aria-hidden className="size-4 shrink-0" /> Se déconnecter
          </button>
        </form>
      </section>

      <p className="text-center text-xs text-muted">
        Pour supprimer votre compte et vos données, écrivez à{" "}
        <a href={`mailto:${BRAND.contactEmail}`} className="underline">{BRAND.contactEmail}</a>.
      </p>
    </div>
  );
}
