import type { CvDraft, CvEntry } from "@/lib/types";
import type { SectionKey, TemplateSpec } from "@/lib/template-spec";
import { SECTION_LABELS } from "@/lib/template-spec";
import {
  BODY,
  Contact,
  Description,
  FONTS,
  INK,
  LINE,
  MUTED,
  PAGE,
  Portrait,
  StackedList,
  displayName,
  parseSkills,
  period,
  shade,
  tint,
} from "./shared";

/**
 * Moteur de rendu des modèles créés par l'IA : interprète une fiche de style validée (sanitizeSpec).
 * Aucun code ni HTML ne vient de l'IA : uniquement des choix parmi des valeurs connues.
 */

const DARK_SIDE = "#17191e";

type Ctx = {
  spec: TemplateSpec;
  a: string;
  heading: string | undefined;
  /** Colonne sombre ou pleine couleur : texte clair */
  dark: boolean;
  gap: string;
  entryGap: string;
};

const FONT_OF: Record<TemplateSpec["headingFont"], string | undefined> = {
  sans: undefined,
  geometric: FONTS.heading,
  serif: FONTS.serif,
  display: FONTS.display,
  classic: FONTS.classic,
};

const DENSITY = {
  compact: { size: "8.8pt", line: 1.38, gap: "5mm", entryGap: "3mm", pad: 11 },
  normal: { size: "9.5pt", line: 1.45, gap: "7mm", entryGap: "4.5mm", pad: 14 },
  airy: { size: "9.8pt", line: 1.55, gap: "8.5mm", entryGap: "5.5mm", pad: 17 },
} as const;

function hasContent(cv: CvDraft, key: SectionKey) {
  switch (key) {
    case "summary":
      return Boolean(cv.summary);
    case "contact":
      return Boolean(cv.email || cv.phone || cv.city || cv.website);
    default:
      return cv[key].length > 0;
  }
}

// ---------------------------------------------------------------------------
// Titres de section
// ---------------------------------------------------------------------------
function SectionTitle({ ctx, n, children, inSidebar }: { ctx: Ctx; n: number; children: React.ReactNode; inSidebar?: boolean }) {
  const { spec, a, heading } = ctx;
  const onDark = inSidebar && ctx.dark;
  const color = onDark ? (spec.sidebarStyle === "dark" ? tint(a, 55) : "#fff") : spec.titleColor === "accent" ? a : INK;
  const lineColor = onDark ? "rgba(255,255,255,0.35)" : tint(a, 40);
  const base: React.CSSProperties = {
    margin: "0 0 3mm",
    fontFamily: heading,
    fontSize: inSidebar ? "9pt" : "10.5pt",
    fontWeight: 700,
    letterSpacing: spec.titleUppercase ? "0.12em" : "0.01em",
    textTransform: spec.titleUppercase ? "uppercase" : "none",
    color,
    breakAfter: "avoid",
  };
  const style = inSidebar && spec.sectionTitle !== "plain" ? "underline" : spec.sectionTitle;
  switch (style) {
    case "underline":
      return <h2 style={{ ...base, paddingBottom: "1.2mm", borderBottom: `0.35mm solid ${onDark ? lineColor : a}` }}>{children}</h2>;
    case "bar":
      return (
        <h2 style={{ ...base, display: "flex", alignItems: "center", gap: "2.5mm" }}>
          <span style={{ width: "1.2mm", height: "4.5mm", background: a, borderRadius: "0.5mm", flexShrink: 0 }} />
          {children}
        </h2>
      );
    case "line":
      return (
        <h2 style={{ ...base, display: "flex", alignItems: "center", gap: "3mm" }}>
          {children}
          <span style={{ flex: 1, height: "0.3mm", background: lineColor }} />
        </h2>
      );
    case "filled":
      return <h2 style={{ ...base, background: tint(a, 12), color: shade(a, 75), padding: "1.3mm 3mm", borderRadius: "1.5mm" }}>{children}</h2>;
    case "diamond":
      return (
        <h2 style={{ ...base, display: "flex", alignItems: "center", gap: "2.5mm" }}>
          <span style={{ width: "2.4mm", height: "2.4mm", background: a, transform: "rotate(45deg)", flexShrink: 0 }} />
          {children}
        </h2>
      );
    case "numbered":
      return (
        <h2 style={{ ...base, display: "flex", alignItems: "baseline", gap: "2.5mm" }}>
          <span style={{ color: tint(a, 65), fontSize: "0.85em" }}>{String(n).padStart(2, "0")}</span>
          {children}
        </h2>
      );
    case "centered":
      return (
        <h2 style={{ ...base, display: "flex", alignItems: "center", gap: "4mm" }}>
          <span style={{ flex: 1, height: "0.25mm", background: lineColor }} />
          {children}
          <span style={{ flex: 1, height: "0.25mm", background: lineColor }} />
        </h2>
      );
    default:
      return <h2 style={base}>{children}</h2>;
  }
}

