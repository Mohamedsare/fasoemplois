import { Check, Clock, Heart, Lock, MoreHorizontal, Search, X } from "lucide-react";
import { initials } from "@/lib/format";

export function CompanyLogo({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- logos externes (Supabase Storage)
    return <img src={url} alt="" style={style} className="shrink-0 rounded-lg border border-line bg-white object-contain" />;
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: size * 0.36 }}
      className="grid shrink-0 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700"
    >
      {initials(name)}
    </span>
  );
}

export function LockIcon({ className = "size-5" }: { className?: string }) {
  return <Lock aria-hidden className={className} />;
}

export function LockBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 border-brand-600 bg-white text-brand-600 ${
        size === "sm" ? "size-7" : "size-11"
      }`}
    >
      <LockIcon className={size === "sm" ? "size-3.5" : "size-5"} />
    </span>
  );
}

export function HeartIcon({ filled, className = "size-5" }: { filled?: boolean; className?: string }) {
  return <Heart aria-hidden className={className} fill={filled ? "currentColor" : "none"} />;
}

export function CheckCircle({ tone = "brand" }: { tone?: "brand" | "muted" | "danger" | "warn" }) {
  const bg = { brand: "bg-brand-600", muted: "bg-muted", danger: "bg-accent-600", warn: "bg-star-400 text-ink" }[tone];
  const Icon = { brand: Check, muted: MoreHorizontal, danger: X, warn: Clock }[tone];
  return (
    <span aria-hidden className={`grid size-14 place-items-center rounded-full text-white ${bg}`}>
      <Icon className="size-7" strokeWidth={3} />
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span aria-hidden className="mb-4 grid size-16 place-items-center rounded-full bg-surface text-muted">
        <Search className="size-7" />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
