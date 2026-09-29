"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  name: string;
  id: string;
  defaultValue?: string[];
  suggestions?: string[];
  placeholder?: string;
};

/** Saisie de pastilles (compétences, langues) → champ caché « a, b, c ». */
export function TagInput({ name, id, defaultValue = [], suggestions = [], placeholder = "Ajouter…" }: Props) {
  const [tags, setTags] = useState(defaultValue);
  const [draft, setDraft] = useState("");

  const add = (value: string) => {
    const v = value.trim().replace(/,/g, "");
    if (v && !tags.some((t) => t.toLowerCase() === v.toLowerCase())) setTags([...tags, v].slice(0, 30));
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={tags.join(", ")} />
      <div className="input flex flex-wrap items-center gap-1.5 py-2">
        {tags.map((t) => (
          <span key={t} className="chip chip-active">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Retirer ${t}`}><X aria-hidden className="size-3.5" /></button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) {
              setTags(tags.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={placeholder}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {suggestions.filter((s) => !tags.includes(s)).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Suggestions :</span>
          {suggestions
            .filter((s) => !tags.includes(s))
            .map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="chip hover:border-ink">
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
