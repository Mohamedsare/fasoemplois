import "server-only";

/** Marque d'ordre des octets : Excel lit alors le fichier en UTF-8. */
const BOM = String.fromCharCode(0xfeff);

/** Réponse CSV compatible Excel (séparateur « ; », BOM UTF-8 pour les accents). */
export function csvResponse(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(BOM + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
