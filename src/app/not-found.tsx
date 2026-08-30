import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[1.125rem] font-semibold">Nicht gefunden</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
        Diese Seite existiert nicht oder der Eintrag wurde gelöscht.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-[0.875rem] font-semibold text-primary-foreground press"
      >
        Zur Übersicht
      </Link>
    </main>
  );
}
