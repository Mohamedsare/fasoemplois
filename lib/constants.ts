import type {
  ApplicationStatus,
  ContractType,
  ExperienceLevel,
  JobSectionKind,
  PaymentMethod,
  PaymentStatus,
} from "./types";

export const CITIES = [
  "Ouagadougou",
  "Bobo-Dioulasso",
  "Koudougou",
  "Ouahigouya",
  "Banfora",
  "Kaya",
  "Tenkodogo",
  "Fada N'Gourma",
  "Dédougou",
  "Dori",
  "Gaoua",
  "Ziniaré",
  "Manga",
] as const;

export const CONTRACT_TYPES: ContractType[] = ["CDI", "CDD", "Stage", "Freelance", "Temps partiel", "Bénévolat"];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  debutant: "Débutant",
  "1-3": "1–3 ans",
  "3-5": "3–5 ans",
  "5+": "5 ans et +",
};

export const SECTION_LABELS: Record<JobSectionKind, string> = {
  missions: "Missions",
  profil: "Profil recherché",
  competences: "Compétences",
  formation: "Formation",
  experience: "Expérience",
  avantages: "Avantages",
  candidature: "Informations de candidature",
};

export const SECTION_ORDER: JobSectionKind[] = [
  "missions",
  "profil",
  "competences",
  "formation",
  "experience",
  "avantages",
  "candidature",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "Envoyée",
  consultee: "Consultée",
  en_cours: "En cours",
  retenue: "Retenue",
  refusee: "Refusée",
};

export const APPLICATION_STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En vérification",
  paid: "Payé",
  failed: "Échec",
  expired: "Expiré",
  cancelled: "Annulé",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  mobile_money: "Mobile Money",
  card: "Carte bancaire",
  other: "Autre fournisseur",
};

export const JOBS_PER_PAGE = 10;
export const SUBSCRIPTION_DAYS = 30;

/** Numéro WhatsApp du support (format international, sans « + » ni espaces). */
export const WHATSAPP_NUMBER = "22664712044";
export const WHATSAPP_SUBSCRIBE_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour Faso Emplois, j'aimerais de l'aide pour m'abonner.",
)}`;

/** Compte Orange Money qui reçoit les dépôts d'abonnement (paiement manuel vérifié par l'admin). */
export const ORANGE_MONEY = {
  number: "64 71 20 44",
  holder: "SARE MOHAMED",
};

/** Code USSD Orange Money de transfert vers le compte Faso Emplois, montant inclus. */
export function orangeMoneyUssd(amount: number) {
  return `*144*10*${ORANGE_MONEY.number.replace(/\s/g, "")}*${amount}#`;
}

// ---------------------------------------------------------------------------
// Créateur de CV
// ---------------------------------------------------------------------------

/** Nombre de CV sans abonnement (les plans définissent leur propre quota : cv_limit). */
export const FREE_CV_LIMIT = 1;

export const CV_TEMPLATES: { value: "moderne" | "classique" | "epure"; label: string; description: string }[] = [
  { value: "moderne", label: "Moderne", description: "Colonne latérale colorée avec photo" },
  { value: "classique", label: "Classique", description: "Sobre et élégant, en une colonne" },
  { value: "epure", label: "Épuré", description: "Minimaliste, beaucoup d'espace" },
];

/** Couleurs d'accent proposées (contraste suffisant sur fond blanc). */
export const CV_ACCENTS = [
  { value: "#009e49", label: "Vert Faso" },
  { value: "#1d4ed8", label: "Bleu" },
  { value: "#0f766e", label: "Émeraude" },
  { value: "#b91c1c", label: "Rouge" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#c2410c", label: "Orange" },
  { value: "#1c1f23", label: "Anthracite" },
];

/** Appels à l'assistant IA par jour et par utilisateur (maîtrise des coûts). */
export const AI_DAILY_LIMIT = { free: 15, subscribed: 60 };

