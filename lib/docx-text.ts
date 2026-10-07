import "server-only";
import { inflateRawSync } from "node:zlib";

/**
 * Texte brut d'un fichier Word (.docx), sans dépendance : un .docx est une archive ZIP
 * dont le contenu est dans word/document.xml. Renvoie null si le fichier est illisible.
 */
export function docxToText(buffer: Buffer): string | null {
  try {
    const xml = readZipEntry(buffer, "word/document.xml");
    if (!xml) return null;
    return xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&amp;/g, "&")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return null;
  }
}

/** Lit un fichier d'une archive ZIP via le répertoire central (méthodes « stocké » et « deflate »). */
function readZipEntry(zip: Buffer, name: string): string | null {
  // Fin du répertoire central : signature 0x06054b50, dans les 64 Ko de fin (commentaire éventuel)
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < count && p + 46 <= zip.length; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) return null;
    const method = zip.readUInt16LE(p + 10);
    const size = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const offset = zip.readUInt32LE(p + 42);
    const entry = zip.toString("utf8", p + 46, p + 46 + nameLen);

    if (entry === name) {
      if (zip.readUInt32LE(offset) !== 0x04034b50) return null;
      const start = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
      const data = zip.subarray(start, start + size);
      if (method === 0) return data.toString("utf8");
      if (method === 8) return inflateRawSync(data).toString("utf8");
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
