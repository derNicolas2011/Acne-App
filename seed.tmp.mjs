import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', quiet: true });
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { placeholderPhoto } from './png.tmp.mjs';

const MANIFEST = process.argv[2];
const DAYS = 60;

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
).storage;

const id = () => randomUUID();
const manifest = { createdAt: new Date().toISOString(), userId: null, skinPaths: [], mealPaths: [], ids: {} };

// Deterministischer Zufall, damit ein erneuter Lauf dieselbe Kurve ergibt.
let rnd = 987654321;
const rand = () => (rnd = (rnd * 1103515245 + 12345) % 2147483647) / 2147483647;

const dateStr = (offset) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
};
const at = (offset, hour, minute = 0) => {
  const d = new Date(`${dateStr(offset)}T00:00:00Z`);
  // Europe/Zurich im Sommer = UTC+2
  d.setUTCHours(hour - 2, minute, 0, 0);
  return d;
};

const [user] = await sql`select id from users where email = 'admin@local' limit 1`;
if (!user) { console.log('Keine users-Zeile — bitte zuerst einmal anmelden.'); process.exit(1); }
manifest.userId = user.id;
console.log('Nutzer:', user.id);

/* ---------- Ernährung: „reichhaltige" Tage bewusst gesetzt ---------- */
const richDays = new Set([2, 5, 9, 13, 16, 21, 24, 28, 33, 37, 41, 46, 50, 54, 58]);

/* ---------- Skin Score: Aufwärtstrend + Rauschen + Effekt 2 Tage nach reichhaltigen Tagen ---------- */
const scoreFor = (offset) => {
  const progress = (DAYS - offset) / DAYS;          // 0 → 1 (älter → heute)
  let score = 50 + progress * 24;                    // Trend 50 → 74
  score += (rand() - 0.5) * 7;                       // Rauschen
  if (richDays.has(offset + 2)) score -= 6;          // Lag von 2 Tagen
  return Math.max(28, Math.min(92, Math.round(score)));
};

const MEALS = {
  Frühstück: ['Brot mit Butter und Honig, laktosefreie Milch', 'Haferflocken mit Beeren', 'Gipfeli und Kaffee'],
  Mittagessen: ['Salat mit Poulet und Vollkornbrot', 'Gemüsecurry mit Reis', 'Pasta mit Tomatensauce'],
  Zvieri: ['Apfel', 'Handvoll Nüsse', 'Joghurt'],
  Abendessen: ['Ofengemüse mit Kartoffeln', 'Lachs mit Quinoa', 'Suppe mit Brot'],
};
const RICH_MEALS = {
  Mittagessen: ['Burger mit Pommes und Cola', 'Pizza Salami'],
  Snack: ['Schokolade', 'Chips', 'Glace'],
  Abendessen: ['Döner mit Sauce', 'Fertigpizza'],
};

const props = (rich, dairy) => ({
  sugar: rich ? 'high' : rand() > 0.7 ? 'medium' : 'low',
  dairy,
  fat: rich ? 'high' : rand() > 0.6 ? 'medium' : 'low',
  processed: rich ? 'highly' : rand() > 0.65 ? 'moderate' : 'minimal',
  carbs: rand() > 0.4 ? 'high' : 'medium',
  protein: rand() > 0.5 ? 'medium' : 'low',
});

/* ---------- Routine ---------- */
const medId = id(), cleanserId = id(), bpoId = id();
manifest.ids.medications = [medId];
manifest.ids.skincare = [cleanserId, bpoId];
const start = dateStr(DAYS);

await sql`insert into medications (id,"userId",name,dosage,unit,"timesOfDay",frequency,"startDate","isActive",notes)
  values (${medId},${user.id},'Isotretinoin','20','mg',${sql.json(['morning'])},'Täglich',${start},true,'Mit dem Essen einnehmen')`;
await sql`insert into "skincareProducts" (id,"userId",name,amount,"timesOfDay",frequency,"startDate","isActive",instructions)
  values (${cleanserId},${user.id},'Milde Reinigung','1 Pump',${sql.json(['morning','evening'])},'Täglich',${start},true,'Lauwarm abspülen')`;
await sql`insert into "skincareProducts" (id,"userId",name,amount,"timesOfDay",frequency,"startDate","isActive",instructions)
  values (${bpoId},${user.id},'Benzoylperoxid 5%','erbsengross',${sql.json(['evening'])},'Täglich',${start},true,'Dünn auftragen')`;
