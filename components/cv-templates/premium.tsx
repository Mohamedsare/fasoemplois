import type { CvDraft, CvEntry } from "@/lib/types";
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
  SOFT,
  SkillsBlock,
  StackedList,
  displayName,
  period,
  shade,
  tint,
  type TemplateProps,
} from "./shared";

// Modèles premium (inclus dans les abonnements)

/** Sections principales dans l'ordre habituel d'un CV. */
function mainSections(cv: CvDraft) {
  return [
    { key: "exp", title: "Expériences professionnelles", short: "Expériences", items: cv.experiences },
    { key: "edu", title: "Formation", short: "Formation", items: cv.education },
    { key: "cert", title: "Certifications", short: "Certifications", items: cv.certifications },
  ].filter((s) => s.items.length > 0);
}

// ---------------------------------------------------------------------------
// Exécutif : bandeau sombre, photo cerclée, colonne latérale à droite
// ---------------------------------------------------------------------------
function ExecTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3mm", display: "flex", alignItems: "center", gap: "2.5mm", fontFamily: FONTS.heading, fontSize: "10pt", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: INK }}>
      <span style={{ width: "2.6mm", height: "2.6mm", background: accent, transform: "rotate(45deg)", flexShrink: 0 }} />
      {children}
    </h2>
  );
}

function ExecEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "4mm", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "10.5pt" }}>{e.title}</div>
              {e.organization && <div style={{ color: accent, fontWeight: 600 }}>{e.organization}</div>}
            </div>
            {period(e) && (
              <span style={{ fontSize: "7.5pt", fontWeight: 600, whiteSpace: "nowrap", background: tint(accent, 10), color: shade(accent, 70), borderRadius: "10mm", padding: "0.8mm 2.6mm" }}>
                {period(e)}
              </span>
            )}
          </div>
          {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
        </div>
      ))}
    </div>
  );
}

export function Executif({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  const side = tint(a, 7);
  return (
    <div style={{ ...PAGE, background: `linear-gradient(to left, ${side} 64mm, #fff 64mm)` }}>
      <header style={{ background: shade(a, 28), color: "#fff", padding: "12mm 14mm 11mm", display: "flex", alignItems: "center", gap: "8mm" }}>
        <Portrait cv={cv} url={photoUrl} size="34mm" ring={a} bg={shade(a, 45)} color="#fff" font={FONTS.heading} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: "25pt", lineHeight: 1.08, fontWeight: 800, letterSpacing: "0.01em", textTransform: "uppercase" }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "2.5mm 0 0", fontSize: "10pt", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: tint(a, 55) }}>{cv.headline}</p>}
          <div style={{ marginTop: "5mm" }}>
            <Contact cv={cv} color="rgba(255,255,255,0.85)" iconColor={tint(a, 60)} />
          </div>
        </div>
      </header>
      <div style={{ height: "1.6mm", background: a }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 64mm" }}>
        <main style={{ padding: "9mm 9mm 12mm 14mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
          {cv.summary && (
            <section>
              <ExecTitle accent={a}>Profil</ExecTitle>
              <p style={{ margin: 0, color: BODY }}>{cv.summary}</p>
            </section>
          )}
          {mainSections(cv).map((s) => (
            <section key={s.key}>
              <ExecTitle accent={a}>{s.short}</ExecTitle>
              <ExecEntries items={s.items} accent={a} />
            </section>
          ))}
        </main>
        <aside style={{ padding: "9mm 10mm 12mm 7mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
          {cv.skills.length > 0 && (
            <section>
              <ExecTitle accent={a}>Compétences</ExecTitle>
              <SkillsBlock skills={cv.skills} accent={a} variant="side" />
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <ExecTitle accent={a}>Langues</ExecTitle>
              <StackedList items={cv.languages} />
            </section>
          )}
          {cv.interests.length > 0 && (
            <section>
              <ExecTitle accent={a}>Intérêts</ExecTitle>
              <StackedList items={cv.interests} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Élégance : typographie à empattements, en-tête centré, ornements fins
// ---------------------------------------------------------------------------
function Ornament({ accent }: { accent: string }) {
  return (
    <div aria-hidden style={{ display: "flex", alignItems: "center", gap: "3mm", margin: "5mm auto 0", width: "70mm" }}>
      <span style={{ flex: 1, height: "0.25mm", background: tint(accent, 60) }} />
      <span style={{ width: "2mm", height: "2mm", border: `0.35mm solid ${accent}`, transform: "rotate(45deg)" }} />
      <span style={{ flex: 1, height: "0.25mm", background: tint(accent, 60) }} />
    </div>
  );
}

function EleganceTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3.5mm", display: "flex", alignItems: "center", gap: "4mm", fontFamily: FONTS.display, fontSize: "11.5pt", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: INK }}>
      <span style={{ flex: 1, height: "0.25mm", background: tint(accent, 45) }} />
      {children}
      <span style={{ flex: 1, height: "0.25mm", background: tint(accent, 45) }} />
    </h2>
  );
}

function EleganceEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "4mm", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "11pt" }}>{e.title}</span>
            {period(e) && <span style={{ fontSize: "8pt", letterSpacing: "0.08em", color: MUTED, whiteSpace: "nowrap" }}>{period(e)}</span>}
          </div>
          {e.organization && <div style={{ fontStyle: "italic", color: accent }}>{e.organization}</div>}
          {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
        </div>
      ))}
    </div>
  );
}

