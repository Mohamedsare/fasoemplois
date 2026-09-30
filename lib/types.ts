export type ExperienceLevel = "debutant" | "1-3" | "3-5" | "5+";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";
export type PaymentMethod = "mobile_money" | "card" | "other";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  /** Recopié depuis auth.users (migration backoffice_admin). */
  email: string | null;
  phone: string | null;
  city: string | null;
  headline: string | null;
  experience_level: ExperienceLevel | null;
  skills: string[];
  languages: string[];
  onboarding_completed_at: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  badge: string | null;
  is_featured: boolean;
  is_available: boolean;
  cta_label: string;
  position: number;
  /** Nombre maximum de CV créés avec ce plan. */
  cv_limit: number;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  payment_id: string | null;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
};

export type Payment = {
  id: string;
  reference: string;
  user_id: string;
  plan_id: string;
  amount: number;
  method: PaymentMethod;
  phone: string | null;
  status: PaymentStatus;
  provider: string;
  provider_ref: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  return_to: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
};

export type CvEntry = {
  title: string;
  organization: string;
  start: string;
  end: string;
  description: string;
};

export type CvTemplate =
  | "moderne"
  | "classique"
  | "epure"
  | "executif"
  | "elegance"
  | "horizon"
  | "parcours"
  | "creatif"
  | "prestige"
  | "compact"
  | "corporate"
  | "mosaique";

export type Cv = {
  id: string;
  user_id: string;
  title: string;
  template: CvTemplate;
  accent: string;
  photo_path: string | null;
  website: string | null;
  full_name: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  summary: string | null;
  experiences: CvEntry[];
  education: CvEntry[];
  skills: string[];
  languages: string[];
  certifications: CvEntry[];
  interests: string[];
  updated_at: string;
};

/** Contenu éditable d'un CV (ce que l'éditeur envoie à l'enregistrement). */
export type CvDraft = Omit<Cv, "id" | "user_id" | "updated_at">;

export type Tip = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  reading_minutes: number;
  is_published: boolean;
  published_at: string;
};

/** État renvoyé par les Server Actions utilisées avec useFormAction. */
export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
} | null;

export type AdminLog = {
  id: number;
  admin_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

/** Ligne de la vue admin_users (back-office). */
export type AdminUserRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  headline: string | null;
  is_admin: boolean;
  created_at: string;
  cv_count: number;
  plan_name: string | null;
  subscription_status: SubscriptionStatus | null;
  subscription_expires_at: string | null;
  segment: "gratuit" | "abonne" | "expire";
};
