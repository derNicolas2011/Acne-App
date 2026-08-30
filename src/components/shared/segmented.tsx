'use client';

import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

/**
 * Segmentierte Auswahl im iOS-Stil. Ersetzt Tabs überall dort, wo es um
 * das Umschalten eines Zeitraums oder einer Ansicht geht.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex gap-0.5 rounded-xl bg-muted p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-9 flex-1 rounded-lg px-2 text-[0.8125rem] font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Ein-/ausschaltbarer Filter-Chip. */
export function FilterChip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[0.75rem] font-medium transition-colors press',
        active
          ? 'border-transparent bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      )}
    >
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: active ? 'currentColor' : color }}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
