import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin ${BRAND.name}` },
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const supabase = await createClient();
  // Dépôts Orange Money à vérifier : pastille dans le menu
  const { count: pending } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("provider", "orange_money");

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <AdminNav name={user.profile.full_name || "Administrateur"} email={user.email} pending={pending ?? 0} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
