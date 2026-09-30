import "server-only";
import { createClient } from "./supabase/server";

/** URL signée (1 h) des photos de CV, bucket privé « photos ». Droits vérifiés par la RLS. */
export async function signedPhotoUrls(paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!unique.length) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.storage.from("photos").createSignedUrls(unique, 3600);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

export async function signedPhotoUrl(path: string | null) {
  if (!path) return null;
  return (await signedPhotoUrls([path])).get(path) ?? null;
}
