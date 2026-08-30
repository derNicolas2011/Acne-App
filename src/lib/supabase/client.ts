import { createClient } from '@supabase/supabase-js';

/**
 * Supabase-Zugriff — ausschliesslich serverseitig.
 *
 * Dieses Modul enthält bewusst *nur* den Service-Role-Client und keinen
 * Client für den Browser. Läge beides in derselben Datei, würde ein
 * versehentlicher Import aus einer Client-Komponente den Service-Role-Key
 * ins Browser-Bundle ziehen. Der Zugriff auf Bilder läuft stattdessen
 * durchgehend über kurzlebige signierte URLs, die der Server erzeugt.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Früh und deutlich scheitern statt später mit unklaren Storage-Fehlern.
  throw new Error(
    'Supabase ist nicht konfiguriert: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden benötigt.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
