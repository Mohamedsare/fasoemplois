"use client";

import { createClient } from "./supabase/client";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const SIZE = 600;

/** Recadre au centre en carré et réduit à 600 × 600 px (JPEG), pour une photo légère et nette. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.88),
  );
}

/**
 * Envoie la photo de profil dans le bucket privé « photos » (<user_id>/<uuid>.jpg).
 * Renvoie le chemin à enregistrer dans le CV et une URL locale pour l'aperçu immédiat.
 */
export async function uploadCvPhoto(file: File): Promise<{ path: string; previewUrl: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Choisissez une image (JPG, PNG ou WebP)." };
  if (file.size > MAX_INPUT_BYTES) return { error: "Image trop lourde (10 Mo maximum)." };

  let blob: Blob;
  try {
    blob = await toSquareJpeg(file);
  } catch {
    return { error: "Impossible de lire cette image. Essayez un autre fichier." };
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Votre session a expiré. Reconnectez-vous." };

  const path = `${data.user.id}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
  if (error) return { error: "Échec de l'envoi de la photo. Réessayez." };

  return { path, previewUrl: URL.createObjectURL(blob) };
}
