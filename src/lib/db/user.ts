import { eq } from 'drizzle-orm';
import { db } from './index';
import { users } from './schema';

/**
 * E-Mail-Identität des Single-User-Kontos. Die App ist aktuell für genau
 * einen Nutzer gedacht, die Datenstruktur (userId-Spalten, FKs) ist aber
 * bereits mehrbenutzerfähig.
 */
export function singleUserEmail(): string {
  return process.env.AUTH_EMAIL || `${process.env.AUTH_USERNAME || 'admin'}@local`;
}

/**
 * Stellt sicher, dass für das konfigurierte Konto eine Zeile in `users`
 * existiert, und liefert deren ID zurück.
 *
 * Notwendig, weil alle Datentabellen per Fremdschlüssel auf `users.id`
 * verweisen — ohne diese Zeile schlägt jedes Insert fehl.
 */
export async function ensureAppUser(): Promise<string> {
  const email = singleUserEmail();
  const name = process.env.AUTH_USERNAME || 'admin';

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({ email, name })
    .onConflictDoUpdate({ target: users.email, set: { name } })
    .returning({ id: users.id });

  return created.id;
}
