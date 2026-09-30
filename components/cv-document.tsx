import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { CvDraft, CvEntry } from "@/lib/types";

/**
 * Rendu A4 d'un CV (210 × 297 mm), identique à l'écran, dans l'aperçu et à l'impression PDF.
 * Unités en mm / pt pour une mise en page stable quel que soit l'écran.
 */
export function CvDocument({ cv, photoUrl }: { cv: CvDraft; photoUrl?: string | null }) {
  const props = { cv, photoUrl: cv.photo_path ? photoUrl ?? null : null };
  if (cv.template === "classique") return <Classique {...props} />;
  if (cv.template === "epure") return <Epure {...props} />;
  return <Moderne {...props} />;
}

type Props = { cv: CvDraft; photoUrl: string | null };

const PAGE: React.CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  boxSizing: "border-box",
  fontSize: "9.5pt",
  lineHeight: 1.45,
  color: "#1c1f23",
  background: "#fff",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

/** Description : lignes « - » en puces, sinon paragraphes. */
function Description({ text, bulletColor }: { text: string; bulletColor: string }) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const bullets = lines.filter((l) => /^[-•]\s*/.test(l));
  if (bullets.length === lines.length) {
    return (
      <ul style={{ margin: "1.2mm 0 0", padding: 0, listStyle: "none" }}>
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
    <div style={{ marginTop: "1.2mm" }}>
      {lines.map((l, i) => (
        <p key={i} style={{ margin: i ? "0.8mm 0 0" : 0 }}>{l.replace(/^[-•]\s*/, "")}</p>
      ))}
    </div>
  );
}

function period(e: CvEntry) {
  return [e.start, e.end].filter(Boolean).join(" – ");
}

function Photo({ url, size, radius = "50%", ring }: { url: string; size: string; radius?: string; ring?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL signée Supabase, rendue telle quelle à l'impression
    <img
      src={url}
      alt=""
      style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", display: "block", border: ring ? `1mm solid ${ring}` : undefined }}
    />
  );
}

function Contact({ cv, color, iconColor, stacked }: { cv: CvDraft; color: string; iconColor: string; stacked?: boolean }) {
  const items = [
    cv.email && { icon: Mail, value: cv.email },
    cv.phone && { icon: Phone, value: cv.phone },
    cv.city && { icon: MapPin, value: cv.city },
    cv.website && { icon: Globe, value: cv.website.replace(/^https?:\/\//, "") },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", flexWrap: "wrap", gap: stacked ? "1.8mm" : "1mm 5mm", color, fontSize: "8.5pt" }}>
      {items.map(({ icon: Icon, value }) => (
        <span key={value} style={{ display: "flex", alignItems: "center", gap: "1.8mm", wordBreak: "break-word" }}>
          <Icon aria-hidden style={{ width: "3.2mm", height: "3.2mm", color: iconColor, flexShrink: 0 }} />
          {value}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modèle « Moderne » : colonne latérale teintée avec photo
// ---------------------------------------------------------------------------
function SideTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h3 style={{ margin: "0 0 2.5mm", fontSize: "8pt", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>{children}</h3>
  );
}

function MainTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3mm", display: "flex", alignItems: "center", gap: "3mm", fontSize: "10pt", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>
      {children}
      <span style={{ flex: 1, height: "0.3mm", background: `color-mix(in srgb, ${accent} 35%, white)` }} />
    </h2>
  );
}

function ModerneEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "4mm", alignItems: "baseline" }}>
            <strong style={{ fontSize: "10pt" }}>{e.title}</strong>
            {period(e) && <span style={{ fontSize: "8pt", color: "#5b6470", whiteSpace: "nowrap" }}>{period(e)}</span>}
          </div>
          {e.organization && <div style={{ color: accent, fontWeight: 600, fontSize: "9pt" }}>{e.organization}</div>}
          {e.description && <Description text={e.description} bulletColor={accent} />}
        </div>
      ))}
    </div>
  );
}

