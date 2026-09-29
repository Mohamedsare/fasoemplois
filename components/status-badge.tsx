import { Check, CircleDot, CircleDashed, Clock, Eye, Minus, Send, X, type LucideIcon } from "lucide-react";
import { APPLICATION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { ApplicationStatus, PaymentStatus } from "@/lib/types";

// Icône + libellé : l'information ne repose jamais sur la couleur seule.
const APP_STYLES: Record<ApplicationStatus, { icon: LucideIcon; className: string }> = {
  envoyee: { icon: Send, className: "border-ink/30 text-ink" },
  consultee: { icon: Eye, className: "border-ink/30 text-ink" },
  en_cours: { icon: CircleDashed, className: "border-star-400 bg-star-400/15 text-ink" },
  retenue: { icon: Check, className: "border-brand-600 bg-brand-50 text-brand-800" },
  refusee: { icon: X, className: "border-accent-500/50 text-accent-600" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const s = APP_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}>
      <s.icon aria-hidden className="size-3.5" />
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

const PAY_STYLES: Record<PaymentStatus, { icon: LucideIcon; className: string }> = {
  pending: { icon: CircleDashed, className: "border-star-400 bg-star-400/15 text-ink" },
  paid: { icon: Check, className: "border-brand-600 bg-brand-50 text-brand-800" },
  failed: { icon: X, className: "border-accent-500/50 text-accent-600" },
  expired: { icon: Clock, className: "border-ink/30 text-muted" },
  cancelled: { icon: Minus, className: "border-ink/30 text-muted" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAY_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}>
      <s.icon aria-hidden className="size-3.5" />
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function SubscriptionBadge({ active, cancelled }: { active: boolean; cancelled?: boolean }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-star-400 bg-star-400/15 px-2.5 py-0.5 text-xs font-medium">
        <Clock aria-hidden className="size-3.5" /> Expiré
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-600 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
      <CircleDot aria-hidden className="size-3.5" /> {cancelled ? "Actif · non renouvelé" : "Actif"}
    </span>
  );
}
