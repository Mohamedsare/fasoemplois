import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "./nav-links";
import { Logo } from "./logo";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Faso Emplois — accueil">
          <Logo />
        </Link>
        <NavLinks
          user={
            user
              ? {
                  firstName: user.profile.first_name || "Mon espace",
                  isAdmin: user.profile.is_admin,
                  isSubscribed: user.isSubscribed,
                }
              : null
          }
        />
      </div>
    </header>
  );
}
