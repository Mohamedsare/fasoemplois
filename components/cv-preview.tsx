"use client";

import { useEffect, useRef, useState } from "react";
import type { CvDraft } from "@/lib/types";
import { CvDocument } from "./cv-document";

/** Largeur d'une page A4 à 96 ppp (210 mm). */
const A4_WIDTH_PX = 793.7;

/** Aperçu réduit d'un CV A4, ajusté à la largeur disponible. */
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

  return (
    <div ref={outer} className="w-full overflow-hidden rounded-lg shadow-[0_2px_24px_rgba(0,0,0,0.12)]" style={{ height: height * scale }}>
      <div ref={inner} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: A4_WIDTH_PX }}>
        <CvDocument cv={cv} photoUrl={photoUrl} />
      </div>
    </div>
  );
}