// ---------------------------------------------------------------------------
// Expériences, formation, certifications
// ---------------------------------------------------------------------------
function DateText({ ctx, e }: { ctx: Ctx; e: CvEntry }) {
  const p = period(e);
  if (!p) return null;
  const { a, spec } = ctx;
  if (spec.dateStyle === "pill") {
    return <span style={{ fontSize: "7.5pt", fontWeight: 600, whiteSpace: "nowrap", background: tint(a, 11), color: shade(a, 70), borderRadius: "10mm", padding: "0.7mm 2.4mm" }}>{p}</span>;
  }
  return <span style={{ fontSize: "8pt", whiteSpace: "nowrap", fontWeight: spec.dateStyle === "accent" ? 700 : 400, color: spec.dateStyle === "accent" ? a : MUTED }}>{p}</span>;
}

function EntryHead({ ctx, e }: { ctx: Ctx; e: CvEntry }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", alignItems: "baseline" }}>
        <strong style={{ fontSize: "1.05em", fontFamily: ctx.heading }}>{e.title}</strong>
        {ctx.spec.entryStyle !== "dates-left" && ctx.spec.entryStyle !== "timeline" && <DateText ctx={ctx} e={e} />}
      </div>
      {e.organization && <div style={{ color: ctx.a, fontWeight: 600 }}>{e.organization}</div>}
      {e.description && <Description text={e.description} bulletColor={ctx.a} color={BODY} />}
    </>
  );
}

function Entries({ ctx, items }: { ctx: Ctx; items: CvEntry[] }) {
  const { spec, a } = ctx;
  if (spec.entryStyle === "timeline") {
    return (
      <div style={{ paddingLeft: "7mm", borderLeft: `0.5mm solid ${tint(a, 35)}`, marginLeft: "1.6mm", display: "flex", flexDirection: "column", gap: ctx.entryGap }}>
        {items.map((e, i) => (
          <div key={i} style={{ position: "relative", breakInside: "avoid" }}>
            <span style={{ position: "absolute", left: "-9.1mm", top: "0.6mm", width: "3.4mm", height: "3.4mm", borderRadius: "50%", background: "#fff", border: `0.9mm solid ${a}`, boxSizing: "border-box" }} />
            <div><DateText ctx={{ ...ctx, spec: { ...spec, dateStyle: spec.dateStyle === "pill" ? "accent" : spec.dateStyle } }} e={e} /></div>
            <EntryHead ctx={ctx} e={e} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ctx.entryGap }}>
      {items.map((e, i) =>
        spec.entryStyle === "dates-left" ? (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "28mm 1fr", gap: "4mm", breakInside: "avoid" }}>
            <span style={{ paddingTop: "0.5mm" }}><DateText ctx={ctx} e={e} /></span>
            <div><EntryHead ctx={ctx} e={e} /></div>
          </div>
        ) : spec.entryStyle === "cards" ? (
          <div key={i} style={{ breakInside: "avoid", border: `0.3mm solid ${LINE}`, borderLeft: `1mm solid ${a}`, borderRadius: "2mm", padding: "3mm 4mm", background: "#fff" }}>
            <EntryHead ctx={ctx} e={e} />
          </div>
        ) : (
          <div key={i} style={{ breakInside: "avoid" }}>
            <EntryHead ctx={ctx} e={e} />
          </div>
        ),
      )}
    </div>
  );
}

