import { BRAND } from "./brand";
import type { CvTemplate, PaymentMethod, PaymentStatus } from "./types";

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

export const SUBSCRIPTION_DAYS = 30;

/** Numéro WhatsApp du support (format international, sans « + » ni espaces). */
export const WHATSAPP_NUMBER = "22664712044";
export const WHATSAPP_SUBSCRIBE_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  `Bonjour ${BRAND.name}, j'aimerais de l'aide pour m'abonner.`,
)}`;

/** Compte Orange Money qui reçoit les dépôts d'abonnement (paiement manuel vérifié par l'admin). */
export const ORANGE_MONEY = {
  number: "64 71 20 44",
  holder: "SARE MOHAMED",
};

/** Code USSD Orange Money de transfert vers le compte du service, montant inclus. */
export function orangeMoneyUssd(amount: number) {
  return `*144*10*${ORANGE_MONEY.number.replace(/\s/g, "")}*${amount}#`;
}

// ---------------------------------------------------------------------------
// Créateur de CV
// ---------------------------------------------------------------------------

/** Nombre de CV sans abonnement (les plans définissent leur propre quota : cv_limit). */
export const FREE_CV_LIMIT = 1;

/** Modèles de CV : les modèles « premium » sont inclus dans les abonnements. */
export const CV_TEMPLATES: { value: CvTemplate; label: string; description: string; premium: boolean }[] = [
  { value: "moderne", label: "Moderne", description: "Colonne latérale teintée avec photo", premium: false },
  { value: "classique", label: "Classique", description: "Sobre et élégant, en une colonne", premium: false },
  { value: "epure", label: "Épuré", description: "Minimaliste, beaucoup d'espace", premium: false },
  { value: "executif", label: "Exécutif", description: "Bandeau sombre, pour les postes de direction", premium: true },
  { value: "elegance", label: "Élégance", description: "Typographie raffinée, mise en page centrée", premium: true },
  { value: "horizon", label: "Horizon", description: "Colonne pleine couleur, très visuel", premium: true },
  { value: "parcours", label: "Parcours", description: "Frise chronologique de votre carrière", premium: true },
  { value: "creatif", label: "Créatif", description: "En-tête graphique, pour les métiers créatifs", premium: true },
  { value: "prestige", label: "Prestige", description: "Colonne sombre et titres à empattements", premium: true },
  { value: "compact", label: "Compact", description: "Dense et structuré, pour les longues carrières", premium: true },
  { value: "corporate", label: "Corporate", description: "Rigueur des grandes entreprises et banques", premium: true },
  { value: "mosaique", label: "Mosaïque", description: "Blocs arrondis, moderne et aéré", premium: true },
];

/** Couleurs d'accent proposées (contraste suffisant sur fond blanc). */
export const CV_ACCENTS = [
  { value: "#009e49", label: "Vert" },
  { value: "#1d4ed8", label: "Bleu" },
  { value: "#0f766e", label: "Émeraude" },
  { value: "#b91c1c", label: "Rouge" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#c2410c", label: "Orange" },
  { value: "#1c1f23", label: "Anthracite" },
];

/** Appels à l'assistant IA par jour et par utilisateur (maîtrise des coûts). */
export const AI_DAILY_LIMIT = { free: 15, subscribed: 60 };

