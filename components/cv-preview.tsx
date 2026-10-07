"use client";

import { useEffect, useRef, useState } from "react";
import type { CvDraft } from "@/lib/types";
import { A4_HEIGHT_PX, CvDocument } from "./cv-document";

/** Largeur d'une page A4 à 96 ppp (210 mm). */
const A4_WIDTH_PX = 793.7;

/**
 * Aperçu réduit d'un CV A4, ajusté à la largeur disponible.
 * Un CV de plusieurs pages montre où commence chaque page, comme dans le PDF.
 */
export function CvPreview({ cv, photoUrl }: { cv: CvDraft; photoUrl: string | null }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(1123);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ro = new ResizeObserver(() => {
      setScale(o.clientWidth / A4_WIDTH_PX);
      setHeight(i.offsetHeight);
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  const pages = Math.max(1, Math.ceil((height - 2) / A4_HEIGHT_PX));

  return (
    <div ref={outer} className="w-full overflow-hidden rounded-lg shadow-[0_2px_24px_rgba(0,0,0,0.12)]" style={{ height: height * scale }}>
      <div ref={inner} className="relative" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>
        <CvDocument cv={cv} photoUrl={photoUrl} />
        {Array.from({ length: pages - 1 }, (_, k) => (
          <div
            key={k}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t-[3px] border-dashed border-ink/25"
            style={{ top: (k + 1) * A4_HEIGHT_PX }}
          >
            <span className="absolute top-2 right-3 rounded-full bg-ink/75 px-3 py-1 text-[18px] font-semibold text-white">
              Page {k + 2}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
