"use client";

import { useRef } from "react";

type Props = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

/** Zone de texte + barre d'outils (gras, italique, listes, lien) en syntaxe légère. */
export function MarkdownEditor({ id, name, value, onChange, rows = 5, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after = before, fallback = "texte") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || fallback;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }

  function prefixLines(prefix: (i: number) => string) {
    const el = ref.current;
    if (!el) return;
    const start = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const end = el.selectionEnd;
    const block = value.slice(start, end) || "élément";
    const lines = block.split("\n").map((l, i) => prefix(i) + l.replace(/^([-•]|\d+[.)])\s+/, ""));
    onChange(value.slice(0, start) + lines.join("\n") + value.slice(end));
    requestAnimationFrame(() => el.focus());
  }

  const tool = "rounded px-2 py-1 text-xs hover:bg-surface";

  return (
    <div className="overflow-hidden rounded-lg border border-line focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <div className="flex flex-wrap gap-1 border-b border-line bg-white px-2 py-1" role="toolbar" aria-label="Mise en forme">
        <button type="button" className={`${tool} font-bold`} onClick={() => wrap("**")} aria-label="Gras">B</button>
        <button type="button" className={`${tool} italic`} onClick={() => wrap("*")} aria-label="Italique">I</button>
        <button type="button" className={tool} onClick={() => prefixLines(() => "- ")}>• liste</button>
        <button type="button" className={tool} onClick={() => prefixLines((i) => `${i + 1}. `)}>1. liste</button>
        <button type="button" className={tool} onClick={() => wrap("[", "](https://)", "lien")}>lien</button>
      </div>
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full resize-y bg-white px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
