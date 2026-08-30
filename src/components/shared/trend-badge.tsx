import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_BG, deltaTone, formatDelta } from '@/lib/score';

/**
 * Veränderung des Skin Scores. Ein Anstieg ist eine Verbesserung und
 * wird grün und aufwärts dargestellt.
 */
export function TrendBadge({
  delta,
  suffix,
  className,
}: {
  delta: number | null;
  /** Bezugsgrösse, z. B. "gegenüber gestern". */
  suffix?: string;
  className?: string;
}) {
  const formatted = formatDelta(delta);
  if (formatted === null) return null;

  const tone = deltaTone(delta);
  const Icon = delta === 0 ? Minus : delta! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[0.75rem] font-medium',
        TONE_BG[tone],
        className
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      <span className="tabular">{formatted}</span>
      {suffix && <span className="font-normal opacity-80">{suffix}</span>}
    </span>
  );
}
