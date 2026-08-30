'use client';

import { useTransition } from 'react';
import { Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { removeMealPreset } from '@/app/(app)/settings/actions';
import { mealEmoji } from '@/lib/meal-types';

/**
 * Gespeicherte Vorlagen, z. B. das Standard-Frühstück.
 * Angelegt werden sie direkt beim Erfassen einer Mahlzeit.
 */
export function MealPresets({ presets }: { presets: Record<string, string> }) {
  const [isPending, startTransition] = useTransition();
  const entries = Object.entries(presets);

  if (entries.length === 0) {
    return (
      <Surface>
        <div className="flex items-start gap-2.5">
          <Star className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} aria-hidden />
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            Noch keine Vorlagen. Beim Erfassen einer Mahlzeit kannst du sie über
            „Als Vorlage“ sichern — sie erscheint dann dort mit einem Tap
            zum Übernehmen.
          </p>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([type, description]) => (
        <Surface key={type} padded={false} className="flex items-start gap-3 p-3.5">
          <span className="text-[1.125rem] leading-none" aria-hidden>
            {mealEmoji(type)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.875rem] font-medium">{type}</p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await removeMealPreset(type);
                toast.success('Vorlage entfernt');
              })
            }
            aria-label={`Vorlage für ${type} entfernen`}
            className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground press hover:text-destructive disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </Surface>
      ))}
    </div>
  );
}