function Moderne({ cv, photoUrl }: Props) {
  const a = cv.accent;
  const tint = `color-mix(in srgb, ${a} 9%, white)`;

  return (
    <div
      style={{
        ...PAGE,
        display: "grid",
        gridTemplateColumns: "68mm 1fr",
        // Dégradé plutôt que fond de colonne : la teinte continue sur les pages suivantes à l'impression
        background: `linear-gradient(to right, ${tint} 68mm, #fff 68mm)`,
      }}
    >
      <aside style={{ padding: "14mm 7mm 12mm 9mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
        {photoUrl && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Photo url={photoUrl} size="38mm" ring="#fff" />
          </div>
        )}
        <section>
          <SideTitle accent={a}>Contact</SideTitle>
          <Contact cv={cv} color="#1c1f23" iconColor={a} stacked />
        </section>
        {cv.skills.length > 0 && (
          <section>
            <SideTitle accent={a}>Compétences</SideTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5mm" }}>
              {cv.skills.map((s) => (
                <span key={s} style={{ background: "#fff", border: `0.25mm solid color-mix(in srgb, ${a} 30%, white)`, borderRadius: "1.5mm", padding: "0.6mm 2mm", fontSize: "8pt" }}>{s}</span>
              ))}
            </div>
          </section>
        )}
        {cv.languages.length > 0 && (
          <section>
            <SideTitle accent={a}>Langues</SideTitle>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "1.2mm", fontSize: "8.5pt" }}>
              {cv.languages.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </section>
        )}
        {cv.interests.length > 0 && (
          <section>
            <SideTitle accent={a}>Centres d&apos;intérêt</SideTitle>
            <p style={{ margin: 0, fontSize: "8.5pt" }}>{cv.interests.join(" · ")}</p>
          </section>
        )}
      </aside>

      <main style={{ padding: "14mm 12mm 12mm 10mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
        <header>
          <h1 style={{ margin: 0, fontSize: "24pt", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.01em" }}>{cv.full_name || "Votre nom"}</h1>
          {cv.headline && <p style={{ margin: "2mm 0 0", fontSize: "12pt", color: a, fontWeight: 600 }}>{cv.headline}</p>}
          {cv.summary && <p style={{ margin: "4mm 0 0", color: "#3a4048" }}>{cv.summary}</p>}
        </header>
        {cv.experiences.length > 0 && (
          <section>
            <MainTitle accent={a}>Expériences</MainTitle>
            <ModerneEntries items={cv.experiences} accent={a} />
          </section>
        )}
        {cv.education.length > 0 && (
          <section>
            <MainTitle accent={a}>Formation</MainTitle>
            <ModerneEntries accent={a} items={cv.education} />
          </section>
        )}
        {cv.certifications.length > 0 && (
          <section>
            <MainTitle accent={a}>Certifications</MainTitle>
            <ModerneEntries accent={a} items={cv.certifications} />
          </section>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modèle « Classique » : une colonne, en-tête centré, filets fins
// ---------------------------------------------------------------------------
function ClassiqueTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 2.5mm", paddingBottom: "1mm", borderBottom: `0.4mm solid ${accent}`, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "11.5pt", fontWeight: 700, color: "#1c1f23" }}>
      {children}
    </h2>
  );
}

function ClassiqueEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "36mm 1fr", gap: "4mm", breakInside: "avoid" }}>
          <span style={{ fontSize: "8pt", color: "#5b6470", paddingTop: "0.5mm" }}>{period(e)}</span>
          <div>
            <strong>{e.title}</strong>
            {e.organization && <span style={{ color: accent, fontWeight: 600 }}> · {e.organization}</span>}
            {e.description && <Description text={e.description} bulletColor={accent} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Classique({ cv, photoUrl }: Props) {
  const a = cv.accent;

  return (
    <div style={{ ...PAGE, padding: "16mm 18mm 14mm", display: "flex", flexDirection: "column", gap: "6mm" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "7mm", justifyContent: photoUrl ? "flex-start" : "center", textAlign: photoUrl ? "left" : "center" }}>
        {photoUrl && <Photo url={photoUrl} size="30mm" />}
        <div style={{ flex: photoUrl ? 1 : undefined }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "25pt", fontWeight: 700, letterSpacing: "0.02em" }}>{cv.full_name || "Votre nom"}</h1>
          {cv.headline && <p style={{ margin: "1.5mm 0 3mm", fontSize: "11.5pt", color: a, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{cv.headline}</p>}
          <div style={{ display: "flex", justifyContent: photoUrl ? "flex-start" : "center" }}>
            <Contact cv={cv} color="#3a4048" iconColor={a} />
          </div>
        </div>
      </header>
      {cv.summary && (
        <section>
          <ClassiqueTitle accent={a}>Profil</ClassiqueTitle>
          <p style={{ margin: 0 }}>{cv.summary}</p>
        </section>
      )}
      {cv.experiences.length > 0 && (
        <section>
          <ClassiqueTitle accent={a}>Expériences professionnelles</ClassiqueTitle>
          <ClassiqueEntries accent={a} items={cv.experiences} />
        </section>
      )}
      {cv.education.length > 0 && (
        <section>
          <ClassiqueTitle accent={a}>Formation</ClassiqueTitle>
          <ClassiqueEntries accent={a} items={cv.education} />
        </section>
      )}
      {cv.certifications.length > 0 && (
        <section>
          <ClassiqueTitle accent={a}>Certifications</ClassiqueTitle>
          <ClassiqueEntries accent={a} items={cv.certifications} />
        </section>
      )}
      {(cv.skills.length > 0 || cv.languages.length > 0 || cv.interests.length > 0) && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(50mm, 1fr))", gap: "6mm", breakInside: "avoid" }}>
          {cv.skills.length > 0 && (
            <div>
              <ClassiqueTitle accent={a}>Compétences</ClassiqueTitle>
              <p style={{ margin: 0 }}>{cv.skills.join(" · ")}</p>
            </div>
          )}
          {cv.languages.length > 0 && (
            <div>
              <ClassiqueTitle accent={a}>Langues</ClassiqueTitle>
              <p style={{ margin: 0 }}>{cv.languages.join(" · ")}</p>
            </div>
          )}
          {cv.interests.length > 0 && (
            <div>
              <ClassiqueTitle accent={a}>Centres d&apos;intérêt</ClassiqueTitle>
              <p style={{ margin: 0 }}>{cv.interests.join(" · ")}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modèle « Épuré » : libellés en marge, beaucoup d'air
// ---------------------------------------------------------------------------
function EpureRow({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "grid", gridTemplateColumns: "36mm 1fr", gap: "6mm", breakInside: "avoid" }}>
      <h2 style={{ margin: "0.6mm 0 0", fontSize: "8pt", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: accent }}>{label}</h2>
      <div>{children}</div>
    </section>
  );
}

function EpureEntries({ items }: { items: CvEntry[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "4mm", alignItems: "baseline" }}>
            <span style={{ fontWeight: 600, fontSize: "10pt" }}>{e.title}</span>
            {period(e) && <span style={{ fontSize: "8pt", color: "#8a929c", whiteSpace: "nowrap" }}>{period(e)}</span>}
          </div>
          {e.organization && <div style={{ color: "#5b6470" }}>{e.organization}</div>}
          {e.description && <Description text={e.description} bulletColor="#8a929c" />}
        </div>
      ))}
    </div>
  );
}

function Epure({ cv, photoUrl }: Props) {
  const a = cv.accent;

  return (
    <div style={{ ...PAGE, padding: "18mm 18mm 14mm", display: "flex", flexDirection: "column", gap: "8mm" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8mm", paddingBottom: "7mm", borderBottom: "0.25mm solid #e3e6ea" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28pt", lineHeight: 1.05, fontWeight: 300, letterSpacing: "-0.02em" }}>
            {cv.full_name || "Votre nom"}
          </h1>
          {cv.headline && <p style={{ margin: "2.5mm 0 4mm", fontSize: "11pt", color: a, fontWeight: 500 }}>{cv.headline}</p>}
          <Contact cv={cv} color="#5b6470" iconColor="#8a929c" />
        </div>
        {photoUrl && <Photo url={photoUrl} size="28mm" radius="3mm" />}
      </header>
      {cv.summary && (
        <EpureRow accent={a} label="Profil">
          <p style={{ margin: 0, color: "#3a4048" }}>{cv.summary}</p>
        </EpureRow>
      )}
      {cv.experiences.length > 0 && <EpureRow accent={a} label="Expériences"><EpureEntries items={cv.experiences} /></EpureRow>}
      {cv.education.length > 0 && <EpureRow accent={a} label="Formation"><EpureEntries items={cv.education} /></EpureRow>}
      {cv.certifications.length > 0 && <EpureRow accent={a} label="Certifications"><EpureEntries items={cv.certifications} /></EpureRow>}
      {cv.skills.length > 0 && (
        <EpureRow accent={a} label="Compétences">
          <p style={{ margin: 0 }}>{cv.skills.join("  ·  ")}</p>
        </EpureRow>
      )}
      {cv.languages.length > 0 && (
        <EpureRow accent={a} label="Langues">
          <p style={{ margin: 0 }}>{cv.languages.join("  ·  ")}</p>
        </EpureRow>
      )}
      {cv.interests.length > 0 && (
        <EpureRow accent={a} label="Intérêts">
          <p style={{ margin: 0 }}>{cv.interests.join("  ·  ")}</p>
        </EpureRow>
      )}
    </div>
  );
}
