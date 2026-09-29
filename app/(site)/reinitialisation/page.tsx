import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// Atteinte via le lien e-mail (/auth/confirm ouvre une session de récupération).
export default async function ResetPasswordPage() {
  await requireUser("/reinitialisation");
  return (
    <div className="flex justify-center bg-cream px-4 py-16">
      <div className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        <ResetForm />
      </div>
    </div>
  );
}
