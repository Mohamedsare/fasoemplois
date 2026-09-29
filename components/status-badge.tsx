import { APPLICATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { ApplicationStatus, PaymentStatus } from "@/lib/types";

// Forme (symbole) + libellé : l'information ne repose jamais sur la couleur seule.
const APP_STYLES: Record<ApplicationStatus, { icon: string; className: string }> = {
  envoyee: { icon: "●", className: "border-ink/30 text-ink" },
  consultee: { icon: "◉", className: "border-ink/30 text-ink" },
  en_cours: { icon: "◐", className: "border-star-400 bg-star-400/15 text-ink" },
  retenue: { icon: "✓", className: "border-brand-600 bg-brand-50 text-brand-800" },
  refusee: { icon: "✕", className: "border-accent-500/50 text-accent-600" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = APP_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}>
      <span aria-hidden>{s.icon}</span>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

const PAY_STYLES: Record<PaymentStatus, { icon: string; className: string }> = {
  pending: { icon: "◐", className: "border-star-400 bg-star-400/15 text-ink" },
  paid: { icon: "✓", className: "border-brand-600 bg-brand-50 text-brand-800" },
  failed: { icon: "✕", className: "border-accent-500/50 text-accent-600" },
  expired: { icon: "⏱", className: "border-ink/30 text-muted" },
  cancelled: { icon: "–", className: "border-ink/30 text-muted" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAY_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}>
      <span aria-hidden>{s.icon}</span>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SubscriptionBadge({ active, cancelled }: { active: boolean; cancelled?: boolean }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-star-400 bg-star-400/15 px-2.5 py-0.5 text-xs font-medium">
        <span aria-hidden>⏱</span> Expiré
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-600 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
      <span aria-hidden>●</span> {cancelled ? "Actif · non renouvelé" : "Actif"}
    </span>
  );
}
