/**
 * Modèles de CV créés par l'IA : une « fiche de style » déclarative (jamais de code).
 * Un moteur de rendu unique (components/cv-templates/custom.tsx) la transforme en CV A4.
 * Toute fiche venant de l'IA ou d'un formulaire passe par sanitizeSpec : seules les valeurs listées ici sont acceptées.
 */

export const SECTION_KEYS = ["summary", "experiences", "education", "certifications", "skills", "languages", "interests", "contact"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Sections qui peuvent aller dans la colonne latérale. */
export const SIDEBAR_KEYS = ["contact", "skills", "languages", "interests", "education", "certifications"] as const satisfies readonly SectionKey[];
/** Sections de la colonne principale (ordre modifiable). */
export const MAIN_KEYS = ["summary", "experiences", "education", "certifications", "skills", "languages", "interests"] as const satisfies readonly SectionKey[];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Profil",
  experiences: "Expériences",
  education: "Formation",
  certifications: "Certifications",
  skills: "Compétences",
  languages: "Langues",
  interests: "Centres d'intérêt",
  contact: "Contact",
};

/** Valeurs autorisées, avec libellés pour le concepteur du back-office. */
export const SPEC_OPTIONS = {
  layout: { single: "Une colonne", "sidebar-left": "Colonne à gauche", "sidebar-right": "Colonne à droite" },
  sidebarStyle: { tint: "Teintée", accent: "Pleine couleur", dark: "Sombre", plain: "Blanche avec filet" },
  header: { classic: "Classique", centered: "Centré", split: "Nom à gauche, contact à droite", band: "Bandeau pleine largeur", card: "Encadré arrondi" },
  headerColor: { none: "Aucune", tint: "Teinte légère", accent: "Couleur d'accent", dark: "Sombre" },
  photo: { header: "Dans l'en-tête", sidebar: "Dans la colonne", none: "Sans photo" },
  photoShape: { circle: "Ronde", rounded: "Coins arrondis", square: "Carrée" },
  headingFont: { sans: "Sans empattement (Geist)", geometric: "Géométrique (Montserrat)", serif: "À empattements (Lora)", display: "Élégante (Playfair)", classic: "Classique (Georgia)" },
  bodyFont: { sans: "Sans empattement", serif: "À empattements" },
  headlineStyle: { accent: "Couleur d'accent", muted: "Gris discret", spaced: "Majuscules espacées" },
  sectionTitle: {
    underline: "Souligné",
    bar: "Barre verticale",
    line: "Filet après le titre",
    filled: "Fond coloré",
    diamond: "Losange",
    numbered: "Numéroté (01, 02…)",
    centered: "Centré entre deux filets",
    plain: "Sobre",
  },
  titleColor: { accent: "Couleur d'accent", ink: "Noir" },
  entryStyle: { stacked: "Empilé", "dates-left": "Dates en marge", timeline: "Frise chronologique", cards: "Blocs encadrés" },
  dateStyle: { muted: "Gris", accent: "Couleur d'accent", pill: "Pastille" },
  skillStyle: { tags: "Étiquettes", list: "Liste à puces", inline: "En ligne" },
  accentBar: { none: "Aucune", top: "En haut de page", left: "Sur le bord gauche" },
  background: { white: "Blanc", soft: "Gris clair avec blocs blancs" },
  density: { compact: "Compacte", normal: "Normale", airy: "Aérée" },
} as const;

type Opt<K extends keyof typeof SPEC_OPTIONS> = keyof (typeof SPEC_OPTIONS)[K];

export type TemplateSpec = {
  layout: Opt<"layout">;
  /** Largeur de la colonne latérale, en mm (56 à 80). */
  sidebarWidth: number;
  sidebarStyle: Opt<"sidebarStyle">;
  header: Opt<"header">;
  headerColor: Opt<"headerColor">;
  photo: Opt<"photo">;
  photoShape: Opt<"photoShape">;
  /** Taille de la photo, en mm (22 à 42). */
  photoSize: number;
  headingFont: Opt<"headingFont">;
  bodyFont: Opt<"bodyFont">;
  /** Taille du nom, en pt (18 à 34). */
  nameSize: number;
  nameWeight: 300 | 400 | 600 | 700 | 800;
  nameUppercase: boolean;
  headlineStyle: Opt<"headlineStyle">;
  sectionTitle: Opt<"sectionTitle">;
  titleUppercase: boolean;
  titleColor: Opt<"titleColor">;
  entryStyle: Opt<"entryStyle">;
  dateStyle: Opt<"dateStyle">;
  skillStyle: Opt<"skillStyle">;
  sidebarSections: SectionKey[];
  mainOrder: SectionKey[];
  accentBar: Opt<"accentBar">;
  background: Opt<"background">;
  density: Opt<"density">;
  /** Couleur proposée par défaut (l'utilisateur peut la changer). */
  defaultAccent: string;
};

