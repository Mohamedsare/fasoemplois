import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin ${BRAND.name}` },
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <AdminNav name={user.profile.full_name || user.email} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
