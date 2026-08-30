'use client';

import { useActionState, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { deleteAllData, type DeleteState } from '@/app/(app)/settings/actions';

/**
 * Vollständige Löschung. Bewusst mit Tippbestätigung — bei Gesundheits-
 * und Bilddaten darf ein Fehltap nicht alles entfernen.
 */
export function DeleteAllData() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<DeleteState, FormData>(deleteAllData, {
    status: 'idle',
  });

  return (
    <Surface className="space-y-3">
      <div>
        <h3 className="text-[0.9375rem] font-medium">Alle Daten löschen</h3>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          Entfernt sämtliche Fotos, Analysen, Mahlzeiten und Routine-Einträge
          endgültig. Dein Zugang bleibt bestehen.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 w-full rounded-xl border border-destructive/30 text-[0.875rem] font-semibold text-destructive press"
        >
          Löschen …
        </button>
      ) : (
        <form action={formAction} className="space-y-3 border-t border-border pt-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-alert-soft px-3.5 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-alert" strokeWidth={2} aria-hidden />
            <p className="text-[0.8125rem] leading-relaxed text-alert">
              Dieser Schritt lässt sich nicht rückgängig machen. Erwäge vorher
              einen Export.
            </p>
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">
              Tippe <span className="font-semibold text-foreground">LÖSCHEN</span> zur Bestätigung
            </label>
            <input
              id="confirm"
              name="confirm"
              autoComplete="off"
              autoCapitalize="characters"
              required
              className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-[1rem] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>

          {state.status === 'error' && (
            <p role="alert" className="text-[0.8125rem] text-alert">
              {state.message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive text-[0.875rem] font-semibold text-destructive-foreground press disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Endgültig löschen
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 flex-1 rounded-xl border border-border text-[0.875rem] font-semibold press"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </Surface>
  );
}
