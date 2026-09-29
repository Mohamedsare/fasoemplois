import "server-only";
import { createClient } from "./supabase/server";
import { str } from "./format";

/**
 * Enregistre dans cv_files un PDF déjà déposé par le navigateur dans le bucket « cvs ».
 * Le chemin doit appartenir au dossier de l'utilisateur (la RLS du stockage l'impose aussi).
 * Renvoie null si le formulaire ne contient pas de fichier.
 */
export async function registerCvFile(
  userId: string,
  formData: FormData,
): Promise<{ id: string } | { error: string } | null> {
  const path = str(formData, "cv_path");
  if (!path) return null;

  const expected = new RegExp(`^${userId}/[0-9a-f-]{36}\\.pdf$`, "i");
  if (!expected.test(path)) return { error: "Fichier invalide." };

  const supabase = await createClient();
  // Le fichier doit réellement exister dans le dossier de l'utilisateur
  const folder = await supabase.storage.from("cvs").list(userId, { search: path.split("/")[1] });
  if (!folder.data?.some((f) => `${userId}/${f.name}` === path)) return { error: "Fichier introuvable. Réessayez l'envoi." };

  const { data, error } = await supabase
    .from("cv_files")
    .insert({
      user_id: userId,
      name: str(formData, "cv_name").slice(0, 120) || "CV.pdf",
      path,
      size: Number(str(formData, "cv_size")) || 0,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { error: "Impossible d'enregistrer le fichier." };
  return { id: data.id };
}
