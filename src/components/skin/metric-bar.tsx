import { cn } from '@/lib/utils';
import {
  COUNT_SOFT_MAX,
  METRIC_MAX,
  TONE_TEXT,
  countTone,
  metricTone,
  type Tone,
} from '@/lib/score';

const TONE_FILL: Record<Tone, string> = {
  positive: 'bg-positive',
  caution: 'bg-caution',
  alert: 'bg-alert',
  neutral: 'bg-muted-foreground/40',
};

/**
 * Einzelmerkmal der Hautanalyse.
 *
 * `kind` unterscheidet Skalen: Merkmale wie Rötung laufen 0–10,
 * Läsionen und Mitesser sind Anzahlen. Beide Male gilt: weniger ist besser.
 */
export function MetricBar({
  label,
  value,
  kind = 'scale',
}: {
  label: string;
  value: number | null;
  kind?: 'scale' | 'count';
}) {
  const max = kind === 'count' ? COUNT_SOFT_MAX : METRIC_MAX;
  const tone = kind === 'count' ? countTone(value) : metricTone(value);
  const ratio = value == null ? 0 : Math.min(1, value / max);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
        <span className={cn('tabular text-[0.875rem] font-semibold', TONE_TEXT[tone])}>
          {value ?? '–'}
          {value != null && kind === 'scale' && (
            <span className="ml-0.5 text-[0.6875rem] font-normal text-muted-foreground">
              /{METRIC_MAX}
            </span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', TONE_FILL[tone])}
          style={{
            width: `${ratio * 100}%`,
            transitionTimingFunction: 'var(--ease-out-soft)',
          }}
        />
      </div>
    </div>
  );
}
