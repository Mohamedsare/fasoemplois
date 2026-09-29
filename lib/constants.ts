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
  pending: "En attente",
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
