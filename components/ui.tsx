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
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
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
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.2 4.2 2.4h2c.6-1.2 2-2.4 4.2-2.4 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function CheckCircle({ tone = "brand" }: { tone?: "brand" | "muted" | "danger" | "warn" }) {
  const bg = { brand: "bg-brand-600", muted: "bg-muted", danger: "bg-accent-600", warn: "bg-star-400 text-ink" }[tone];
  const icon = { brand: "✓", muted: "…", danger: "✕", warn: "⏱" }[tone];
  return (
    <span aria-hidden className={`grid size-14 place-items-center rounded-full text-2xl font-bold text-white ${bg}`}>
      {icon}
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
      <span aria-hidden className="mb-4 grid size-16 place-items-center rounded-full bg-surface text-2xl">🔍</span>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
