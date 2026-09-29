import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { LockBadge } from "./ui";

/** Carte d'upgrade insérée dans la liste (masquée pour les abonnés). */
export function UpgradeCard({ minPrice }: { minPrice: number | null }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-brand-600/50 bg-cream p-5 sm:flex-row sm:items-center">
      <LockBadge />
      <div className="flex-1">
        <p className="font-semibold">Voir les offres en entier</p>
        <p className="text-sm text-muted">Description complète, exigences et candidature en ligne.</p>
      </div>
      {minPrice !== null && (
        <p className="font-bold whitespace-nowrap">dès {formatNumber(minPrice)} FCFA / mois</p>
      )}
      <Link href="/abonnements" className="btn-primary">Choisir mon abonnement</Link>
    </div>
  );
}
