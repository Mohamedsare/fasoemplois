import { requireUser } from "@/lib/auth";
import { SpaceNav } from "./space-nav";

export default async function SpaceLayout({ children }: LayoutProps<"/espace">) {
  const user = await requireUser();
  return (
    <div className="container-page grid gap-8 py-8 pb-24 lg:grid-cols-[200px_1fr] lg:pb-8">
      <SpaceNav name={user.profile.full_name || user.email} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
