"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/candidate";
import { HeartIcon } from "./ui";

export function FavoriteButton({ jobId, isFavorite }: { jobId: string; isFavorite: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleFavorite(jobId, window.location.pathname + window.location.search);
        })
      }
      aria-pressed={optimistic}
      aria-label={optimistic ? "Retirer des favoris" : "Enregistrer l'offre"}
      className={`relative z-10 rounded-full p-1.5 transition-colors hover:bg-surface ${
        optimistic ? "text-accent-500" : "text-muted"
      }`}
    >
      <HeartIcon filled={optimistic} className="size-5" />
    </button>
  );
}
