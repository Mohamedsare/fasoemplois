import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteCompany } from "@/app/actions/admin";
import { param } from "@/lib/format";
import { CompanyLogo } from "@/components/ui";
import { ConfirmSubmit } from "@/components/confirm-submit";
import type { Company } from "@/lib/types";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Entreprises" };

type Row = Company & { jobs: { count: number }[] };

export default async function AdminCompaniesPage(props: PageProps<"/admin/entreprises">) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*, jobs(count)")
    .order("name")
    .returns<Row[]>();
  const editing = companies?.find((c) => c.id === param(sp.id)) ?? null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Entreprises</h1>
      {sp.erreur === "liee" && (
        <p role="alert" className="rounded-xl bg-accent-500/5 px-4 py-3 text-sm text-accent-600">
          Impossible de supprimer une entreprise qui a encore des offres.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="card divide-y divide-line">
          {companies?.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-4">
              <CompanyLogo name={c.name} url={c.logo_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">{[c.city, `${c.jobs[0]?.count ?? 0} offre(s)`].filter(Boolean).join(" · ")}</p>
              </div>
              <Link href={`/admin/entreprises?id=${c.id}`} className="text-sm underline">Modifier</Link>
              <form action={deleteCompany.bind(null, c.id)}>
                <ConfirmSubmit message={`Supprimer ${c.name} ?`} className="text-sm text-accent-600 underline">Supprimer</ConfirmSubmit>
              </form>
            </li>
          ))}
          {!companies?.length && <li className="p-8 text-center text-sm text-muted">Aucune entreprise.</li>}
        </ul>
        <div className="card h-fit p-5">
          <div className="mb-3 flex items-center">
            <h2 className="flex-1 font-semibold">{editing ? `Modifier · ${editing.name}` : "Nouvelle entreprise"}</h2>
            {editing && <Link href="/admin/entreprises" className="text-xs underline">+ Nouvelle</Link>}
          </div>
          <CompanyForm key={editing?.id ?? "new"} company={editing} />
        </div>
      </div>
    </div>
  );
}
