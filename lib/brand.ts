/**
 * Identité de la marque — SEUL endroit à modifier pour renommer le produit.
 * (Les modèles d'e-mails de supabase/templates et l'image Open Graph réutilisent ces valeurs
 *  ou doivent être mis à jour à la main : voir README.)
 */
export const BRAND = {
  /** Nom complet affiché */
  name: "Votre CV",
  /** Découpage pour le logo (drapeau du Burkina + nom) : première partie en noir, seconde en couleur */
  logoFirst: "Votre",
  logoSecond: "CV",
  /** Accroche courte */
  tagline: "Créez un CV professionnel avec l'IA",
  domain: "votrecv.site",
  contactEmail: "contact@votrecv.site",
} as const;
