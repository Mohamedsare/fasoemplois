"use client";

import { createClient } from "./supabase/client";

export const MAX_CV_BYTES = 5 * 1024 * 1024;

/**
 * Envoie un CV PDF directement du navigateur vers Supabase Storage (bucket « cvs »),
 * sans passer par le serveur Next.js (limite de 4,5 Mo des requêtes sur Vercel).
 * Renvoie les champs à transmettre à la Server Action, ou un message d'erreur.
 */
export async function uploadCvFromBrowser(
  file: File,
): Promise<{ path: string; name: string; size: number } | { error: string }> {
  if (file.type !== "application/pdf") return { error: "Seuls les fichiers PDF sont acceptés." };
  if (file.size > MAX_CV_BYTES) return { error: "Le fichier dépasse 5 Mo." };

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Votre session a expiré. Reconnectez-vous." };

  const path = `${data.user.id}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("cvs").upload(path, file, { contentType: "application/pdf" });
  if (error) return { error: "Échec de l'envoi du fichier. Réessayez." };

  return { path, name: file.name.slice(0, 120), size: file.size };
}

/**
 * Remplace le champ fichier `fileField` d'un FormData par cv_path / cv_name / cv_size
 * après envoi direct. Ne fait rien si aucun fichier n'est choisi.
 */
export async function replaceFileWithUpload(formData: FormData, fileField: string): Promise<string | null> {
  const file = formData.get(fileField);
  formData.delete(fileField);
  if (!(file instanceof File) || file.size === 0) return null;
  const result = await uploadCvFromBrowser(file);
  if ("error" in result) return result.error;
  formData.set("cv_path", result.path);
  formData.set("cv_name", result.name);
  formData.set("cv_size", String(result.size));
  return null;
}
