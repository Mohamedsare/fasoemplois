import { Archive, CircleCheck, Clock, PencilLine, type LucideIcon } from "lucide-react";
import type { Job } from "./types";

export type DisplayStatus = "publie" | "programme" | "brouillon" | "archive";

export function displayStatus(job: Pick<Job, "status" | "published_at">): DisplayStatus {
  if (job.status === "publie" && job.published_at && new Date(job.published_at).getTime() > Date.now()) return "programme";
  return job.status;
}

export const DISPLAY_STATUS: Record<DisplayStatus, { label: string; icon: LucideIcon; className: string }> = {
  publie: { label: "Publié", icon: CircleCheck, className: "border-brand-600 bg-brand-50 text-brand-800" },
  programme: { label: "Programmé", icon: Clock, className: "border-star-400 bg-star-400/15 text-ink" },
  brouillon: { label: "Brouillon", icon: PencilLine, className: "border-ink/30 text-ink" },
  archive: { label: "Archivé", icon: Archive, className: "border-ink/20 text-muted" },
};
