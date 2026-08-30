import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Anmelden' };

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em]">Skin Tracker</h1>
          <p className="mt-1.5 text-[0.875rem] text-muted-foreground">
            Melde dich an, um fortzufahren.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-[0.75rem] leading-relaxed text-muted-foreground">
          Deine Fotos und Gesundheitsdaten sind privat gespeichert und nur
          nach Anmeldung abrufbar.
        </p>
      </div>
    </main>
  );
}
