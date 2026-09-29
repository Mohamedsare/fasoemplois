"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-3xl font-bold">Une erreur est survenue</h1>
      <p className="mt-3 text-muted">
        Impossible d&apos;afficher cette page pour le moment. Réessayez dans un instant.
      </p>
      <button type="button" onClick={() => retry()} className="btn-primary mt-8">
        Réessayer
      </button>
    </div>
  );
}
