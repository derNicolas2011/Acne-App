import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export interface AppSessionUser {
  id: string;
  name: string;
}

/**
 * Liefert den angemeldeten Nutzer oder leitet auf /login um.
 * Für Server Components und Pages.
 */
export async function requireUser(): Promise<AppSessionUser> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return { id: session.user.id, name: session.user.name || 'Nicolas' };
}

/**
 * Wie `requireUser`, wirft aber statt umzuleiten.
 * Für Server Actions und Route Handler, wo ein Redirect unpassend ist.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Nicht authentifiziert');
  return session.user.id;
}

/** Liefert die User-ID oder null — für Route Handler mit eigener 401-Antwort. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
