export type ContractType = "CDI" | "CDD" | "Stage" | "Freelance" | "Temps partiel" | "Bénévolat";
export type ExperienceLevel = "debutant" | "1-3" | "3-5" | "5+";
export type JobStatus = "brouillon" | "publie" | "archive";
export type JobSectionKind =
  | "missions"
  | "profil"
  | "competences"
  | "formation"
  | "experience"
  | "avantages"
  | "candidature";
export type ApplicationStatus = "envoyee" | "consultee" | "en_cours" | "retenue" | "refusee";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";
export type PaymentMethod = "mobile_money" | "card" | "other";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  headline: string | null;
  experience_level: ExperienceLevel | null;
  skills: string[];
  languages: string[];
  pref_contracts: string[];
  pref_cities: string[];
  pref_categories: string[];
  onboarding_completed_at: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Category = { id: string; name: string; slug: string; position: number };

export type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  website: string | null;
};

export type Job = {
  id: string;
  title: string;
  company_id: string;
  category_id: string | null;
  city: string;
  contract_type: ContractType;
  experience_level: ExperienceLevel | null;
  salary: string | null;
  deadline: string | null;
  summary: string;
  skills: string[];
  is_featured: boolean;
  is_urgent: boolean;
  status: JobStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobSection = {
  id: string;
  job_id: string;
  kind: JobSectionKind;
  content: string;
  is_public: boolean;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[];
  application_limit: number | null;
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

export type CvTemplate = "moderne" | "classique" | "epure";

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

export type CvFile = {
  id: string;
  user_id: string;
  name: string;
  path: string;
  size: number;
  created_at: string;
};

export type Application = {
  id: string;
  job_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  cv_file_id: string | null;
  include_online_cv: boolean;
  cv_id: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type ApplicationEvent = {
  id: number;
  application_id: string;
  status: ApplicationStatus;
  created_at: string;
};

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