export function Elegance({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={{ ...PAGE, fontFamily: FONTS.serif, padding: "15mm 20mm 14mm", display: "flex", flexDirection: "column", gap: "6.5mm" }}>
      <header style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {photoUrl && (
          <div style={{ padding: "1.2mm", border: `0.3mm solid ${tint(a, 55)}`, borderRadius: "50%", marginBottom: "4mm" }}>
            <Portrait cv={cv} url={photoUrl} size="28mm" bg={a} color="#fff" />
          </div>
        )}
        <h1 style={{ margin: 0, fontFamily: FONTS.display, fontSize: "29pt", lineHeight: 1.1, fontWeight: 600, letterSpacing: "0.03em" }}>{displayName(cv)}</h1>
        {cv.headline && <p style={{ margin: "2.5mm 0 0", fontSize: "9pt", letterSpacing: "0.3em", textTransform: "uppercase", color: a }}>{cv.headline}</p>}
        <div style={{ marginTop: "4mm", display: "flex", justifyContent: "center" }}>
          <Contact cv={cv} color={MUTED} iconColor={a} />
        </div>
        <Ornament accent={a} />
      </header>
      {cv.summary && <p style={{ margin: 0, textAlign: "center", fontStyle: "italic", color: BODY, fontSize: "10pt", padding: "0 6mm" }}>{cv.summary}</p>}
      {mainSections(cv).map((s) => (
        <section key={s.key}>
          <EleganceTitle accent={a}>{s.title}</EleganceTitle>
          <EleganceEntries items={s.items} accent={a} />
        </section>
      ))}
      {cv.skills.length > 0 && (
        <section>
          <EleganceTitle accent={a}>Compétences</EleganceTitle>
          <SkillsBlock skills={cv.skills} accent={a} variant="main" />
        </section>
      )}
      {(cv.languages.length > 0 || cv.interests.length > 0) && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60mm, 1fr))", gap: "10mm", breakInside: "avoid" }}>
          {cv.languages.length > 0 && (
            <div>
              <EleganceTitle accent={a}>Langues</EleganceTitle>
              <p style={{ margin: 0, textAlign: "center" }}>{cv.languages.join(" · ")}</p>
            </div>
          )}
          {cv.interests.length > 0 && (
            <div>
              <EleganceTitle accent={a}>Intérêts</EleganceTitle>
              <p style={{ margin: 0, textAlign: "center" }}>{cv.interests.join(" · ")}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizon : colonne pleine couleur, texte blanc
// ---------------------------------------------------------------------------
function HorizonSideTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: "0 0 2.8mm", paddingBottom: "1.5mm", borderBottom: "0.3mm solid rgba(255,255,255,0.35)", fontFamily: FONTS.heading, fontSize: "8.5pt", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff" }}>
      {children}
    </h3>
  );
}

function HorizonTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3.5mm", fontFamily: FONTS.heading, fontSize: "12pt", fontWeight: 800, color: INK }}>
      {children}
      <span style={{ display: "block", width: "12mm", height: "0.9mm", background: accent, marginTop: "1.5mm", borderRadius: "1mm" }} />
    </h2>
  );
}

function HorizonEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4.5mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          {period(e) && <div style={{ fontSize: "7.5pt", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accent }}>{period(e)}</div>}
          <div style={{ fontWeight: 700, fontSize: "10.5pt" }}>{e.title}</div>
          {e.organization && <div style={{ color: MUTED, fontWeight: 600 }}>{e.organization}</div>}
          {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
        </div>
      ))}
    </div>
  );
}

export function Horizon({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={{ ...PAGE, display: "grid", gridTemplateColumns: "70mm 1fr", background: `linear-gradient(to right, ${a} 70mm, #fff 70mm)` }}>
      <aside style={{ padding: "14mm 8mm 12mm 9mm", display: "flex", flexDirection: "column", gap: "7mm", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Portrait cv={cv} url={photoUrl} size="40mm" ring="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.18)" color="#fff" font={FONTS.heading} />
        </div>
        <section>
          <HorizonSideTitle>Contact</HorizonSideTitle>
          <Contact cv={cv} color="#fff" iconColor="rgba(255,255,255,0.8)" stacked />
        </section>
        {cv.skills.length > 0 && (
          <section>
            <HorizonSideTitle>Compétences</HorizonSideTitle>
            <SkillsBlock skills={cv.skills} accent={a} variant="side" dark />
          </section>
        )}
        {cv.languages.length > 0 && (
          <section>
            <HorizonSideTitle>Langues</HorizonSideTitle>
            <StackedList items={cv.languages} color="rgba(255,255,255,0.9)" />
          </section>
        )}
        {cv.interests.length > 0 && (
          <section>
            <HorizonSideTitle>Intérêts</HorizonSideTitle>
            <StackedList items={cv.interests} color="rgba(255,255,255,0.9)" />
          </section>
        )}
      </aside>
      <main style={{ padding: "16mm 12mm 12mm 11mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
        <header>
          <h1 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: "26pt", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.01em" }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "2.5mm 0 0", fontFamily: FONTS.heading, fontSize: "11.5pt", fontWeight: 600, color: a }}>{cv.headline}</p>}
          {cv.summary && (
            <p style={{ margin: "5mm 0 0", paddingLeft: "4mm", borderLeft: `0.9mm solid ${tint(a, 45)}`, color: BODY }}>{cv.summary}</p>
          )}
        </header>
        {mainSections(cv).map((s) => (
          <section key={s.key}>
            <HorizonTitle accent={a}>{s.short}</HorizonTitle>
            <HorizonEntries items={s.items} accent={a} />
          </section>
        ))}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parcours : frise chronologique
// ---------------------------------------------------------------------------
function Timeline({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ position: "relative", paddingLeft: "8mm", borderLeft: `0.5mm solid ${tint(accent, 35)}`, marginLeft: "1.6mm", display: "flex", flexDirection: "column", gap: "4.5mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ position: "relative", breakInside: "avoid" }}>
          <span style={{ position: "absolute", left: "-10.1mm", top: "0.6mm", width: "3.6mm", height: "3.6mm", borderRadius: "50%", background: "#fff", border: `0.9mm solid ${accent}`, boxSizing: "border-box" }} />
          {period(e) && <div style={{ fontSize: "8pt", fontWeight: 700, color: accent }}>{period(e)}</div>}
          <div style={{ fontWeight: 700, fontSize: "10.5pt" }}>
            {e.title}
            {e.organization && <span style={{ fontWeight: 500, color: MUTED }}> — {e.organization}</span>}
          </div>
          {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
        </div>
      ))}
    </div>
  );
}

function ParcoursTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3.5mm", fontFamily: FONTS.heading, fontSize: "10.5pt", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{children}</h2>
  );
}

export function Parcours({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={{ ...PAGE, padding: "13mm 15mm 13mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
      <header style={{ background: tint(a, 8), borderRadius: "4mm", padding: "7mm 8mm", display: "flex", alignItems: "center", gap: "7mm" }}>
        {photoUrl && <Portrait cv={cv} url={photoUrl} size="30mm" radius="3.5mm" bg={a} color="#fff" />}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: "23pt", lineHeight: 1.08, fontWeight: 800 }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "1.5mm 0 3.5mm", fontSize: "11pt", fontWeight: 600, color: a }}>{cv.headline}</p>}
          <Contact cv={cv} color={BODY} iconColor={a} />
        </div>
      </header>
      {cv.summary && (
        <section>
          <ParcoursTitle accent={a}>Profil</ParcoursTitle>
          <p style={{ margin: 0, color: BODY }}>{cv.summary}</p>
        </section>
      )}
      {mainSections(cv).map((s) => (
        <section key={s.key}>
          <ParcoursTitle accent={a}>{s.title}</ParcoursTitle>
          <Timeline items={s.items} accent={a} />
        </section>
      ))}
      {cv.skills.length > 0 && (
        <section>
          <ParcoursTitle accent={a}>Compétences</ParcoursTitle>
          <SkillsBlock skills={cv.skills} accent={a} variant="main" />
        </section>
      )}
      {(cv.languages.length > 0 || cv.interests.length > 0) && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60mm, 1fr))", gap: "8mm", breakInside: "avoid" }}>
          {cv.languages.length > 0 && (
            <div>
              <ParcoursTitle accent={a}>Langues</ParcoursTitle>
              <p style={{ margin: 0 }}>{cv.languages.join(" · ")}</p>
            </div>
          )}
          {cv.interests.length > 0 && (
            <div>
              <ParcoursTitle accent={a}>Centres d&apos;intérêt</ParcoursTitle>
              <p style={{ margin: 0 }}>{cv.interests.join(" · ")}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Créatif : en-tête graphique, titres numérotés
// ---------------------------------------------------------------------------
function CreatifTitle({ accent, n, children }: { accent: string; n: number; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3.5mm", display: "flex", alignItems: "baseline", gap: "2.5mm", fontFamily: FONTS.heading, fontSize: "12.5pt", fontWeight: 800, color: INK }}>
      <span style={{ fontSize: "9pt", fontWeight: 800, color: tint(accent, 70) }}>{String(n).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

function CreatifSideTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return <h3 style={{ margin: "0 0 2.5mm", fontFamily: FONTS.heading, fontSize: "9pt", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{children}</h3>;
}

export function Creatif({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  const sections = mainSections(cv);
  const first = cv.summary ? 2 : 1;
  return (
    <div style={{ ...PAGE, fontFamily: FONTS.heading, fontSize: "9pt" }}>
      <header style={{ position: "relative", overflow: "hidden", background: a, color: "#fff", padding: "14mm 60mm 13mm 14mm", borderBottomRightRadius: "22mm" }}>
        <span aria-hidden style={{ position: "absolute", right: "-18mm", top: "-24mm", width: "70mm", height: "70mm", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <span aria-hidden style={{ position: "absolute", right: "30mm", bottom: "-20mm", width: "34mm", height: "34mm", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <h1 style={{ position: "relative", margin: 0, fontSize: "28pt", lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.02em" }}>{displayName(cv)}</h1>
        {cv.headline && <p style={{ position: "relative", margin: "3mm 0 0", fontSize: "11pt", fontWeight: 500, color: "rgba(255,255,255,0.88)" }}>{cv.headline}</p>}
        <div style={{ position: "absolute", right: "14mm", top: "50%", transform: "translateY(-50%)" }}>
          <Portrait cv={cv} url={photoUrl} size="38mm" ring="#fff" bg={shade(a, 60)} color="#fff" font={FONTS.heading} />
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 62mm", gap: "9mm", padding: "10mm 13mm 12mm 14mm" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: "7mm" }}>
          {cv.summary && (
            <section>
              <CreatifTitle accent={a} n={1}>À propos</CreatifTitle>
              <p style={{ margin: 0, color: BODY, lineHeight: 1.55 }}>{cv.summary}</p>
            </section>
          )}
          {sections.map((s, i) => (
            <section key={s.key}>
              <CreatifTitle accent={a} n={first + i}>{s.short}</CreatifTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "4.5mm" }}>
                {s.items.map((e, i) => (
                  <div key={i} style={{ breakInside: "avoid" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700, fontSize: "10pt" }}>{e.title}</span>
                      {period(e) && <span style={{ fontSize: "7.5pt", color: SOFT, whiteSpace: "nowrap" }}>{period(e)}</span>}
                    </div>
                    {e.organization && <div style={{ color: a, fontWeight: 600 }}>{e.organization}</div>}
                    {e.description && <Description text={e.description} bulletColor={a} color={BODY} />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
        <aside style={{ display: "flex", flexDirection: "column", gap: "7mm" }}>
          <section>
            <CreatifSideTitle accent={a}>Contact</CreatifSideTitle>
            <Contact cv={cv} color={INK} iconColor={a} stacked />
          </section>
          {cv.skills.length > 0 && (
            <section>
              <CreatifSideTitle accent={a}>Compétences</CreatifSideTitle>
              <SkillsBlock skills={cv.skills} accent={a} variant="side" tagBg={tint(a, 10)} />
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <CreatifSideTitle accent={a}>Langues</CreatifSideTitle>
              <StackedList items={cv.languages} />
            </section>
          )}
          {cv.interests.length > 0 && (
            <section>
              <CreatifSideTitle accent={a}>Intérêts</CreatifSideTitle>
              <StackedList items={cv.interests} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prestige : colonne sombre, titres à empattements
// ---------------------------------------------------------------------------
const PRESTIGE_DARK = "#17191e";

function PrestigeSideTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h3 style={{ margin: "0 0 3mm", fontFamily: FONTS.display, fontSize: "11.5pt", fontWeight: 600, color: tint(accent, 55) }}>
      {children}
      <span style={{ display: "block", width: "10mm", height: "0.3mm", background: tint(accent, 55), marginTop: "1.5mm" }} />
    </h3>
  );
}

function PrestigeTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3.5mm", display: "flex", alignItems: "center", gap: "3mm", fontFamily: FONTS.display, fontSize: "14pt", fontWeight: 600, color: INK }}>
      {children}
      <span style={{ flex: 1, height: "0.25mm", background: tint(accent, 40) }} />
    </h2>
  );
}

export function Prestige({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  const light = tint(a, 55);
  return (
    <div style={{ ...PAGE, display: "grid", gridTemplateColumns: "72mm 1fr", background: `linear-gradient(to right, ${PRESTIGE_DARK} 72mm, #fff 72mm)` }}>
      <aside style={{ padding: "14mm 8mm 12mm 10mm", display: "flex", flexDirection: "column", gap: "7.5mm", color: "#e8eaed" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "1.4mm", border: `0.4mm solid ${light}`, borderRadius: "2mm" }}>
            <Portrait cv={cv} url={photoUrl} size="40mm" radius="1.2mm" bg="#262a31" color={light} font={FONTS.display} />
          </div>
        </div>
        <section>
          <PrestigeSideTitle accent={a}>Contact</PrestigeSideTitle>
          <Contact cv={cv} color="#e8eaed" iconColor={light} stacked />
        </section>
        {cv.skills.length > 0 && (
          <section>
            <PrestigeSideTitle accent={a}>Compétences</PrestigeSideTitle>
            <SkillsBlock skills={cv.skills} accent={a} variant="side" dark />
          </section>
        )}
        {cv.languages.length > 0 && (
          <section>
            <PrestigeSideTitle accent={a}>Langues</PrestigeSideTitle>
            <StackedList items={cv.languages} color="#e8eaed" />
          </section>
        )}
        {cv.interests.length > 0 && (
          <section>
            <PrestigeSideTitle accent={a}>Intérêts</PrestigeSideTitle>
            <StackedList items={cv.interests} color="#e8eaed" />
          </section>
        )}
      </aside>
      <main style={{ padding: "16mm 13mm 12mm 11mm", display: "flex", flexDirection: "column", gap: "7mm" }}>
        <header>
          <h1 style={{ margin: 0, fontFamily: FONTS.display, fontSize: "28pt", lineHeight: 1.08, fontWeight: 700 }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "2.5mm 0 0", fontSize: "9pt", fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: MUTED }}>{cv.headline}</p>}
          <span style={{ display: "block", width: "18mm", height: "0.8mm", background: a, marginTop: "5mm" }} />
          {cv.summary && <p style={{ margin: "5mm 0 0", color: BODY }}>{cv.summary}</p>}
        </header>
        {mainSections(cv).map((s) => (
          <section key={s.key}>
            <PrestigeTitle accent={a}>{s.short}</PrestigeTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "4.5mm" }}>
              {s.items.map((e, i) => (
                <div key={i} style={{ breakInside: "avoid" }}>
                  <div style={{ fontWeight: 700, fontSize: "10.5pt" }}>{e.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", fontSize: "8.5pt" }}>
                    <span style={{ color: a, fontWeight: 600 }}>{e.organization}</span>
                    {period(e) && <span style={{ color: SOFT, whiteSpace: "nowrap" }}>{period(e)}</span>}
                  </div>
                  {e.description && <Description text={e.description} bulletColor={a} color={BODY} />}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact : dense, deux colonnes, pour les longues carrières
// ---------------------------------------------------------------------------
function CompactTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 2.5mm", paddingBottom: "1mm", borderBottom: `0.5mm solid ${accent}`, fontSize: "9pt", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: INK }}>
      {children}
    </h2>
  );
}

function CompactEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", alignItems: "baseline" }}>
            <strong style={{ fontSize: "9.5pt" }}>{e.title}</strong>
            {period(e) && <span style={{ fontSize: "7.5pt", color: MUTED, whiteSpace: "nowrap" }}>{period(e)}</span>}
          </div>
          {e.organization && <div style={{ color: accent, fontStyle: "italic" }}>{e.organization}</div>}
          {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
        </div>
      ))}
    </div>
  );
}

export function Compact({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={{ ...PAGE, fontSize: "8.8pt", lineHeight: 1.38, borderTop: `3mm solid ${a}`, padding: "10mm 13mm 11mm", display: "flex", flexDirection: "column", gap: "5.5mm" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "6mm" }}>
        {photoUrl && <Portrait cv={cv} url={photoUrl} size="24mm" bg={a} color="#fff" />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "21pt", lineHeight: 1.1, fontWeight: 800 }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "1mm 0 0", fontSize: "10.5pt", fontWeight: 600, color: a }}>{cv.headline}</p>}
        </div>
        <div style={{ maxWidth: "70mm" }}>
          <Contact cv={cv} color={BODY} iconColor={a} stacked size="8pt" />
        </div>
      </header>
      {cv.summary && <p style={{ margin: 0, background: tint(a, 7), borderRadius: "2mm", padding: "3.5mm 4.5mm", color: BODY }}>{cv.summary}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 58mm", gap: "8mm" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
          {cv.experiences.length > 0 && (
            <section>
              <CompactTitle accent={a}>Expériences professionnelles</CompactTitle>
              <CompactEntries items={cv.experiences} accent={a} />
            </section>
          )}
          {cv.certifications.length > 0 && (
            <section>
              <CompactTitle accent={a}>Certifications</CompactTitle>
              <CompactEntries items={cv.certifications} accent={a} />
            </section>
          )}
        </main>
        <aside style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
          {cv.education.length > 0 && (
            <section>
              <CompactTitle accent={a}>Formation</CompactTitle>
              <CompactEntries items={cv.education} accent={a} />
            </section>
          )}
          {cv.skills.length > 0 && (
            <section>
              <CompactTitle accent={a}>Compétences</CompactTitle>
              <SkillsBlock skills={cv.skills} accent={a} variant="side" tagBg={tint(a, 8)} />
            </section>
          )}
          {cv.languages.length > 0 && (
            <section>
              <CompactTitle accent={a}>Langues</CompactTitle>
              <StackedList items={cv.languages} size="8.5pt" />
            </section>
          )}
          {cv.interests.length > 0 && (
            <section>
              <CompactTitle accent={a}>Intérêts</CompactTitle>
              <StackedList items={cv.interests} size="8.5pt" />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corporate : en-tête teinté, colonne de dates, rigueur
// ---------------------------------------------------------------------------
function CorporateTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 3mm", paddingBottom: "1.5mm", borderBottom: `0.25mm solid ${LINE}`, display: "flex", alignItems: "center", gap: "2.5mm", fontSize: "10.5pt", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK }}>
      <span style={{ width: "1.2mm", height: "4.5mm", background: accent, borderRadius: "0.5mm" }} />
      {children}
    </h2>
  );
}

function CorporateEntries({ items, accent }: { items: CvEntry[]; accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
      {items.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "32mm 1fr", gap: "5mm", breakInside: "avoid" }}>
          <span style={{ fontSize: "8pt", fontWeight: 600, color: MUTED, paddingTop: "0.6mm" }}>{period(e)}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "10pt" }}>{e.title}</div>
            {e.organization && <div style={{ color: accent, fontWeight: 600 }}>{e.organization}</div>}
            {e.description && <Description text={e.description} bulletColor={accent} color={BODY} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Corporate({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={PAGE}>
      <header style={{ background: tint(a, 8), borderBottom: `1mm solid ${a}`, padding: "12mm 16mm 10mm", display: "flex", alignItems: "center", gap: "8mm" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "24pt", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.01em" }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "2mm 0 4.5mm", fontSize: "11.5pt", fontWeight: 600, color: a }}>{cv.headline}</p>}
          <Contact cv={cv} color={BODY} iconColor={a} />
        </div>
        {photoUrl && <Portrait cv={cv} url={photoUrl} size="32mm" radius="3mm" ring="#fff" bg={a} color="#fff" />}
      </header>
      <div style={{ padding: "9mm 16mm 12mm", display: "flex", flexDirection: "column", gap: "6.5mm" }}>
        {cv.summary && (
          <section>
            <CorporateTitle accent={a}>Profil professionnel</CorporateTitle>
            <p style={{ margin: 0, color: BODY }}>{cv.summary}</p>
          </section>
        )}
        {mainSections(cv).map((s) => (
          <section key={s.key}>
            <CorporateTitle accent={a}>{s.title}</CorporateTitle>
            <CorporateEntries items={s.items} accent={a} />
          </section>
        ))}
        {cv.skills.length > 0 && (
          <section>
            <CorporateTitle accent={a}>Compétences</CorporateTitle>
            <SkillsBlock skills={cv.skills} accent={a} variant="main" />
          </section>
        )}
        {(cv.languages.length > 0 || cv.interests.length > 0) && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60mm, 1fr))", gap: "8mm", breakInside: "avoid" }}>
            {cv.languages.length > 0 && (
              <div>
                <CorporateTitle accent={a}>Langues</CorporateTitle>
                <p style={{ margin: 0 }}>{cv.languages.join(" · ")}</p>
              </div>
            )}
            {cv.interests.length > 0 && (
              <div>
                <CorporateTitle accent={a}>Centres d&apos;intérêt</CorporateTitle>
                <p style={{ margin: 0 }}>{cv.interests.join(" · ")}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mosaïque : blocs arrondis sur fond clair
// ---------------------------------------------------------------------------
const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: "3.5mm",
  padding: "5mm 5.5mm",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

function MosaiqueTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return <h2 style={{ margin: "0 0 3mm", fontFamily: FONTS.heading, fontSize: "8.5pt", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>{children}</h2>;
}

export function Mosaique({ cv, photoUrl }: TemplateProps) {
  const a = cv.accent;
  return (
    <div style={{ ...PAGE, background: "#f3f4f6", padding: "10mm", display: "flex", flexDirection: "column", gap: "4mm" }}>
      <header style={{ ...CARD, background: a, color: "#fff", padding: "8mm 9mm", display: "flex", alignItems: "center", gap: "7mm" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: "24pt", lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.01em" }}>{displayName(cv)}</h1>
          {cv.headline && <p style={{ margin: "2mm 0 0", fontSize: "11pt", fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{cv.headline}</p>}
        </div>
        <Portrait cv={cv} url={photoUrl} size="30mm" ring="rgba(255,255,255,0.85)" bg="rgba(255,255,255,0.18)" color="#fff" font={FONTS.heading} />
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 62mm", gap: "4mm", alignItems: "start" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
          {cv.summary && (
            <section style={CARD}>
              <MosaiqueTitle accent={a}>Profil</MosaiqueTitle>
              <p style={{ margin: 0, color: BODY }}>{cv.summary}</p>
            </section>
          )}
          {mainSections(cv).map((s) => (
            <section key={s.key} style={CARD}>
              <MosaiqueTitle accent={a}>{s.short}</MosaiqueTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
                {s.items.map((e, i) => (
                  <div key={i} style={{ breakInside: "avoid" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "3mm", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "10pt" }}>{e.title}</strong>
                      {period(e) && <span style={{ fontSize: "7.5pt", fontWeight: 600, whiteSpace: "nowrap", color: a }}>{period(e)}</span>}
                    </div>
                    {e.organization && <div style={{ color: MUTED, fontWeight: 600 }}>{e.organization}</div>}
                    {e.description && <Description text={e.description} bulletColor={a} color={BODY} />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
        <aside style={{ display: "flex", flexDirection: "column", gap: "4mm" }}>
          <section style={CARD}>
            <MosaiqueTitle accent={a}>Contact</MosaiqueTitle>
            <Contact cv={cv} color={INK} iconColor={a} stacked />
          </section>
          {cv.skills.length > 0 && (
            <section style={CARD}>
              <MosaiqueTitle accent={a}>Compétences</MosaiqueTitle>
              <SkillsBlock skills={cv.skills} accent={a} variant="side" tagBg={tint(a, 10)} />
            </section>
          )}
          {cv.languages.length > 0 && (
            <section style={CARD}>
              <MosaiqueTitle accent={a}>Langues</MosaiqueTitle>
              <StackedList items={cv.languages} />
            </section>
          )}
          {cv.interests.length > 0 && (
            <section style={CARD}>
              <MosaiqueTitle accent={a}>Intérêts</MosaiqueTitle>
              <StackedList items={cv.interests} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
