import { BRAND } from "@/lib/brand";

/** Filigrane « Aperçu » posé sur le CV des utilisateurs sans abonnement (le PDF, lui, est propre). */
export function PreviewWatermark() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute inset-[-50%] flex -rotate-30 flex-col justify-around">
        {Array.from({ length: 12 }, (_, i) => (
          <p
            key={i}
            className="text-center text-[clamp(1.25rem,5vw,2.75rem)] font-extrabold tracking-widest whitespace-nowrap text-ink/[0.07] uppercase"
          >
            Aperçu · {BRAND.name} · Aperçu · {BRAND.name}
          </p>
        ))}
      </div>
    </div>
  );
}
