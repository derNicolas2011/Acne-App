'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export async function login(_prevState: string | undefined, formData: FormData) {
  const callbackUrl = formData.get('callbackUrl');
  const redirectTo = typeof callbackUrl === 'string' && callbackUrl.startsWith('/')
    ? callbackUrl
    : '/';

  try {
    await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Benutzername oder Passwort ist falsch.';
        default:
          return 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';
      }
    }
    // NEXT_REDIRECT und andere Kontrollfluss-Fehler müssen durchgereicht werden.
    throw error;
  }
}

export async function logout() {
  const { signOut } = await import('@/lib/auth');
  await signOut({ redirectTo: '/login' });
}
