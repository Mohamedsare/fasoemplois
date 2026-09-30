import type { CvDraft, CvTemplate } from "@/lib/types";
import { Classique, Epure, Moderne } from "./cv-templates/free";
import { Compact, Corporate, Creatif, Elegance, Executif, Horizon, Mosaique, Parcours, Prestige } from "./cv-templates/premium";
import type { TemplateProps } from "./cv-templates/shared";

const TEMPLATES: Record<CvTemplate, (props: TemplateProps) => React.ReactNode> = {
  moderne: Moderne,
  classique: Classique,
  epure: Epure,
  executif: Executif,
  elegance: Elegance,
  horizon: Horizon,
  parcours: Parcours,
  creatif: Creatif,
  prestige: Prestige,
  compact: Compact,
  corporate: Corporate,
  mosaique: Mosaique,
};

/**
 * Rendu A4 d'un CV (210 × 297 mm), identique à l'écran, dans l'aperçu et à l'impression PDF.
 * Unités en mm / pt pour une mise en page stable quel que soit l'écran.
 */
export function CvDocument({ cv, photoUrl }: { cv: CvDraft; photoUrl?: string | null }) {
  const Template = TEMPLATES[cv.template] ?? Moderne;
  return <Template cv={cv} photoUrl={cv.photo_path ? photoUrl ?? null : null} />;
}
