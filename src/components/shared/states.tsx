import { cn } from '@/lib/utils';

/**
 * Einheitliche Leer-, Lade- und Fehlerzustände.
 * Kein Bereich der App zeigt eine unerklärte leere Fläche.
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-[0.9375rem] font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-xs text-[0.8125rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Etwas ist schiefgelaufen',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-alert/25 bg-alert-soft px-5 py-4 text-center',
        className
      )}
    >
      <p className="text-[0.9375rem] font-medium text-alert">{title}</p>
      {description && (
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-alert/85">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Grundbaustein aller Ladezustände — ruhiges Pulsieren statt Spinner. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/** Hinweis, dass Daten für eine Aussage noch nicht ausreichen. */
export function InsufficientDataNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-muted/70 px-4 py-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
