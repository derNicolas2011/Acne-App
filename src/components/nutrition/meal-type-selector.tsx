'use client';

import { MEAL_TYPES } from '@/lib/meal-types';
import { cn } from '@/lib/utils';

/** Horizontale Auswahl des Mahlzeitentyps — auf Mobile scrollbar. */
export function MealTypeSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Mahlzeitentyp"
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
    >
      {MEAL_TYPES.map((type) => {
        const active = selected === type.id;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(type.id)}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.875rem] font-medium transition-colors press',
              active
                ? 'border-transparent bg-foreground text-background'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            <span aria-hidden>{type.emoji}</span>
            {type.label}
          </button>
        );
      })}
    </div>
  );
}
