'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { TIMES_OF_DAY, today, type TimeOfDay } from '@/lib/date';
import { cn } from '@/lib/utils';

export interface RoutineFormField {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  /** Halbe Breite, damit zwei Felder nebeneinander passen. */
  half?: boolean;
}

interface RoutineItemFormProps {
  /** Zusätzliche Felder über Name, Zeitpunkt und Häufigkeit hinaus. */
  fields: RoutineFormField[];
  frequencies: readonly string[];
  defaultTimesOfDay: TimeOfDay[];
  namePlaceholder: string;
  submitLabel: string;
  onSubmit: (values: Record<string, string> & { timesOfDay: TimeOfDay[] }) => Promise<void>;
  redirectTo: string;
}

/**
 * Gemeinsames Formular für Medikamente und Skincare.
 * Beide unterscheiden sich nur in ihren Zusatzfeldern — vorher lagen die
 * Formulare als fast identische Kopien nebeneinander.
 */
export function RoutineItemForm({
  fields,
  frequencies,
  defaultTimesOfDay,
  namePlaceholder,
  submitLabel,
  onSubmit,
  redirectTo,
}: RoutineItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeOfDay[]>(defaultTimesOfDay);
  const [values, setValues] = useState<Record<string, string>>({
    name: '',
    frequency: frequencies[0],
    startDate: today(),
    endDate: '',
    ...Object.fromEntries(fields.map((f) => [f.name, ''])),
  });

  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const toggleSlot = (slot: TimeOfDay) =>
    setSlots((current) =>
      current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot]
    );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (values.name.trim().length === 0) {
      setError('Bitte gib einen Namen an.');
      return;
    }
    if (slots.length === 0) {
      setError('Bitte wähle mindestens einen Zeitpunkt.');
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit({ ...values, timesOfDay: slots } as Record<string, string> & {
          timesOfDay: TimeOfDay[];
        });
        toast.success('Gespeichert');
        router.push(redirectTo);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Der Eintrag konnte nicht gespeichert werden.'
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Surface className="space-y-4">
        <Field label="Name" htmlFor="name">
          <input
            id="name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={namePlaceholder}
            required
            maxLength={120}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {fields
            .filter((f) => f.half)
            .map((field) => (
              <Field key={field.name} label={field.label} htmlFor={field.name}>
                <input
                  id={field.name}
                  value={values[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              </Field>
            ))}
        </div>

        {fields
          .filter((f) => !f.half)
          .map((field) => (
            <Field key={field.name} label={field.label} htmlFor={field.name}>
              {field.multiline ? (
                <textarea
                  id={field.name}
                  value={values[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  maxLength={1000}
                  className={cn(inputClass, 'resize-none py-3 leading-relaxed')}
                />
              ) : (
                <input
                  id={field.name}
                  value={values[field.name]}
                  onChange={(e) => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
            </Field>
          ))}
      </Surface>

      <Surface className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-[0.8125rem] font-medium text-muted-foreground">
            Zeitpunkte
          </legend>
          <div className="flex flex-wrap gap-2">
            {TIMES_OF_DAY.map((slot) => {
              const active = slots.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSlot(slot.id)}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-[0.875rem] font-medium transition-colors press',
                    active
                      ? 'border-transparent bg-foreground text-background'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Häufigkeit" htmlFor="frequency">
          <select
            id="frequency"
            value={values.frequency}
            onChange={(e) => set('frequency', e.target.value)}
            className={inputClass}
          >
            {frequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" htmlFor="startDate">
            <input
              id="startDate"
              type="date"
              value={values.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Ende (optional)" htmlFor="endDate">
            <input
              id="endDate"
              type="date"
              value={values.endDate}
              min={values.startDate}
              onChange={(e) => set('endDate', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Surface>

      {error && (
        <p role="alert" className="rounded-xl bg-alert-soft px-4 py-3 text-[0.8125rem] text-alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[0.9375rem] font-semibold text-primary-foreground shadow-raised press disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {submitLabel}
      </button>
    </form>
  );
}

/* Feldhöhe 44px = Mindestgrösse für Touch-Ziele; 16px Schrift verhindert
   den Auto-Zoom von iOS Safari beim Fokussieren. */
const inputClass =
  'min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-[1rem] placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
