import { Lock } from "lucide-react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * Aperçu protégé pour les utilisateurs sans abonnement : une capture d'écran n'est pas utilisable.
 * 1. Filigrane nominatif (« Aperçu · e-mail de l'utilisateur ») sur tout le CV ;
 * 2. Bas du CV flouté, avec un bouton pour débloquer.
 * Le PDF des abonnés, lui, est propre. Les tailles suivent la largeur de l'aperçu (unités cqw).
 * Le parent doit avoir une largeur définie (pas « w-fit ») : un conteneur de requêtes ne s'ajuste pas à son contenu.
 */
export function LockedPreview({ locked, label, children }: { locked: boolean; label: string; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  const text = `Aperçu · ${label} · ${BRAND.name}`;
  return (
    <div className="@container relative isolate overflow-hidden rounded-lg select-none">
      {children}

      {/* 1. Filigrane nominatif, répété en diagonale */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div className="absolute -inset-x-1/2 -top-1/4 flex -rotate-30 flex-col gap-[9cqw]">
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i} className="text-center text-[4.2cqw] font-extrabold tracking-wider whitespace-nowrap text-ink/[0.09] uppercase">
              {text} · {text}
            </p>
          ))}
        </div>
      </div>

      {/* 2. Suite du CV floutée */}
      <div className="absolute inset-x-0 top-[42%] bottom-0 z-20 flex flex-col items-center">
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-white/0 via-white/70 to-white/90 backdrop-blur-[1.6cqw] [mask-image:linear-gradient(to_bottom,transparent,black_10%)]"
        />
        <div className="relative mt-[10cqw] flex max-w-[80%] flex-col items-center gap-[2.5cqw] rounded-[3cqw] bg-white/95 px-[5cqw] py-[4cqw] text-center shadow-lg ring-1 ring-line">
          <span className="grid size-[9cqw] min-h-6 min-w-6 place-items-center rounded-full bg-ink text-star-400">
            <Lock aria-hidden className="size-1/2" />
          </span>
          <p className="text-[clamp(0.7rem,3.6cqw,1.25rem)] leading-snug font-semibold">La suite de votre CV est réservée aux abonnés</p>
          <Link
            href="/abonnements?pdf=1"
            className="btn-primary px-[4cqw] py-[1.8cqw] text-[clamp(0.7rem,3cqw,1rem)] whitespace-nowrap"
          >
            Débloquer mon CV complet
          </Link>
        </div>
      </div>
    </div>
  );
}
