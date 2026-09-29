import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Client « service_role » : contourne la RLS. À n'utiliser que dans du code serveur,
 * après avoir vérifié l'utilisateur (paiements, activation d'abonnement).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Variable d'environnement manquante : SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
