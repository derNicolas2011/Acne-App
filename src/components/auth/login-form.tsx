'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { login } from '@/app/login/actions';

const inputClass =
  'min-h-12 w-full rounded-xl border border-input bg-card px-3.5 text-[1rem] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor="username" className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">
          Benutzername
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className={inputClass}
        />
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-xl bg-alert-soft px-3.5 py-3 text-[0.8125rem] text-alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[0.9375rem] font-semibold text-primary-foreground press disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {isPending ? 'Wird angemeldet …' : 'Anmelden'}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          const form = e.currentTarget.closest('form');
          if (form) {
            const u = form.elements.namedItem('username') as HTMLInputElement;
            const p = form.elements.namedItem('password') as HTMLInputElement;
            if (u && p) {
              u.value = 'admin';
              p.value = 'password';
              form.requestSubmit();
            }
          }
        }}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted text-[0.9375rem] font-semibold text-foreground press disabled:opacity-60"
      >
        Demo Zugang (Auto-Login)
      </button>
    </form>
  );
}
