import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createHash, timingSafeEqual } from 'node:crypto';
import { ensureAppUser } from '@/lib/db/user';

/** Konstantzeit-Vergleich zweier Secrets (schützt vor Timing-Angriffen). */
function secretsMatch(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Benutzername', type: 'text' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        const expectedUsername = process.env.AUTH_USERNAME || 'admin';
        const expectedPassword = process.env.AUTH_PASSWORD;

        if (!expectedPassword) {
          // Ohne gesetztes Passwort ist keine Anmeldung möglich — es gibt
          // bewusst keinen offenen Fallback.
          console.error('AUTH_PASSWORD ist nicht gesetzt; Anmeldung deaktiviert.');
          return null;
        }

        const username = typeof credentials?.username === 'string' ? credentials.username : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!username || !password) return null;
        if (!secretsMatch(username, expectedUsername)) return null;
        if (!secretsMatch(password, expectedPassword)) return null;

        // Legt die users-Zeile an, falls sie noch fehlt, und liefert die
        // echte UUID — alle Datentabellen verweisen per FK darauf.
        const id = await ensureAppUser();
        return { id, name: expectedUsername };
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === 'string') {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
