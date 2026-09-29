"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { expirePayment } from "@/app/actions/payments";

/** Compte à rebours + rafraîchissement régulier (confirmation par webhook). */
export function PendingWatcher({ reference, expiresAt }: { reference: string; expiresAt: string }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => router.refresh(), 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [router]);

  useEffect(() => {
    if (remaining === 0) expirePayment(reference).then(() => router.refresh());
  }, [remaining, reference, router]);

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <p className="text-xs text-muted" aria-live="polite">
      expire dans <span className="font-mono">{mm}:{ss}</span>
    </p>
  );
}
