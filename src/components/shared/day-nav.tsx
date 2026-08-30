'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Tagesweise Navigation über `?date=`. Zukünftige Tage sind gesperrt. */
export function DayNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const isToday = date === today;
  const go = (next: string) => {
    router.push(next === today ? pathname : `${pathname}?date=${next}`);
  };

  const label = new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-1.5 py-1.5">
      <button
        type="button"
        onClick={() => go(shift(date, -1))}
        aria-label="Vorheriger Tag"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground press hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <div className="min-w-0 text-center">
        <p className="truncate text-[0.875rem] font-medium">{isToday ? 'Heute' : label}</p>
        {!isToday && (
          <button
            type="button"
            onClick={() => go(today)}
            className="text-[0.75rem] text-primary press"
          >
            Zu heute
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => go(shift(date, 1))}
        disabled={isToday}
        aria-label="Nächster Tag"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground press hover:bg-muted hover:text-foreground',
          isToday && 'pointer-events-none opacity-30'
        )}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
