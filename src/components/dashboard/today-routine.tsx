import Link from 'next/link';
import { Check, ChevronRight } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { cn } from '@/lib/utils';

interface TodayRoutineProps {
  medications: { total: number; completed: number };
  skincare: { total: number; completed: number };
}

/** Kompakter Routine-Fortschritt mit Sprung in die Checkliste. */
export function TodayRoutine({ medications, skincare }: TodayRoutineProps) {
  const total = medications.total + skincare.total;
  const completed = medications.completed + skincare.completed;

  return (
    <Link href="/treatment" className="block press">
      <Surface>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.75rem] font-medium text-muted-foreground">Heutige Routine</p>
            <p className="tabular mt-1 text-[1.0625rem] font-semibold">
              {total === 0 ? 'Nichts geplant' : `${completed} / ${total} erledigt`}
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        {total === 0 ? (
          <p className="mt-2 text-[0.8125rem] text-muted-foreground">
            Lege Medikamente oder Skincare an, um sie täglich abzuhaken.
          </p>
        ) : (
          <>
            <div
              className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Routine-Fortschritt"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-700',
                  completed === total ? 'bg-positive' : 'bg-primary'
                )}
                style={{
                  width: `${(completed / total) * 100}%`,
                  transitionTimingFunction: 'var(--ease-out-soft)',
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              <RoutineLine
                label="Medikamente"
                completed={medications.completed}
                total={medications.total}
              />
              <RoutineLine
                label="Skincare"
                completed={skincare.completed}
                total={skincare.total}
              />
            </div>
          </>
        )}
      </Surface>
    </Link>
  );
}

function RoutineLine({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  if (total === 0) return null;
  const done = completed === total;

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem]">
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded-full',
          done ? 'bg-positive text-white' : 'border border-border'
        )}
        aria-hidden
      >
        {done && <Check className="size-2.5" strokeWidth={3.5} />}
      </span>
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
        {label} <span className="tabular">{completed}/{total}</span>
      </span>
    </span>
  );
}
