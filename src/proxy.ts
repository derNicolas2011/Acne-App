import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * In Next.js 16 heisst die frühere `middleware.ts` `proxy.ts`.
 *
 * Der Proxy ist hier bewusst nur ein günstiger UX-Gate: Er prüft, ob
 * überhaupt ein Session-Cookie vorhanden ist, und leitet sonst auf /login.
 * Die eigentliche Sicherheitsgrenze sind `requireUser()` / `requireUserId()`
 * in jeder Page, Server Action und Route — der Proxy validiert das Token
 * nicht und darf nie die einzige Prüfung sein.
 */
const SESSION_COOKIES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

const PUBLIC_PATHS = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // API-Routen prüfen selbst und antworten mit 401 JSON. Ein Redirect auf
  // eine HTML-Seite wäre für einen fetch-Aufruf die falsche Antwort.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Alles ausser Next-Interna und statischen Dateien.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
};
