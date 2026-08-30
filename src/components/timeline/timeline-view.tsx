import Link from 'next/link';
import { Camera, Droplet, Pill, UtensilsCrossed } from 'lucide-react';
import type { TimelineEntry, TimelineEventType } from '@/lib/queries/timeline';
import { cn } from '@/lib/utils';

const ICONS: Record<TimelineEventType, typeof Pill> = {
  medication: Pill,
  skincare: Droplet,
  meal: UtensilsCrossed,
  skin_photo: Camera,
};

/**
 * Der Tag als Zeitachse.
 * Eine durchgehende Linie, ruhige Punkte, Uhrzeit links — bewusst ohne
 * Farbcodierung je Typ, damit der Ablauf im Vordergrund steht.
 */
export function TimelineView({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-1">
      {/* Durchgehende Achse hinter den Punkten. */}
      <span
        className="absolute top-3 bottom-3 left-20 w-px bg-border"
        aria-hidden
      />

      {entries.map((entry) => {
        const Icon = ICONS[entry.type];
        const skipped = entry.status === 'skipped' || entry.status === 'missed';

        const content = (
          <div className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors">
            <span className="tabular w-11 shrink-0 pt-1.5 text-right text-[0.75rem] text-muted-foreground">
              {entry.time}
            </span>

            <span
              className={cn(
                'relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card',
                skipped ? 'text-muted-foreground/60' : 'text-foreground'
              )}
              aria-hidden
            >
              <Icon className="size-3.5" strokeWidth={1.9} />
            </span>

            <span className="min-w-0 flex-1 pt-0.5">
              <span
                className={cn(
                  'block truncate text-[0.875rem] font-medium',
                  skipped && 'text-muted-foreground line-through'
                )}
              >
                {entry.title}
              </span>
              {entry.description && (
                <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {entry.description}
                </span>
              )}
            </span>
          </div>
        );

        return (
          <li key={entry.id}>
            {entry.href ? (
              <Link href={entry.href} className="block press hover:bg-muted/50 rounded-xl">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
