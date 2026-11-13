import "server-only";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Tab,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type ParagraphChild,
} from "docx";
import type { Cv, CvEntry } from "./types";

// Unités Word : 1 cm = 567 twips ; tailles de police en demi-points.
const CM = 567;
const PAGE_WIDTH = 11906; // A4
const MARGIN = Math.round(1.8 * CM);
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const FONT = "Calibri";
const INK = "1C1F23";
const BODY = "3A4048";
const MUTED = "5B6470";
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

const hex = (color: string) => (/^#?[0-9a-f]{6}$/i.test(color) ? color.replace("#", "").toUpperCase() : "009E49");
const isBullet = (line: string) => /^[-•]\s*/.test(line);
const stripBullet = (line: string) => line.replace(/^[-•]\s*/, "");
const period = (e: CvEntry) => [e.start, e.end].filter(Boolean).join(" – ");

/** Même découpage que les modèles (components/cv-templates/shared.tsx) : « Catégorie : éléments » ou mots-clés. */
function parseSkills(list: string[]) {
  const categorized: { category: string; detail: string }[] = [];
  const plain: string[] = [];
  for (const s of list) {
    const i = s.indexOf(":");
    if (i > 0 && i <= 45 && s.slice(i + 1).trim()) categorized.push({ category: s.slice(0, i).trim(), detail: s.slice(i + 1).trim() });
    else plain.push(s);
  }
  return { categorized, plain, allShort: plain.every((p) => p.length <= 28) };
}

function sectionTitle(text: string, accent: string) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: accent, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: accent, characterSpacing: 20 })],
  });
}

/** Texte libre : lignes « - » en puces, sinon paragraphes. */
function description(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) =>
      isBullet(line)
        ? new Paragraph({ numbering: { reference: "puces", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: stripBullet(line), color: BODY })] })
        : new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: line, color: BODY })] }),
    );
}

/** Expérience, formation, certification : intitulé + dates alignées à droite, organisme, description. */
function entry(e: CvEntry, accent: string) {
  const when = period(e);
  const head: ParagraphChild[] = [new TextRun({ text: e.title || e.organization, bold: true, color: INK, size: 22 })];
  if (when) head.push(new TextRun({ children: [new Tab(), when], color: MUTED, size: 19 }));
  const out = [
    new Paragraph({
      keepNext: true,
      spacing: { before: 160, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      children: head,
    }),
  ];
  if (e.title && e.organization) {
    out.push(new Paragraph({ keepNext: Boolean(e.description), spacing: { after: 40 }, children: [new TextRun({ text: e.organization, italics: true, color: accent })] }));
  }
  if (e.description) out.push(...description(e.description));
  return out;
}

function skills(list: string[]) {
  const { categorized, plain, allShort } = parseSkills(list);
  const out = categorized.map(
    (s) =>
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: `${s.category} : `, bold: true, color: INK }), new TextRun({ text: s.detail, color: BODY })],
      }),
  );
  if (plain.length) {
    if (allShort) out.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: plain.join("  ·  "), color: BODY })] }));
    else out.push(...plain.map((s) => new Paragraph({ numbering: { reference: "puces", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: s, color: BODY })] })));
  }
  return out;
}

function inline(list: string[]) {
  return [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: list.join("  ·  "), color: BODY })] })];
}

function header(cv: Cv, accent: string, photo: Buffer | null) {
  const contacts = [cv.email, cv.phone, cv.city, cv.website].filter((v): v is string => Boolean(v?.trim()));
  const identity = [
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: cv.full_name || "Votre nom", bold: true, size: 44, color: INK })] }),
    ...(cv.headline ? [new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: cv.headline, size: 26, color: accent, bold: true })] })] : []),
    ...(contacts.length ? [new Paragraph({ children: [new TextRun({ text: contacts.join("   |   "), size: 19, color: MUTED })] })] : []),
  ];
  if (!photo) return identity;

  const photoWidth = Math.round(3.4 * CM);
  return [
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [photoWidth, CONTENT_WIDTH - photoWidth],
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: photoWidth, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [new Paragraph({ children: [new ImageRun({ type: "jpg", data: photo, transformation: { width: 105, height: 105 } })] })],
            }),
            new TableCell({
              width: { size: CONTENT_WIDTH - photoWidth, type: WidthType.DXA },
              borders: NO_BORDERS,
              verticalAlign: VerticalAlign.CENTER,
              children: identity,
            }),
          ],
        }),
      ],
    }),
  ];
}

/** CV au format Word (.docx), entièrement modifiable. `photo` : JPEG (format des photos stockées). */
export async function buildCvDocx(cv: Cv, photo: Buffer | null) {
  const accent = hex(cv.accent);
  const children: (Paragraph | Table)[] = [...header(cv, accent, photo)];

  if (cv.summary?.trim()) children.push(sectionTitle("Profil", accent), ...description(cv.summary));
  if (cv.experiences?.length) children.push(sectionTitle("Expériences professionnelles", accent), ...cv.experiences.flatMap((e) => entry(e, accent)));
  if (cv.education?.length) children.push(sectionTitle("Formation", accent), ...cv.education.flatMap((e) => entry(e, accent)));
  if (cv.skills?.length) children.push(sectionTitle("Compétences", accent), ...skills(cv.skills));
  if (cv.languages?.length) children.push(sectionTitle("Langues", accent), ...inline(cv.languages));
  if (cv.certifications?.length) children.push(sectionTitle("Certifications", accent), ...cv.certifications.flatMap((e) => entry(e, accent)));
  if (cv.interests?.length) children.push(sectionTitle("Centres d'intérêt", accent), ...inline(cv.interests));

  const doc = new Document({
    title: cv.full_name ? `CV – ${cv.full_name}` : cv.title,
    creator: cv.full_name || "Votre CV",
    styles: { default: { document: { run: { font: FONT, size: 21, color: BODY } } } },
    numbering: {
      config: [
        {
          reference: "puces",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { run: { color: accent }, paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: PAGE_WIDTH, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
