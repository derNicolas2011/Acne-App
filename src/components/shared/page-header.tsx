import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Zurück-Ziel; blendet einen grossen Touch-Pfeil links ein. */
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  /** Grosse, ruhige Variante für Einstiegsseiten. */
  size?: 'default' | 'large';
  className?: string;
}

/**
 * Einheitlicher Seitenkopf. Bleibt beim Scrollen oben stehen und legt sich
 * mit Blur über den Inhalt — verankert die Orientierung ohne Platz zu kosten.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Zurück',
  action,
  size = 'default',
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl',
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 md:px-6 md:py-4">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground press hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              'truncate font-semibold',
              size === 'large' ? 'text-[1.375rem]' : 'text-[1.0625rem]'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

/** Standard-Inhaltsbreite und -abstände jeder Seite. */
export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-3xl space-y-6 px-4 py-5 md:px-6 md:py-7', className)}>
      {children}
    </div>
  );
}

/** Abschnittsüberschrift mit optionaler Aktion rechts. */
export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
      {action}
    </div>
  );
}
