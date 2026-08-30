'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { deleteMeal } from '@/app/(app)/nutrition/actions';
import { mealEmoji } from '@/lib/meal-types';

export interface MealCardData {
  id: string;
  type: string;
  description: string | null;
  time: string;
  photoUrl: string | null;
}

/** Eine erfasste Mahlzeit mit Wisch-freiem Löschen über Bestätigung. */
export function MealCard({ meal }: { meal: MealCardData }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMeal(meal.id);
        toast.success('Mahlzeit gelöscht');
      } catch {
        toast.error('Löschen fehlgeschlagen');
        setConfirming(false);
      }
    });
  };

  return (
    <Surface padded={false} className="p-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[1.25rem] leading-none" aria-hidden>
          {mealEmoji(meal.type)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-[0.875rem] font-medium">{meal.type}</p>
            <p className="tabular text-[0.75rem] text-muted-foreground">{meal.time}</p>
          </div>
          {meal.description && (
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {meal.description}
            </p>
          )}
        </div>

        {meal.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.photoUrl}
            alt=""
            className="size-14 shrink-0 rounded-lg border border-border object-cover"
          />
        )}

        <button
          type="button"
          onClick={() => setConfirming((v) => !v)}
          aria-label={`${meal.type} löschen`}
          aria-expanded={confirming}
          className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground press hover:text-destructive"
        >
          <Trash2 className="size-4" strokeWidth={1.8} aria-hidden />
        </button>
      </div>

      {confirming && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <p className="flex-1 text-[0.8125rem] text-muted-foreground">Eintrag löschen?</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-destructive px-3.5 text-[0.8125rem] font-semibold text-destructive-foreground press disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Löschen
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-9 rounded-full border border-border px-3.5 text-[0.8125rem] font-medium press"
          >
            Abbrechen
          </button>
        </div>
      )}
    </Surface>
  );
}
