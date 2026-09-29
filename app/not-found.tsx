import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold text-brand-700">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
      <p className="mt-3 text-muted">Cette page n&apos;existe pas ou a été supprimée.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-secondary">Accueil</Link>
        <Link href="/offres" className="btn-primary">Voir les offres</Link>
      </div>
    </div>
  );
}
