import { cn } from '@/lib/utils';

/**
 * Darstellung von KI-Ergebnissen.
 *
 * Bewusst als kurze, benannte Blöcke statt als Fliesstext — die App soll
 * nicht wie ein Chatfenster wirken, und der Nutzer soll auf einen Blick
 * sehen, was Beobachtung, was Vergleich und was Einordnung ist.
 */
export function InsightBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-l-2 border-border pl-3.5', className)}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-[0.875rem] leading-relaxed">{children}</div>
    </div>
  );
}

export function InsightGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-3.5', className)}>{children}</div>;
}

/**
 * Fester Hinweis unter jeder KI-Ausgabe. Die App macht sichtbar,
 * dass es sich um eine visuelle Schätzung handelt, nicht um eine Diagnose.
 */
export function MedicalDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'rounded-xl bg-muted/70 px-3.5 py-3 text-[0.75rem] leading-relaxed text-muted-foreground',
        className
      )}
    >
      Visuelle Schätzung auf Basis eines Fotos — keine medizinische Diagnose.
      Bei Fragen zu Behandlung oder Medikation wende dich an deine Fachperson.
    </p>
  );
}

/** Kennzeichnet, wie belastbar eine Aussage ist. */
export function ConfidenceTag({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const percent = Math.round(value * 100);
  const label = percent >= 75 ? 'hoch' : percent >= 50 ? 'mittel' : 'gering';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground">
      Bildqualität für die Einschätzung: {label}
      <span className="tabular opacity-70">({percent}%)</span>
    </span>
  );
}
