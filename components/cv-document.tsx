"use client";

import { useLayoutEffect, useRef } from "react";
import type { CvDraft, CvTemplate } from "@/lib/types";
import { Classique, Epure, Moderne } from "./cv-templates/free";
import { Compact, Corporate, Creatif, Elegance, Executif, Horizon, Mosaique, Parcours, Prestige } from "./cv-templates/premium";
import { CustomTemplate } from "./cv-templates/custom";
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

/** Hauteur d'une page A4 à 96 ppp (297 mm). */
export const A4_HEIGHT_PX = (297 * 96) / 25.4;

/**
 * Réduction maximale pour faire tenir sur une page un CV qui déborde de peu (9,5 pt → 8,4 pt) :
 * mieux qu'une deuxième page de trois lignes. Au-delà, le CV passe proprement sur plusieurs pages.
 */
const MIN_FIT = 0.88;

/**
 * Ajuste le CV sur une seule page s'il ne déborde que légèrement. Mesure directe dans le DOM
 * (avant affichage) : la réduction suit chaque frappe dans l'éditeur, sans clignotement.
 */
function fitToOnePage(outer: HTMLElement, inner: HTMLElement) {
  inner.style.removeProperty("zoom");
  inner.style.removeProperty("--cv-fit");
  const natural = outer.offsetHeight;
  if (natural > A4_HEIGHT_PX + 1 && natural * MIN_FIT <= A4_HEIGHT_PX) {
    // Marge de sécurité : un pixel de trop suffirait à créer une page blanche dans le PDF
    const z = (A4_HEIGHT_PX / natural) * 0.995;
    inner.style.zoom = String(z);
    inner.style.setProperty("--cv-fit", String(z));
  }
  outer.dataset.ready = "1";
}

/**
 * Rendu A4 d'un CV (210 × 297 mm), identique à l'écran, dans l'aperçu et à l'impression PDF.
 * Unités en mm / pt pour une mise en page stable quel que soit l'écran.
 * La mise en page sur plusieurs pages (marges, fonds, titres jamais seuls en bas de page) est
 * gérée par les règles « .cv-doc » de globals.css, communes à tous les modèles.
 */
export function CvDocument({ cv, photoUrl }: { cv: CvDraft; photoUrl?: string | null }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    fitToOnePage(o, i);
    // Polices et photo chargées après coup : on mesure à nouveau
    let cancelled = false;
    void document.fonts?.ready.then(() => !cancelled && fitToOnePage(o, i));
    const ro = new ResizeObserver(() => fitToOnePage(o, i));
    ro.observe(i);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [cv, photoUrl]);

  const photo = cv.photo_path ? photoUrl ?? null : null;
  // Modèle créé par l'IA : fiche de style copiée dans le CV
  const Template = !(cv.template in TEMPLATES) && cv.template_spec ? null : TEMPLATES[cv.template as CvTemplate] ?? Moderne;

  return (
    <div ref={outer} className="cv-doc">
      <div ref={inner} className="cv-doc-zoom">
        {Template ? <Template cv={cv} photoUrl={photo} /> : <CustomTemplate cv={cv} photoUrl={photo} spec={cv.template_spec!} />}
      </div>
    </div>
  );
}
