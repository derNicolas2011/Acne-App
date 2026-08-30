'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Check, Droplet, MinusCircle, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { Segmented } from '@/components/shared/segmented';
import { logMedicationStatus, logSkincareStatus } from '@/app/(app)/treatment/actions';
import { TIMES_OF_DAY, type TimeOfDay } from '@/lib/date';
import { cn } from '@/lib/utils';

export interface ChecklistTask {
  id: string;
  kind: 'medication' | 'skincare';
  name: string;
  detail: string | null;
  timeOfDay: TimeOfDay;
  status: 'done' | 'missed' | 'skipped' | 'open';
}

/**
 * Tägliche Checkliste.
 *
 * Ein Tap auf die Zeile hakt ab oder nimmt zurück — das ist die Aktion,
 * die täglich mehrfach passiert. "Übersprungen" liegt als Zweitaktion
 * daneben, damit sie den Hauptweg nicht verlangsamt.
 */
export function DailyChecklist({
  tasks,
  date,
  initialTimeOfDay,
}: {
  tasks: ChecklistTask[];
  date: string;
  initialTimeOfDay: TimeOfDay;
}) {
  const [, startTransition] = useTransition();
  const [activeSlot, setActiveSlot] = useState<TimeOfDay>(initialTimeOfDay);

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (current: ChecklistTask[], update: { key: string; status: ChecklistTask['status'] }) =>
      current.map((task) =>
        `${task.id}-${task.timeOfDay}` === update.key ? { ...task, status: update.status } : task
      )
  );

  // Zeitpunkte, für die überhaupt etwas geplant ist.
  const slotsWithTasks = TIMES_OF_DAY.filter((slot) =>
    tasks.some((task) => task.timeOfDay === slot.id)
  );
  const slots = slotsWithTasks.length > 0 ? slotsWithTasks : TIMES_OF_DAY;
  const visible = optimisticTasks.filter((task) => task.timeOfDay === activeSlot);

  const setStatus = (task: ChecklistTask, status: ChecklistTask['status']) => {
    const key = `${task.id}-${task.timeOfDay}`;
    const persisted = status === 'open' ? 'missed' : status;

    startTransition(async () => {
      applyOptimistic({ key, status });
      try {
        const payload = { id: task.id, date, timeOfDay: task.timeOfDay, status: persisted };
        if (task.kind === 'medication') await logMedicationStatus(payload);
        else await logSkincareStatus(payload);
      } catch {
        toast.error('Konnte nicht gespeichert werden.');
      }
    });
  };

  const doneCount = visible.filter((t) => t.status === 'done').length;

  return (
    <Surface className="space-y-4">
      {slots.length > 1 && (
        <Segmented
          label="Zeitpunkt"
          options={slots.map((s) => ({ value: s.id, label: s.label }))}
          value={activeSlot}
          onChange={setActiveSlot}
        />
      )}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-[0.8125rem] text-muted-foreground">
          Für {TIMES_OF_DAY.find((t) => t.id === activeSlot)?.label.toLowerCase()} ist
          nichts geplant.
        </p>
      ) : (
        <>
          <p className="tabular text-[0.75rem] text-muted-foreground">
            {doneCount} von {visible.length} erledigt
          </p>

          <ul className="space-y-2">
            {visible.map((task) => {
              const done = task.status === 'done';
              const skipped = task.status === 'skipped';
              const Icon = task.kind === 'medication' ? Pill : Droplet;

              return (
                <li key={`${task.id}-${task.timeOfDay}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={done}
                    onClick={() => setStatus(task, done ? 'open' : 'done')}
                    className={cn(
                      'flex min-h-14 flex-1 items-center gap-3 rounded-xl border px-3.5 text-left press',
                      done
                        ? 'border-positive/30 bg-positive-soft'
                        : skipped
                          ? 'border-border bg-muted/40'
                          : 'border-border bg-card'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        done ? 'border-positive bg-positive text-white' : 'border-input'
                      )}
                      aria-hidden
                    >
                      {done && (
                        <Check
                          className="size-3.5 animate-in zoom-in-50 duration-200"
                          strokeWidth={3.5}
                        />
                      )}
                    </span>

                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        done ? 'text-positive' : 'text-muted-foreground'
                      )}
                      strokeWidth={1.9}
                      aria-hidden
                    />

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[0.9375rem] font-medium',
                          skipped && 'text-muted-foreground line-through'
                        )}
                      >
                        {task.name}
                      </span>
                      {task.detail && (
                        <span className="block truncate text-[0.75rem] text-muted-foreground">
                          {task.detail}
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={
                      skipped ? `${task.name} nicht mehr überspringen` : `${task.name} überspringen`
                    }
                    aria-pressed={skipped}
                    onClick={() => setStatus(task, skipped ? 'open' : 'skipped')}
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl border border-border press',
                      skipped ? 'bg-muted text-foreground' : 'bg-card text-muted-foreground'
                    )}
                  >
                    <MinusCircle className="size-[1.125rem]" strokeWidth={1.9} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-[0.75rem] text-muted-foreground">
            Tippen zum Abhaken. Der Kreis rechts markiert bewusst ausgelassene Anwendungen.
          </p>
        </>
      )}
    </Surface>
  );
}
