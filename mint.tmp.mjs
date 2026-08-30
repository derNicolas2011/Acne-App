import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local', quiet: true });
import { encode } from 'next-auth/jwt';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const [u] = await sql`select id, name from users where email='admin@local' limit 1`;
await sql.end();
if (!u) { console.log('Keine users-Zeile gefunden'); process.exit(1); }

const COOKIE = 'authjs.session-token';
const now = Math.floor(Date.now() / 1000);

// Gleiche Struktur, die der jwt-Callback in src/lib/auth.ts erzeugt.
const token = await encode({
  token: {
    name: u.name,
    userId: u.id,
    sub: u.id,
    iat: now,
    exp: now + 60 * 60 * 24 * 30,
    jti: crypto.randomUUID(),
  },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
});

console.log(JSON.stringify({ name: COOKIE, value: token, userId: u.id }));
