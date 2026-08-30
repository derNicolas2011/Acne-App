import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { MEAL_TYPES } from '@/lib/meal-types';

/** Welche Mahlzeiten heute schon erfasst sind. */
export function TodayNutrition({ count, types }: { count: number; types: string[] }) {
  const logged = new Set(types);

  return (
    <Link href="/nutrition" className="block press">
      <Surface>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.75rem] font-medium text-muted-foreground">Ernährung</p>
            <p className="tabular mt-1 text-[1.0625rem] font-semibold">
              {count === 0
                ? 'Noch nichts erfasst'
                : `${count} ${count === 1 ? 'Mahlzeit' : 'Mahlzeiten'}`}
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {MEAL_TYPES.filter((t) => t.primary).map((type) => {
            const isLogged = logged.has(type.id);
            return (
              <span
                key={type.id}
                className={
                  isLogged
                    ? 'inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[0.75rem] font-medium text-accent-foreground'
                    : 'inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[0.75rem] text-muted-foreground'
                }
              >
                <span aria-hidden>{type.emoji}</span>
                {type.label}
              </span>
            );
          })}
        </div>
      </Surface>
    </Link>
  );
}
