"use client";

import { aiTranscribe } from "@/app/actions/cv-ai";
import { CV_IMPORT_MAX_BYTES, CV_IMPORT_MAX_FILES } from "./constants";

const IMAGE_MAX_SIDE = 2000;

/** Réduit une photo de CV (souvent 4 à 12 Mo sur téléphone) à 2000 px de côté, en JPEG : lisible et léger. */
async function shrinkImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export const isImageFile = (f: File) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name);

/** Prépare les fichiers d'un ancien CV avant l'envoi : photos allégées, contrôle des formats et de la taille. */
export async function prepareImportFiles(files: File[]): Promise<{ files: File[] } | { error: string }> {
  if (!files.length) return { error: "Choisissez le fichier de votre ancien CV." };
  if (files.length > CV_IMPORT_MAX_FILES) return { error: `${CV_IMPORT_MAX_FILES} fichiers maximum (une photo par page).` };

  const out: File[] = [];
  for (const file of files) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".doc")) return { error: "Les anciens fichiers Word (.doc) ne sont pas lus : enregistrez-le en .docx ou en PDF." };
    if (isImageFile(file)) {
      try {
        out.push(await shrinkImage(file));
      } catch {
        return { error: `Impossible de lire la photo « ${file.name} ». Prenez-la en JPEG ou en PNG.` };
      }
    } else if (/\.(pdf|docx|txt)$/.test(name) || file.type === "application/pdf") {
      out.push(file);
    } else {
      return { error: `Format non pris en charge (${file.name}). Utilisez un PDF, un fichier Word (.docx) ou une photo.` };
    }
  }
  if (out.reduce((n, f) => n + f.size, 0) > CV_IMPORT_MAX_BYTES)
    return { error: "Fichier trop lourd (4 Mo maximum). Enregistrez votre CV en PDF ou prenez-le en photo." };
  return { files: out };
}

/** Envoie un enregistrement à la transcription. */
export async function transcribeBlob(audio: Blob) {
  const form = new FormData();
  form.append("audio", new File([audio], "dictee", { type: audio.type || "audio/webm" }));
  try {
    return await aiTranscribe(form);
  } catch {
    return { ok: false as const, error: "Connexion perdue pendant l'envoi. Vérifiez votre réseau et réessayez." };
  }
}

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
