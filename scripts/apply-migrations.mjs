// Applique les migrations SQL (et le seed) sur le projet Supabase distant
// via l'API Management. Usage : npm run db:migrate [-- --no-seed]
//
// Variables lues dans .env.local :
//   NEXT_PUBLIC_SUPABASE_URL  → identifiant du projet
//   TOKEN (ou SUPABASE_ACCESS_TOKEN) → jeton personnel (supabase.com/dashboard/account/tokens)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function loadEnv() {
  const env = {};
  const file = join(root, ".env.local");
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const token = env.SUPABASE_ACCESS_TOKEN || env.TOKEN;
const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

if (!token) throw new Error("Jeton manquant : TOKEN (ou SUPABASE_ACCESS_TOKEN) dans .env.local");
if (!ref) throw new Error("NEXT_PUBLIC_SUPABASE_URL invalide dans .env.local");

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} : ${body}`);
  return body ? JSON.parse(body) : [];
}

const lit = (s) => `'${s.replace(/'/g, "''")}'`;

// Table de suivi compatible avec la CLI Supabase (`supabase db push`)
await query(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key, statements text[], name text
  );
`);

const applied = new Set(
  (await query("select version from supabase_migrations.schema_migrations")).map((r) => r.version),
);

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
  if (applied.has(version)) {
    console.log(`= ${file} (déjà appliquée)`);
    continue;
  }
  const sql = readFileSync(join(dir, file), "utf8");
  process.stdout.write(`→ ${file} … `);
  await query(`begin;\n${sql}\n;
    insert into supabase_migrations.schema_migrations (version, name)
    values (${lit(version)}, ${lit(rest.join("_"))});
  commit;`);
  console.log("ok");
}

if (!process.argv.includes("--no-seed")) {
  const [{ n }] = await query("select count(*)::int as n from public.tips");
  if (n > 0) {
    console.log("= seed.sql (données déjà présentes)");
  } else {
    process.stdout.write("→ seed.sql … ");
    await query(readFileSync(join(root, "supabase", "seed.sql"), "utf8"));
    console.log("ok");
  }
}

console.log("Terminé.");