console.log('✓ Routine angelegt (1 Medikament, 2 Produkte)');

let photos = 0, meals = 0, logs = 0;

for (let offset = DAYS - 1; offset >= 0; offset--) {
  const day = dateStr(offset);

  /* --- Hautfoto + Analyse (mit realistischen Lücken) --- */
  if (rand() > 0.12) {
    const score = scoreFor(offset);
    const sev = (100 - score) / 100;
    const photoId = id(), analysisId = id();
    const path = `${user.id}/seed-${day}-${photoId.slice(0, 8)}.png`;

    const { error } = await storage.from('skin-photos')
      .upload(path, placeholderPhoto(600, 800, score, offset + 1), { contentType: 'image/png', upsert: true });
    if (error) { console.log('Upload-Fehler:', error.message); break; }
    manifest.skinPaths.push(path);

    await sql`insert into "skinPhotos" (id,"userId","imageUrl","takenAt") values (${photoId},${user.id},${path},${at(offset, 21, 5)})`;
    await sql`insert into "skinAnalyses" (id,"skinPhotoId","userId",score,inflammation,redness,"visibleLesions",comedones,dryness,oiliness,"acneScars",summary,confidence,"comparedToPrevious")
      values (${analysisId},${photoId},${user.id},${score},
        ${Math.round(sev * 9)},${Math.round(sev * 8)},${Math.round(sev * 22)},${Math.round(sev * 16)},
        ${Math.round(rand() * 4)},${Math.round(sev * 7)},${Math.round(sev * 6)},
        ${'Testdaten: Sichtbare Rötung im Wangenbereich ' + (score > 65 ? 'geringer als zuletzt' : 'unverändert ausgeprägt') + '. Textur wirkt gleichmässig.'},
        ${0.62 + rand() * 0.3},${score > 62 ? 'improved' : score > 52 ? 'stable' : 'worsened'})`;
    photos++;
  }

  /* --- Mahlzeiten --- */
  const rich = richDays.has(offset);
  const plan = rich
    ? [['Frühstück', MEALS.Frühstück, false], ['Mittagessen', RICH_MEALS.Mittagessen, true], ['Snack', RICH_MEALS.Snack, true], ['Abendessen', RICH_MEALS.Abendessen, true]]
    : [['Frühstück', MEALS.Frühstück, false], ['Mittagessen', MEALS.Mittagessen, false], ...(rand() > 0.5 ? [['Zvieri', MEALS.Zvieri, false]] : []), ['Abendessen', MEALS.Abendessen, false]];

  const hours = { Frühstück: 8, Mittagessen: 12, Zvieri: 16, Snack: 16, Abendessen: 19 };
  for (const [type, list, isRich] of plan) {
    if (rand() > 0.94) continue; // gelegentlich vergessen
    const mealId = id();
    const description = list[Math.floor(rand() * list.length)];
    await sql`insert into meals (id,"userId",type,description,timestamp)
      values (${mealId},${user.id},${type},${description},${at(offset, hours[type], Math.floor(rand() * 40))})`;
    await sql`insert into "foodAnalyses" (id,"mealId",ingredients,"estimatedProperties",confidence,notes)
      values (${id()},${mealId},${sql.json(description.split(/,| mit | und /).map((n) => ({ name: n.trim() })))},
              ${sql.json(props(isRich, /milch|joghurt|butter|glace|käse/i.test(description)))},${0.6 + rand() * 0.35},'Testdaten')`;
    meals++;
  }

  /* --- Routine-Logs, ca. 85 % Compliance --- */
  for (const [itemId, table, col, slots] of [
    [medId, 'medicationLogs', 'medicationId', ['morning']],
    [cleanserId, 'skincareLogs', 'productId', ['morning', 'evening']],
    [bpoId, 'skincareLogs', 'productId', ['evening']],
  ]) {
    for (const slot of slots) {
      const r = rand();
      if (r > 0.97) continue;                       // gar nicht erfasst
      const status = r > 0.85 ? (r > 0.93 ? 'skipped' : 'missed') : 'done';
      await sql`insert into ${sql(table)} (id, ${sql(col)}, "userId", date, "timeOfDay", status)
        values (${id()},${itemId},${user.id},${day},${slot},${status})`;
      logs++;
    }
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`✓ ${photos} Hautfotos + Analysen`);
console.log(`✓ ${meals} Mahlzeiten + Nährwertschätzungen`);
console.log(`✓ ${logs} Routine-Logs`);
console.log('Manifest:', MANIFEST);
await sql.end();
