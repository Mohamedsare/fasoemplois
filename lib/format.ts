const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const numberFormatter = new Intl.NumberFormat("fr-FR");

export function formatDate(value: string | Date) {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** 29/09 */
export function formatShortDate(value: string | Date) {
  return shortDateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** 22/09 · 10:14 */
export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value)).replace(" ", " · ");
}

/** 1 200 */
export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPrice(value: number) {
  return `${formatNumber(value)} FCFA`;
}

/** « il y a 2 j », « aujourd'hui »… */
export function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  return `le ${formatShortDate(value)}`;
}

/** Retire les caractères qui ont un sens dans les filtres PostgREST (.or, ilike). */
export function sanitizeSearch(value: string) {
  return value.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
}

export function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function nullable(formData: FormData, key: string) {
  return str(formData, key) || null;
}

/** « a, b\nc » → ["a", "b", "c"] */
export function strList(formData: FormData, key: string, max = 30) {
  return str(formData, key)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function param(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Date ISO d'il y a `days` jours (calcul hors rendu). */
export function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
