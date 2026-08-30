import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
).storage;

const u = manifest.userId;

// Bilder zuerst, danach die Datensätze in Reihenfolge der Fremdschlüssel.
if (manifest.skinPaths.length) {
  const { error } = await storage.from('skin-photos').remove(manifest.skinPaths);
  console.log(error ? `Storage-Fehler: ${error.message}` : `✓ ${manifest.skinPaths.length} Platzhalterbilder entfernt`);
}

await sql`delete from "foodAnalyses" where "mealId" in (select id from meals where "userId" = ${u})`;
await sql`delete from meals where "userId" = ${u}`;
await sql`delete from "skinAnalyses" where "userId" = ${u}`;
await sql`delete from "skinPhotos" where "userId" = ${u}`;
await sql`delete from "medicationLogs" where "userId" = ${u}`;
await sql`delete from medications where "userId" = ${u}`;
await sql`delete from "skincareLogs" where "userId" = ${u}`;
await sql`delete from "skincareProducts" where "userId" = ${u}`;
await sql`delete from "dailySummaries" where "userId" = ${u}`;

const counts = {};
for (const t of ['skinPhotos','skinAnalyses','meals','foodAnalyses','medications','medicationLogs','skincareProducts','skincareLogs','dailySummaries']) {
  const [r] = await sql`select count(*)::int as c from ${sql(t)}`;
  counts[t] = r.c;
}
console.log('✓ Datensätze entfernt. Verbleibend:', JSON.stringify(counts));
console.log('(users-Zeile bleibt bestehen, damit die Anmeldung weiter funktioniert)');
await sql.end();
