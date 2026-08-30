'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteSkinEntry } from '@/app/(app)/skin/actions';

/**
 * Löschen eines Hautfotos mit Zwischenschritt — ein versehentlicher Tap
 * darf keine unwiderrufliche Löschung auslösen.
 */
export function DeleteEntryButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteSkinEntry(analysisId);
        toast.success('Foto und Analyse gelöscht');
        router.push('/skin');
      } catch {
        toast.error('Löschen fehlgeschlagen. Bitte versuche es erneut.');
        setConfirming(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[0.8125rem] font-medium text-muted-foreground press hover:text-destructive"
      >
        <Trash2 className="size-4" strokeWidth={1.8} aria-hidden />
        Foto und Analyse löschen
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-destructive/25 bg-alert-soft p-4">
      <p className="text-[0.875rem] font-medium text-alert">
        Foto und Analyse endgültig löschen?
      </p>
      <p className="mt-1 text-[0.8125rem] text-alert/85">
        Das Bild wird aus dem Speicher entfernt und lässt sich nicht wiederherstellen.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-[0.875rem] font-semibold text-destructive-foreground press disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Löschen
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-[0.875rem] font-semibold press"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
