import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTemplateCatalog } from "@/lib/template-catalog";
import { createCv } from "@/app/actions/cv";
import { SubmitButton } from "@/components/form";
import { TemplateCard } from "@/components/template-card";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getTemplateCatalog();
  const premium = catalog.filter((t) => t.premium).length;
  return {
    title: "Modèles de CV",
    description: `${catalog.length} modèles de CV professionnels au format A4, dont ${premium} modèles Premium. Photo, couleurs au choix, rédaction guidée par l'IA.`,
  };
}

const FILTERS = [
  { value: "", label: "Tous" },
  { value: "gratuits", label: "Gratuits" },
  { value: "premium", label: "Premium" },
] as const;

/** Libellé court sur mobile (cartes étroites). */
function UseLabel() {
  return (
    <>
      <span className="sm:hidden">Choisir</span>
      <span className="hidden sm:inline">Utiliser ce modèle</span>
    </>
  );
}

export default async function TemplatesPage(props: PageProps<"/modeles">) {
  const sp = await props.searchParams;
  const filter = sp.type === "gratuits" || sp.type === "premium" ? sp.type : "";
  const [user, catalog] = await Promise.all([getCurrentUser(), getTemplateCatalog()]);
  const premiumCount = catalog.filter((t) => t.premium).length;
  const templates = catalog.filter((t) => (filter === "premium" ? t.premium : filter === "gratuits" ? !t.premium : true));

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-[1.75rem] leading-tight font-bold sm:text-4xl">Modèles de CV professionnels</h1>
        <p className="mt-3 text-muted">
          {catalog.length} modèles au format A4 : {catalog.length - premiumCount} gratuits et {premiumCount} modèles Premium inclus
          dans les abonnements. Photo, 7 couleurs au choix, et l&apos;assistant IA pour rédiger le contenu.
        </p>
      </div>

      <nav aria-label="Filtrer les modèles" className="mt-8 flex justify-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/modeles?type=${f.value}` : "/modeles"}
            aria-current={filter === f.value ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === f.value ? "bg-ink text-white" : "bg-surface text-ink hover:bg-line"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {templates.map((t) => (
          <li key={t.value}>
            <TemplateCard template={t}>
              {user ? (
                <form action={createCv}>
                  <input type="hidden" name="template" value={t.value} />
                  <SubmitButton className="btn-primary w-full" pendingLabel="Création…"><UseLabel /></SubmitButton>
                </form>
              ) : (
                <Link href="/inscription?suivant=%2Fmodeles" className="btn-primary w-full"><UseLabel /></Link>
              )}
            </TemplateCard>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-12 max-w-xl text-center text-sm text-muted">
        Vous pouvez essayer tous les modèles gratuitement dans l&apos;éditeur. Les modèles Premium et le téléchargement en PDF
        sont inclus dans les <Link href="/abonnements" className="font-semibold text-brand-700 underline">abonnements</Link>.
      </p>
    </div>
  );
}
