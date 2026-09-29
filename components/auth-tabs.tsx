import Link from "next/link";

/** Onglets Connexion / Inscription qui conservent la destination (?suivant=). */
export function AuthTabs({ active, next }: { active: "connexion" | "inscription"; next?: string }) {
  const q = next ? `?suivant=${encodeURIComponent(next)}` : "";
  const tab = (key: "connexion" | "inscription", label: string) => (
    <Link
      href={`/${key}${q}`}
      aria-current={active === key ? "page" : undefined}
      className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium ${
        active === key ? "bg-ink text-white" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Connexion ou inscription" className="flex rounded-full border border-line p-1">
      {tab("connexion", "Connexion")}
      {tab("inscription", "Inscription")}
    </nav>
  );
}
