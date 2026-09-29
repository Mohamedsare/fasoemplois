import { createBrowserClient } from "@supabase/ssr";

/** Client navigateur (session lue dans les cookies). Utilisé pour l'envoi direct des fichiers. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
