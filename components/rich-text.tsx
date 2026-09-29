import { Fragment } from "react";

/**
 * Rendu d'un texte « façon Markdown » sans HTML brut :
 * ## titre, - liste, 1. liste numérotée, **gras**, *italique*, [lien](https://…).
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-3 leading-relaxed text-ink/90">
      {blocks.map((block, i) => (
        <Block key={i} lines={block.split("\n").filter((l) => l.trim())} />
      ))}
    </div>
  );
}

const BULLET = /^[-•]\s+/;
const NUMBERED = /^\d+[.)]\s+/;

function Block({ lines }: { lines: string[] }) {
  if (!lines.length) return null;

  if (lines[0].startsWith("## ")) {
    return (
      <>
        <h3 className="pt-2 font-semibold text-ink">{inline(lines[0].slice(3))}</h3>
        {lines.length > 1 && <Block lines={lines.slice(1)} />}
      </>
    );
  }

  // Découpe en groupes consécutifs : paragraphe / liste à puces / liste numérotée
  const groups: { type: "p" | "ul" | "ol"; items: string[] }[] = [];
  for (const line of lines) {
    const type = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : "p";
    const last = groups.at(-1);
    if (last && last.type === type) last.items.push(line);
    else groups.push({ type, items: [line] });
  }

  return (
    <>
      {groups.map((g, i) => {
        if (g.type === "ul")
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {g.items.map((l, j) => <li key={j}>{inline(l.replace(BULLET, ""))}</li>)}
            </ul>
          );
        if (g.type === "ol")
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {g.items.map((l, j) => <li key={j}>{inline(l.replace(NUMBERED, ""))}</li>)}
            </ol>
          );
        return <p key={i}>{inline(g.items.join(" "))}</p>;
      })}
    </>
  );
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

function inline(text: string) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link)
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 underline">
          {link[1]}
        </a>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}
