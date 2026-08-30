'use client';

import { useActionState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { generateDailyReport, type ReportState } from '@/app/(app)/analysis/actions';

/** Löst die KI-Tageszusammenfassung für ein Datum aus. */
export function GenerateReportButton({
  date,
  label = 'Tageszusammenfassung erstellen',
}: {
  date: string;
  label?: string;
}) {
  const [state, formAction, isPending] = useActionState<ReportState, FormData>(
    generateDailyReport,
    { status: 'idle' }
  );

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="date" value={date} />
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[0.875rem] font-semibold press disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4 text-primary" strokeWidth={1.9} aria-hidden />
        )}
        {isPending ? 'Wird erstellt …' : label}
      </button>

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl bg-alert-soft px-3.5 py-2.5 text-[0.8125rem] text-alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