/** Formation et certifications en version courte (colonne latérale). */
function CompactEntries({ ctx, items }: { ctx: Ctx; items: CvEntry[] }) {
  const muted = ctx.dark ? "rgba(255,255,255,0.7)" : MUTED;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5mm", fontSize: "8.5pt" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ fontWeight: 700 }}>{e.title}</div>
          {e.organization && <div style={{ color: muted }}>{e.organization}</div>}
          {period(e) && <div style={{ color: muted, fontSize: "7.5pt" }}>{period(e)}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compétences
// ---------------------------------------------------------------------------
function Skills({ ctx, skills, inSidebar }: { ctx: Ctx; skills: string[]; inSidebar: boolean }) {
  const { a, spec } = ctx;
  const onDark = inSidebar && ctx.dark;
  const { categorized, plain } = parseSkills(skills);
  const detail = onDark ? "rgba(255,255,255,0.8)" : BODY;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8mm", fontSize: inSidebar ? "8.5pt" : "9pt" }}>
      {categorized.map(({ category, detail: d }) => (
        <div key={category + d} style={inSidebar ? { breakInside: "avoid" } : { display: "grid", gridTemplateColumns: "48mm 1fr", gap: "4mm", breakInside: "avoid" }}>
          <span style={{ fontWeight: 700, color: onDark ? "#fff" : inSidebar ? a : INK }}>{category}</span>
          <span style={{ display: "block", color: detail }}>{d}</span>
        </div>
      ))}
      {plain.length > 0 &&
        (spec.skillStyle === "tags" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5mm" }}>
            {plain.map((s) => (
              <span
                key={s}
                style={{
                  background: onDark ? "rgba(255,255,255,0.12)" : tint(a, 10),
                  border: onDark ? "0.25mm solid rgba(255,255,255,0.25)" : `0.25mm solid ${tint(a, 30)}`,
                  color: onDark ? "#fff" : INK,
                  borderRadius: "1.5mm",
                  padding: "0.6mm 2mm",
                  fontSize: "8pt",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        ) : spec.skillStyle === "inline" ? (
          <p style={{ margin: 0, color: detail }}>{plain.join("  ·  ")}</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", columns: inSidebar ? 1 : 2, columnGap: "8mm", color: detail }}>
            {plain.map((s) => (
              <li key={s} style={{ display: "flex", gap: "2mm", marginBottom: "0.8mm", breakInside: "avoid" }}>
                <span style={{ color: onDark ? "#fff" : a, flexShrink: 0 }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenu d'une section
// ---------------------------------------------------------------------------
function SectionBody({ ctx, cv, k, inSidebar }: { ctx: Ctx; cv: CvDraft; k: SectionKey; inSidebar: boolean }) {
  const onDark = inSidebar && ctx.dark;
  const text = onDark ? "rgba(255,255,255,0.9)" : undefined;
  switch (k) {
    case "summary":
      return <p style={{ margin: 0, color: BODY }}>{cv.summary}</p>;
    case "contact":
      return <Contact cv={cv} color={onDark ? "#fff" : INK} iconColor={onDark ? "rgba(255,255,255,0.8)" : ctx.a} stacked={inSidebar} />;
    case "skills":
      return <Skills ctx={ctx} skills={cv.skills} inSidebar={inSidebar} />;
    case "languages":
    case "interests":
      return inSidebar ? <StackedList items={cv[k]} color={text} /> : <p style={{ margin: 0 }}>{cv[k].join("  ·  ")}</p>;
    default:
      return inSidebar ? <CompactEntries ctx={ctx} items={cv[k]} /> : <Entries ctx={ctx} items={cv[k]} />;
  }
}

// ---------------------------------------------------------------------------
// En-tête
// ---------------------------------------------------------------------------
function NameBlock({ ctx, cv, light, center, withContact }: { ctx: Ctx; cv: CvDraft; light: boolean; center: boolean; withContact: boolean }) {
  const { spec, a, heading } = ctx;
  const headlineColor = light ? "rgba(255,255,255,0.85)" : spec.headlineStyle === "accent" ? a : MUTED;
  return (
    <div style={{ minWidth: 0, textAlign: center ? "center" : "left" }}>
      <h1
        style={{
          margin: 0,
          fontFamily: heading,
          fontSize: `${spec.nameSize}pt`,
          lineHeight: 1.08,
          fontWeight: spec.nameWeight,
          letterSpacing: spec.nameUppercase ? "0.03em" : "-0.01em",
          textTransform: spec.nameUppercase ? "uppercase" : "none",
          color: light ? "#fff" : INK,
        }}
      >
        {displayName(cv)}
      </h1>
      {cv.headline && (
        <p
          style={{
            margin: "2mm 0 0",
            fontSize: spec.headlineStyle === "spaced" ? "9pt" : "11pt",
            fontWeight: 600,
            letterSpacing: spec.headlineStyle === "spaced" ? "0.22em" : 0,
            textTransform: spec.headlineStyle === "spaced" ? "uppercase" : "none",
            color: headlineColor,
          }}
        >
          {cv.headline}
        </p>
      )}
      {withContact && (
        <div style={{ marginTop: "4mm", display: "flex", justifyContent: center ? "center" : "flex-start" }}>
          <Contact cv={cv} color={light ? "rgba(255,255,255,0.85)" : BODY} iconColor={light ? "rgba(255,255,255,0.75)" : a} />
        </div>
      )}
    </div>
  );
}

function Header({ ctx, cv, photoUrl, contactInHeader }: { ctx: Ctx; cv: CvDraft; photoUrl: string | null; contactInHeader: boolean }) {
  const { spec, a } = ctx;
  // Bandeau sans couleur choisie : sombre par défaut
  const colored = spec.header === "band" && spec.headerColor === "none" ? "dark" : spec.header === "band" || spec.header === "card" ? spec.headerColor : "none";
  const bg = colored === "tint" ? tint(a, 9) : colored === "accent" ? a : colored === "dark" ? shade(a, 25) : undefined;
  const light = colored === "accent" || colored === "dark";
  const radius = spec.photoShape === "circle" ? "50%" : spec.photoShape === "rounded" ? "3mm" : "0";
  const showPhoto = spec.photo === "header";
  const photo = showPhoto ? (
    <Portrait cv={cv} url={photoUrl} size={`${spec.photoSize}mm`} radius={radius} ring={light ? "rgba(255,255,255,0.85)" : undefined} bg={light ? "rgba(255,255,255,0.18)" : a} color="#fff" font={ctx.heading} />
  ) : null;
  const center = spec.header === "centered";

  let content: React.ReactNode;
  if (center) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4mm" }}>
        {photo}
        <NameBlock ctx={ctx} cv={cv} light={light} center withContact={contactInHeader} />
      </div>
    );
  } else if (spec.header === "split") {
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: "6mm" }}>
        {photo}
        <div style={{ flex: 1 }}><NameBlock ctx={ctx} cv={cv} light={light} center={false} withContact={false} /></div>
        {contactInHeader && (
          <div style={{ maxWidth: "70mm" }}>
            <Contact cv={cv} color={light ? "rgba(255,255,255,0.85)" : BODY} iconColor={light ? "rgba(255,255,255,0.75)" : a} stacked size="8pt" />
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <div style={{ display: "flex", alignItems: "center", gap: "7mm" }}>
        {spec.header === "band" && photo}
        <div style={{ flex: 1 }}><NameBlock ctx={ctx} cv={cv} light={light} center={false} withContact={contactInHeader} /></div>
        {spec.header !== "band" && photo}
      </div>
    );
  }

  if (spec.header === "band") {
    return <header style={{ background: bg, padding: "11mm 14mm 10mm" }}>{content}</header>;
  }
  if (spec.header === "card") {
    return <header style={{ background: bg ?? tint(a, 9), borderRadius: "4mm", padding: "7mm 8mm" }}>{content}</header>;
  }
  return <header style={{ paddingBottom: spec.sectionTitle === "plain" ? "5mm" : 0, borderBottom: spec.sectionTitle === "plain" ? `0.25mm solid ${LINE}` : undefined }}>{content}</header>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function CustomTemplate({ cv, photoUrl, spec }: { cv: CvDraft; photoUrl: string | null; spec: TemplateSpec }) {
  const a = cv.accent;
  const dens = DENSITY[spec.density];
  const hasSidebar = spec.layout !== "single";
  const ctx: Ctx = {
    spec,
    a,
    heading: FONT_OF[spec.headingFont],
    dark: hasSidebar && (spec.sidebarStyle === "accent" || spec.sidebarStyle === "dark"),
    gap: dens.gap,
    entryGap: dens.entryGap,
  };

  const sideKeys = hasSidebar ? spec.sidebarSections.filter((k) => hasContent(cv, k)) : [];
  const contactInHeader = !sideKeys.includes("contact");
  const mainKeys = spec.mainOrder.filter((k) => !sideKeys.includes(k) && k !== "contact" && hasContent(cv, k));

  const soft = spec.background === "soft";
  const sideW = `${spec.sidebarWidth}mm`;
  const sideBg = spec.sidebarStyle === "tint" ? tint(a, 9) : spec.sidebarStyle === "accent" ? a : spec.sidebarStyle === "dark" ? DARK_SIDE : "#fff";
  const pageBg = soft ? "#f3f4f6" : "#fff";
  // Dégradé plutôt que fond de colonne : la couleur continue sur les pages suivantes à l'impression
  const background = hasSidebar
    ? `linear-gradient(to ${spec.layout === "sidebar-left" ? "right" : "left"}, ${sideBg} ${sideW}, ${pageBg} ${sideW})`
    : pageBg;
  const pad = dens.pad;

  const card: React.CSSProperties | undefined = soft ? { background: "#fff", borderRadius: "3mm", padding: "5mm 5.5mm", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" } : undefined;
  const radius = spec.photoShape === "circle" ? "50%" : spec.photoShape === "rounded" ? "3mm" : "0";
  const sidePhoto = hasSidebar && spec.photo === "sidebar";
  const band = spec.header === "band";

  const mainColumn = (
    <main style={{ padding: hasSidebar ? `${band ? 9 : pad}mm ${pad - 2}mm ${pad - 2}mm ${pad - 3}mm` : 0, display: "flex", flexDirection: "column", gap: dens.gap, minWidth: 0 }}>
      {!band && <Header ctx={ctx} cv={cv} photoUrl={photoUrl} contactInHeader={contactInHeader} />}
      {mainKeys.map((k, i) => (
        <section key={k} style={card}>
          <SectionTitle ctx={ctx} n={i + 1}>{SECTION_LABELS[k]}</SectionTitle>
          <SectionBody ctx={ctx} cv={cv} k={k} inSidebar={false} />
        </section>
      ))}
    </main>
  );

  const sideColumn = hasSidebar ? (
    <aside
      style={{
        padding: `${band ? 9 : pad}mm ${pad - 6}mm ${pad - 2}mm ${pad - 4}mm`,
        display: "flex",
        flexDirection: "column",
        gap: dens.gap,
        color: ctx.dark ? "#fff" : INK,
        borderRight: spec.sidebarStyle === "plain" && spec.layout === "sidebar-left" ? `0.3mm solid ${LINE}` : undefined,
        borderLeft: spec.sidebarStyle === "plain" && spec.layout === "sidebar-right" ? `0.3mm solid ${LINE}` : undefined,
      }}
    >
      {sidePhoto && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Portrait
            cv={cv}
            url={photoUrl}
            size={`${spec.photoSize}mm`}
            radius={radius}
            ring={ctx.dark ? "rgba(255,255,255,0.85)" : "#fff"}
            bg={ctx.dark ? "rgba(255,255,255,0.15)" : a}
            color="#fff"
            font={ctx.heading}
          />
        </div>
      )}
      {sideKeys.map((k, i) => (
        <section key={k}>
          <SectionTitle ctx={ctx} n={i + 1} inSidebar>{SECTION_LABELS[k]}</SectionTitle>
          <SectionBody ctx={ctx} cv={cv} k={k} inSidebar />
        </section>
      ))}
    </aside>
  ) : null;

  return (
    <div
      style={{
        ...PAGE,
        fontSize: dens.size,
        lineHeight: dens.line,
        fontFamily: spec.bodyFont === "serif" ? FONTS.serif : undefined,
        background,
        borderTop: spec.accentBar === "top" ? `2.5mm solid ${a}` : undefined,
        borderLeft: spec.accentBar === "left" ? `2.5mm solid ${a}` : undefined,
        padding: hasSidebar ? 0 : `${band ? 0 : pad}mm ${band ? 0 : pad + 2}mm ${pad}mm`,
      }}
    >
      {band && <Header ctx={ctx} cv={cv} photoUrl={photoUrl} contactInHeader={contactInHeader} />}
      {hasSidebar ? (
        <div style={{ display: "grid", gridTemplateColumns: spec.layout === "sidebar-left" ? `${sideW} 1fr` : `1fr ${sideW}` }}>
          {spec.layout === "sidebar-left" ? (
            <>
              {sideColumn}
              {mainColumn}
            </>
          ) : (
            <>
              {mainColumn}
              {sideColumn}
            </>
          )}
        </div>
      ) : band ? (
        <div style={{ padding: `9mm ${pad + 2}mm 0` }}>{mainColumn}</div>
      ) : (
        mainColumn
      )}
    </div>
  );
}
