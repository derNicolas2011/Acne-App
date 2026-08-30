import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

/**
 * Nutzereinstellungen liegen als JSONB in `users.settings`.
 * Bewusst schemalos gehalten, aber beim Lesen typisiert und validiert.
 */
export interface UserSettings {
  /** Vorlagen je Mahlzeitentyp, z. B. das Standard-Frühstück. */
  mealPresets: Record<string, string>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  mealPresets: {},
};

function normalize(raw: unknown): UserSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const value = raw as Partial<UserSettings>;

  const presets: Record<string, string> = {};
  if (value.mealPresets && typeof value.mealPresets === 'object') {
    for (const [key, preset] of Object.entries(value.mealPresets)) {
      if (typeof preset === 'string' && preset.trim().length > 0) {
        presets[key] = preset;
      }
    }
  }

  return { mealPresets: presets };
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const [row] = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return normalize(row?.settings);
}

export async function saveSettings(userId: string, next: UserSettings): Promise<void> {
  await db.update(users).set({ settings: next }).where(eq(users.id, userId));
}

/** Legt die Vorlage für einen Mahlzeitentyp fest (leer = entfernen). */
export async function setMealPreset(
  userId: string,
  mealType: string,
  description: string
): Promise<void> {
  const current = await getSettings(userId);
  const mealPresets = { ...current.mealPresets };

  if (description.trim().length === 0) delete mealPresets[mealType];
  else mealPresets[mealType] = description.trim();

  await saveSettings(userId, { ...current, mealPresets });
}
