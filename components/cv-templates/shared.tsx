import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { Lora, Montserrat, Playfair_Display } from "next/font/google";
import type { CvDraft, CvEntry } from "@/lib/types";

// Polices des modèles premium (polices variables, chargées uniquement quand un CV les utilise)
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false });

export const FONTS = {
  display: playfair.style.fontFamily,
  heading: montserrat.style.fontFamily,
  serif: lora.style.fontFamily,
  classic: "Georgia, 'Times New Roman', serif",
};

export type TemplateProps = { cv: CvDraft; photoUrl: string | null };

// Les titres des CV sont des <div role="heading"> et non des <h1>/<h2> : un CV affiché en exemple sur une page
// (accueil, galerie, guides) ne doit pas concurrencer les vrais titres de la page pour les moteurs de recherche.

export const INK = "#1c1f23";
export const BODY = "#3a4048";
export const MUTED = "#5b6470";
export const SOFT = "#8a929c";
export const LINE = "#e3e6ea";

/** Mélange une couleur avec du blanc (p = part de la couleur, en %). */
export const tint = (color: string, p: number) => `color-mix(in srgb, ${color} ${p}%, white)`;
/** Mélange une couleur avec un gris très sombre. */
export const shade = (color: string, p: number) => `color-mix(in srgb, ${color} ${p}%, #111418)`;

export const PAGE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  fontSize: "9.5pt",
  lineHeight: 1.45,
  color: INK,
  background: "#fff",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

export const displayName = (cv: CvDraft) => cv.full_name || "Votre nom";

export function period(e: CvEntry) {
  return [e.start, e.end].filter(Boolean).join(" – ");
}

/** Description : lignes « - » en puces, sinon paragraphes. */
export function Description({ text, bulletColor, color }: { text: string; bulletColor: string; color?: string }) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const bullets = lines.filter((l) => /^[-•]\s*/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul style={{ margin: "1.2mm 0 0", padding: 0, listStyle: "none", color }}>
        {lines.map((l, i) => (
          <li key={i} style={{ display: "flex", gap: "2mm", marginTop: "0.6mm" }}>
            <span style={{ color: bulletColor, flexShrink: 0 }}>•</span>
            <span>{l.replace(/^[-•]\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div style={{ marginTop: "1.2mm", color }}>
      {lines.map((l, i) => (
        <p key={i} style={{ margin: i ? "0.8mm 0 0" : 0 }}>{l.replace(/^[-•]\s*/, "")}</p>
      ))}
    </div>
  );
}

export function Photo({ url, size, radius = "50%", ring }: { url: string; size: string; radius?: string; ring?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL signée Supabase, rendue telle quelle à l'impression
    <img
      src={url}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
        border: ring ? `1mm solid ${ring}` : undefined,
        boxSizing: "border-box",
      }}
    />
  );
}

/** Initiales à la place de la photo (modèles qui mettent le portrait en avant). */
export function Initials({
  cv,
  size,
  bg,
  color,
  radius = "50%",
  font,
  ring,
}: {
  cv: CvDraft;
  size: string;
  bg: string;
  color: string;
  radius?: string;
  font?: string;
  ring?: string;
}) {
  const letters =
    cv.full_name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "CV";
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: font,
        fontWeight: 700,
        fontSize: `calc(${size} * 0.36)`,
        letterSpacing: "0.04em",
        border: ring ? `1mm solid ${ring}` : undefined,
        boxSizing: "border-box",
      }}
    >
      {letters}
    </span>
  );
}

/** Photo si disponible, sinon initiales. */
export function Portrait(props: {
  cv: CvDraft;
  url: string | null;
  size: string;
  radius?: string;
  ring?: string;
  bg: string;
  color: string;
  font?: string;
}) {
  const { url, size, radius, ring } = props;
  return url ? <Photo url={url} size={size} radius={radius} ring={ring} /> : <Initials {...props} />;
}

/**
 * Adresse e-mail ou lien coupés proprement quand la colonne est étroite :
 * avant « @ » et après « . » ou « / » (jamais au milieu d'un mot).
 */
function breakable(value: string) {
  return value.split(/(?<=[./])|(?=@)/).flatMap((part, i) => (i ? [<wbr key={i} />, part] : [part]));
}

