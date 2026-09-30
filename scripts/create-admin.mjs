// Crée (ou met à jour) un compte administrateur Votre CV.
// Usage : npm run admin:create -- <email> <mot-de-passe>
// Lit NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(import.meta.dirname, "..");
const env = { ...process.env };
const envFile = join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage : npm run admin:create -- <email> <mot-de-passe>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local.");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (found || data.users.length < 1000) return found ?? null;
  }
  return null;
}

let user = await findUserByEmail(email);
if (user) {
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  console.log(`Compte existant mis à jour : ${email}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // pas d'e-mail de confirmation à cliquer
    user_metadata: { first_name: "Admin", last_name: "Votre CV" },
  });
  if (error) throw error;
  user = data.user;
  console.log(`Compte créé : ${email}`);
}

// Le profil est créé par le trigger handle_new_user ; on s'assure qu'il existe puis on le passe admin.
const { error: profileError } = await supabase
  .from("profiles")
  .upsert({ id: user.id, is_admin: true, onboarding_completed_at: new Date().toISOString() }, { onConflict: "id" });
if (profileError) throw profileError;

const { data: check } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
console.log(check?.is_admin ? "Droits administrateur : OK" : "Attention : is_admin n'a pas pu être activé");
