import { cn } from '@/lib/utils';

/**
 * Die Karte ist der einzige Flächen-Baustein der App.
 * Weisse Fläche auf warmem Papierton, weicher Radius, minimaler Schatten.
 */
export function Surface({
  children,
  className,
  as: Component = 'div',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  padded?: boolean;
}) {
  return (
    <Component
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-card',
        padded && 'p-5',
        className
      )}
    >
      {children}
    </Component>
  );
}

/** Kleine Kennzahl mit Beschriftung — für Kacheln und Übersichten. */
export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'caution' | 'alert';
  className?: string;
}) {
  const toneClass = {
    neutral: 'text-foreground',
    positive: 'text-positive',
    caution: 'text-caution',
    alert: 'text-alert',
  }[tone];

  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[0.75rem] font-medium text-muted-foreground">{label}</p>
      <p className={cn('tabular mt-1 text-[1.5rem] font-semibold leading-none', toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
