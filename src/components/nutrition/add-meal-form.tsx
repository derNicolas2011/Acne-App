'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Camera, Check, Loader2, Repeat, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { MealTypeSelector } from '@/components/nutrition/meal-type-selector';
import {
  addMeal,
  loadFrequentMeals,
  loadLastMeal,
  saveMealPreset,
} from '@/app/(app)/nutrition/actions';
import { prepareImage } from '@/lib/image';
import { cn } from '@/lib/utils';

interface AddMealFormProps {
  initialType: string;
  /** Gespeicherte Vorlagen je Mahlzeitentyp (z. B. Standard-Frühstück). */
  presets: Record<string, string>;
}

/**
 * Mahlzeit erfassen.
 *
 * Der schnellste Weg ist ein Tap: Der Typ ist nach Uhrzeit vorausgewählt,
 * darunter stehen Vorlage und häufige Einträge als Chips, die direkt speichern.
 */
export function AddMealForm({ initialType, presets }: AddMealFormProps) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [frequent, setFrequent] = useState<{ description: string; count: number }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const preset = presets[type];

  // Häufige Einträge des gewählten Typs nachladen.
  useEffect(() => {
    let cancelled = false;
    loadFrequentMeals(type)
      .then((rows) => {
        if (!cancelled) setFrequent(rows);
      })
      .catch(() => {
        if (!cancelled) setFrequent([]);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const save = (payload: { description?: string; imageBase64?: string }) => {
    startTransition(async () => {
      try {
        await addMeal({ type, ...payload });
        toast.success('Gespeichert');
        router.push('/nutrition');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Die Mahlzeit konnte nicht gespeichert werden.'
        );
      }
    });
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusyLabel('Foto wird vorbereitet …');
    try {
      const prepared = await prepareImage(file, 1280);
      setPhoto(prepared.dataUrl);
    } catch {
      toast.error('Das Foto konnte nicht verarbeitet werden.');
    } finally {
      setBusyLabel(null);
    }
  };

  const handleRepeat = () => {
    startTransition(async () => {
      const last = await loadLastMeal(type);
      if (last?.description) {
        setDescription(last.description);
        toast.success('Letzte Mahlzeit übernommen');
      } else {
        toast.info(`Noch kein früherer Eintrag für ${type}.`);
      }
    });
  };

  const handleSavePreset = () => {
    const value = description.trim();
    if (!value) return;
    startTransition(async () => {
      await saveMealPreset(type, value);
      toast.success(`Als Vorlage für ${type} gespeichert`);
    });
  };

  const canSave = (description.trim().length > 0 || photo !== null) && !isPending;
  const quickPicks = [
    ...(preset ? [{ description: preset, isPreset: true }] : []),
    ...frequent
      .filter((f) => f.description !== preset)
      .map((f) => ({ description: f.description, isPreset: false })),
  ].slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="space-y-2.5">
        <h2 className="text-[0.8125rem] font-medium text-muted-foreground">Mahlzeit</h2>
        <MealTypeSelector selected={type} onSelect={setType} />
      </section>

      {quickPicks.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
            Direkt übernehmen
          </h2>
          <div className="space-y-2">
            {quickPicks.map((pick) => (
              <button
                key={pick.description}
                type="button"
                disabled={isPending}
                onClick={() => save({ description: pick.description })}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left press disabled:opacity-60"
              >
                {pick.isPreset ? (
                  <Star
                    className="size-4 shrink-0 fill-caution text-caution"
                    strokeWidth={1.8}
                    aria-hidden
                  />
                ) : (
                  <Repeat className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
                )}
                <span className="flex-1 truncate text-[0.875rem]">{pick.description}</span>
                <Check className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2.5">
        <h2 className="text-[0.8125rem] font-medium text-muted-foreground">
          Neu erfassen
        </h2>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />

        <Surface className="space-y-3">
          {photo && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="Foto der Mahlzeit"
                className="h-44 w-full rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                aria-label="Foto entfernen"
                className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white press"
              >
                <X className="size-4" strokeWidth={2.4} aria-hidden />
              </button>
            </div>
          )}

          <label className="sr-only" htmlFor="meal-description">
            Beschreibung der Mahlzeit
          </label>
          <textarea
            id="meal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z. B. Brot mit Butter und Honig, laktosefreie Milch"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-[1rem] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isPending || busyLabel !== null}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[0.8125rem] font-medium press disabled:opacity-60"
            >
              {busyLabel ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-4" strokeWidth={1.9} aria-hidden />
              )}
              {photo ? 'Foto ersetzen' : 'Foto'}
            </button>

            <button
              type="button"
              onClick={handleRepeat}
              disabled={isPending}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[0.8125rem] font-medium press disabled:opacity-60"
            >
              <Repeat className="size-4" strokeWidth={1.9} aria-hidden />
              Wiederholen
            </button>

            {description.trim().length > 0 && (
              <button
                type="button"
                onClick={handleSavePreset}
                disabled={isPending}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[0.8125rem] font-medium press disabled:opacity-60"
              >
                <Bookmark className="size-4" strokeWidth={1.9} aria-hidden />
                Als Vorlage
              </button>
            )}
          </div>
        </Surface>
      </section>

      <button
        type="button"
        onClick={() => save({ description, imageBase64: photo ?? undefined })}
        disabled={!canSave}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[0.9375rem] font-semibold text-primary-foreground shadow-raised press',
          !canSave && 'opacity-45 shadow-none'
        )}
      >
        {isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Speichern
      </button>

      <p className="px-1 text-center text-[0.75rem] leading-relaxed text-muted-foreground">
        Bestandteile werden im Hintergrund geschätzt — die Mahlzeit ist sofort gespeichert.
      </p>
    </div>
  );
}