export function Contact({
  cv,
  color,
  iconColor,
  stacked,
  size = "8.5pt",
}: {
  cv: CvDraft;
  color: string;
  iconColor: string;
  stacked?: boolean;
  size?: string;
}) {
  const items = [
    cv.email && { icon: Mail, value: cv.email },
    cv.phone && { icon: Phone, value: cv.phone },
    cv.city && { icon: MapPin, value: cv.city },
    cv.website && { icon: Globe, value: cv.website.replace(/^https?:\/\//, "") },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", flexWrap: "wrap", gap: stacked ? "1.8mm" : "1mm 5mm", color, fontSize: size }}>
      {items.map(({ icon: Icon, value }) => (
        <span key={value} style={{ display: "flex", alignItems: "center", gap: "1.8mm", minWidth: 0 }}>
          <Icon aria-hidden style={{ width: "3.2mm", height: "3.2mm", color: iconColor, flexShrink: 0 }} />
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{breakable(value)}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compétences : s'adapte au contenu (catégories « Catégorie : éléments », mots-clés courts, phrases)
// ---------------------------------------------------------------------------
export function parseSkills(skills: string[]) {
  const categorized: { category: string; detail: string }[] = [];
  const plain: string[] = [];
  for (const s of skills) {
    const i = s.indexOf(":");
    if (i > 0 && i <= 45 && s.slice(i + 1).trim()) categorized.push({ category: s.slice(0, i).trim(), detail: s.slice(i + 1).trim() });
    else plain.push(s);
  }
  return { categorized, plain, allShort: plain.every((p) => p.length <= 28) };
}

/**
 * Variante « main » (pleine largeur) ou « side » (colonne étroite).
 * `dark` : colonne sombre ou colorée (texte clair).
 */
export function SkillsBlock({
  skills,
  accent,
  variant,
  dark = false,
  tagBg,
}: {
  skills: string[];
  accent: string;
  variant: "main" | "side";
  dark?: boolean;
  /** Fond des étiquettes (mots-clés courts en colonne) */
  tagBg?: string;
}) {
  const { categorized, plain, allShort } = parseSkills(skills);
  const side = variant === "side";
  const strong = dark ? "#fff" : side ? accent : INK;
  const detail = dark ? "rgba(255,255,255,0.78)" : BODY;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: side ? "2.2mm" : "1.6mm", fontSize: side ? "8.5pt" : "9pt" }}>
      {categorized.map(({ category, detail: d }) => (
        <div
          key={category + d}
          style={side ? { breakInside: "avoid" } : { display: "grid", gridTemplateColumns: "52mm 1fr", gap: "4mm", breakInside: "avoid" }}
        >
          <span style={{ fontWeight: 700, color: strong }}>{category}</span>
          <span style={{ display: "block", color: detail }}>{d}</span>
        </div>
      ))}
      {plain.length > 0 &&
        (side && allShort ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5mm", marginTop: categorized.length ? "1mm" : 0 }}>
            {plain.map((s) => (
              <span
                key={s}
                style={{
                  background: tagBg ?? (dark ? "rgba(255,255,255,0.12)" : "#fff"),
                  border: dark ? "0.25mm solid rgba(255,255,255,0.25)" : `0.25mm solid ${tint(accent, 30)}`,
                  color: dark ? "#fff" : INK,
                  borderRadius: "1.5mm",
                  padding: "0.6mm 2mm",
                  fontSize: "8pt",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : allShort ? (
          <p style={{ margin: 0, color: dark ? detail : undefined }}>{plain.join("  ·  ")}</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", columns: side ? 1 : 2, columnGap: "8mm", color: dark ? detail : undefined }}>
            {plain.map((s) => (
              <li key={s} style={{ display: "flex", gap: "2mm", marginBottom: "1mm", breakInside: "avoid" }}>
                <span style={{ color: dark ? "#fff" : accent, flexShrink: 0 }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

/** Liste simple (langues, centres d'intérêt) en colonne. */
export function StackedList({ items, color, size = "8.5pt" }: { items: string[]; color?: string; size?: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "1.2mm", fontSize: size, color }}>
      {items.map((l) => <li key={l}>{l}</li>)}
    </ul>
  );
}
