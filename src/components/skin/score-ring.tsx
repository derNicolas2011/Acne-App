import { cn } from '@/lib/utils';
import { SCORE_MAX, TONE_STROKE, TONE_TEXT, scoreTone } from '@/lib/score';

const SIZES = {
  sm: { box: 56, stroke: 5, value: 'text-[1.0625rem]', unit: 'text-[0.5625rem]' },
  md: { box: 96, stroke: 7, value: 'text-[1.875rem]', unit: 'text-[0.6875rem]' },
  lg: { box: 148, stroke: 9, value: 'text-[3rem]', unit: 'text-[0.8125rem]' },
} as const;

/**
 * Skin Score als Ring. Der gefüllte Anteil entspricht dem Score,
 * die Farbe der Einordnung — eine Information, zwei Kodierungen.
 */
export function ScoreRing({
  score,
  size = 'md',
  label,
  className,
}: {
  score: number | null;
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
}) {
  const { box, stroke, value, unit } = SIZES[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = score == null ? 0 : Math.min(Math.max(score, 0), SCORE_MAX) / SCORE_MAX;
  const tone = scoreTone(score);

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: box, height: box }}>
        <svg
          width={box}
          height={box}
          viewBox={`0 0 ${box} ${box}`}
          className="-rotate-90"
          role="img"
          aria-label={
            score == null ? 'Kein Skin Score vorhanden' : `Skin Score ${score} von ${SCORE_MAX}`
          }
        >
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          {score != null && (
            <circle
              cx={box / 2}
              cy={box / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
              className={cn(TONE_STROKE[tone], 'transition-[stroke-dashoffset] duration-700')}
              style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('tabular font-semibold leading-none', value, TONE_TEXT[tone])}>
            {score ?? '–'}
          </span>
          {score != null && (
            <span className={cn('mt-1 font-medium leading-none text-muted-foreground', unit)}>
              / {SCORE_MAX}
            </span>
          )}
        </div>
      </div>

      {label && <span className="text-[0.8125rem] text-muted-foreground">{label}</span>}
    </div>
  );
}