export const DEFAULT_SPEC: TemplateSpec = {
  layout: "sidebar-left",
  sidebarWidth: 66,
  sidebarStyle: "tint",
  header: "classic",
  headerColor: "none",
  photo: "sidebar",
  photoShape: "circle",
  photoSize: 36,
  headingFont: "geometric",
  bodyFont: "sans",
  nameSize: 26,
  nameWeight: 800,
  nameUppercase: false,
  headlineStyle: "accent",
  sectionTitle: "line",
  titleUppercase: true,
  titleColor: "accent",
  entryStyle: "stacked",
  dateStyle: "muted",
  skillStyle: "tags",
  sidebarSections: ["contact", "skills", "languages", "interests"],
  mainOrder: ["summary", "experiences", "education", "certifications", "skills", "languages", "interests"],
  accentBar: "none",
  background: "white",
  density: "normal",
  defaultAccent: "#009e49",
};

/** Préfixe des identifiants des modèles créés par l'IA (les modèles du code n'en ont pas). */
export const CUSTOM_PREFIX = "ia-";
export const isCustomTemplateId = (id: string) => id.startsWith(CUSTOM_PREFIX) && /^ia-[a-z0-9-]{3,40}$/.test(id);

const pick = <K extends keyof typeof SPEC_OPTIONS>(key: K, value: unknown, fallback: Opt<K>): Opt<K> =>
  typeof value === "string" && value in SPEC_OPTIONS[key] ? (value as Opt<K>) : fallback;

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

function keys(value: unknown, allowed: readonly SectionKey[], fallback: SectionKey[]) {
  if (!Array.isArray(value)) return fallback;
  return [...new Set(value.filter((v): v is SectionKey => typeof v === "string" && (allowed as readonly string[]).includes(v)))];
}

/** Valide et complète une fiche de style (sortie de l'IA ou du formulaire). */
export function sanitizeSpec(raw: unknown): TemplateSpec {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SPEC;
  const weight = clamp(r.nameWeight, 300, 800, d.nameWeight);
  const spec: TemplateSpec = {
    layout: pick("layout", r.layout, d.layout),
    sidebarWidth: clamp(r.sidebarWidth, 56, 80, d.sidebarWidth),
    sidebarStyle: pick("sidebarStyle", r.sidebarStyle, d.sidebarStyle),
    header: pick("header", r.header, d.header),
    headerColor: pick("headerColor", r.headerColor, d.headerColor),
    photo: pick("photo", r.photo, d.photo),
    photoShape: pick("photoShape", r.photoShape, d.photoShape),
    photoSize: clamp(r.photoSize, 22, 42, d.photoSize),
    headingFont: pick("headingFont", r.headingFont, d.headingFont),
    bodyFont: pick("bodyFont", r.bodyFont, d.bodyFont),
    nameSize: clamp(r.nameSize, 18, 34, d.nameSize),
    nameWeight: ([300, 400, 600, 700, 800] as const).reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), 800),
    nameUppercase: r.nameUppercase === true,
    headlineStyle: pick("headlineStyle", r.headlineStyle, d.headlineStyle),
    sectionTitle: pick("sectionTitle", r.sectionTitle, d.sectionTitle),
    titleUppercase: r.titleUppercase === undefined ? d.titleUppercase : r.titleUppercase === true,
    titleColor: pick("titleColor", r.titleColor, d.titleColor),
    entryStyle: pick("entryStyle", r.entryStyle, d.entryStyle),
    dateStyle: pick("dateStyle", r.dateStyle, d.dateStyle),
    skillStyle: pick("skillStyle", r.skillStyle, d.skillStyle),
    sidebarSections: keys(r.sidebarSections, SIDEBAR_KEYS, d.sidebarSections),
    mainOrder: keys(r.mainOrder, MAIN_KEYS, d.mainOrder),
    accentBar: pick("accentBar", r.accentBar, d.accentBar),
    background: pick("background", r.background, d.background),
    density: pick("density", r.density, d.density),
    defaultAccent: typeof r.defaultAccent === "string" && /^#[0-9a-f]{6}$/i.test(r.defaultAccent) ? r.defaultAccent.toLowerCase() : d.defaultAccent,
  };
  // La photo « dans la colonne » n'a de sens qu'avec une colonne latérale
  if (spec.layout === "single" && spec.photo === "sidebar") spec.photo = "header";
  // Toutes les sections principales apparaissent une fois
  for (const k of MAIN_KEYS) if (!spec.mainOrder.includes(k)) spec.mainOrder.push(k);
  return spec;
}

/** Entrée du catalogue de modèles (modèles du code + modèles IA publiés). */
export type CatalogTemplate = {
  value: string;
  label: string;
  description: string;
  premium: boolean;
  /** Modèles IA uniquement */
  spec: TemplateSpec | null;
  /** Personne d'exemple utilisée pour l'aperçu (voir lib/sample-cvs.ts) */
  sample: string | null;
  custom: boolean;
};
