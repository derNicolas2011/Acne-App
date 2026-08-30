'use client';

import { useActionState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { InsightBlock, InsightGroup } from '@/components/shared/ai-insight';
import { requestMealAdvice, type MealAdviceState } from '@/app/(app)/nutrition/actions';
import { cn } from '@/lib/utils';

const PROFILE_LABEL = {
  konservativ: 'zurückhaltender',
  ausgewogen: 'ausgewogen',
  reichhaltig: 'reichhaltiger',
} as const;

const PROFILE_CLASS = {
  konservativ: 'bg-positive-soft text-positive',
  ausgewogen: 'bg-muted text-muted-foreground',
  reichhaltig: 'bg-caution-soft text-caution',
} as const;

/**
 * "Ich gehe heute zu …" — vergleicht Optionen, statt Lebensmittel zu bewerten.
 * Die Trennung von allgemeiner Information und Unsicherheit ist bewusst
 * sichtbar, damit nichts als gesicherter Zusammenhang gelesen wird.
 */
export function MealAdvisor() {
  const [state, formAction, isPending] = useActionState<MealAdviceState, FormData>(
    requestMealAdvice,
    { status: 'idle' }
  );

  return (
    <Surface className="space-y-4">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.9} aria-hidden />
        <div>
          <h2 className="text-[0.9375rem] font-semibold">Vor dem Essen abwägen</h2>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Beschreibe, wo du isst — du bekommst einen Vergleich der Optionen,
            keine Empfehlung.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="sr-only" htmlFor="advice-question">
          Situation beschreiben
        </label>
        <textarea
          id="advice-question"
          name="question"
          rows={2}
          maxLength={500}
          required
          placeholder="z. B. Ich gehe heute Abend zu Burger King."
          className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-[1rem] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[0.875rem] font-semibold press disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isPending ? 'Optionen werden verglichen …' : 'Optionen vergleichen'}
        </button>
      </form>

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl bg-alert-soft px-3.5 py-3 text-[0.8125rem] text-alert">
          {state.message}
        </p>
      )}

      {state.status === 'ok' && (
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-[0.875rem] leading-relaxed">{state.advice.situation}</p>

          <ul className="space-y-2.5">
            {state.advice.options.map((option) => (
              <li key={option.title} className="rounded-xl bg-muted/50 px-3.5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.875rem] font-medium">{option.title}</p>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
                      PROFILE_CLASS[option.profile]
                    )}
                  >
                    {PROFILE_LABEL[option.profile]}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {option.note}
                </p>
              </li>
            ))}
          </ul>

          <InsightGroup>
            <InsightBlock label="Allgemein bekannt">{state.advice.generalNote}</InsightBlock>
            <InsightBlock label="Unsicher">{state.advice.uncertainty}</InsightBlock>
          </InsightGroup>
        </div>
      )}
    </Surface>
  );
}
