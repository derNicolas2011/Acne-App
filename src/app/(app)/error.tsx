'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';

/**
 * Fehlergrenze für alle App-Seiten. Zeigt nie technische Details —
 * diese landen im Log, nicht vor dem Nutzer.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fehler in der App:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[1.125rem] font-semibold">Das hat nicht geklappt</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
        Diese Ansicht konnte nicht geladen werden. Deine Daten sind davon
        nicht betroffen.
      </p>

      <div className="mt-6 flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-[0.875rem] font-semibold text-primary-foreground press"
        >
          <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-card text-[0.875rem] font-semibold press"
        >
          Zur Übersicht
        </Link>
      </div>
    </div>
  );
}
