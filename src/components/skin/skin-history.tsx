'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { SectionHeading } from '@/components/shared/page-header';
import { Segmented, FilterChip } from '@/components/shared/segmented';
import { TrendBadge } from '@/components/shared/trend-badge';
import {
  METRIC_CONFIG,
  ScoreChart,
  type ChartPoint,
  type MetricKey,
} from '@/components/skin/score-chart';
import { TONE_BG, scoreTone } from '@/lib/score';
import { cn } from '@/lib/utils';

export interface HistoryEntry extends ChartPoint {
  analysisId: string;
  frontPhotoUrl: string | null;
}

const RANGES = [
  { value: 7, label: '7 T' },
  { value: 30, label: '30 T' },
  { value: 90, label: '90 T' },
  { value: 180, label: '6 M' },
] as const;

const METRIC_KEYS = Object.keys(METRIC_CONFIG) as MetricKey[];

/**
 * Hautverlauf: Zeitraumwahl, Chart mit optionalen Zusatzmetriken und
 * die Liste der Einträge darunter.
 */
export function SkinHistory({
  entries,
  earliestDate,
}: {
  entries: HistoryEntry[];
  /** Frühestes Datum, für das Daten geladen wurden. */
  earliestDate: string;
}) {
  const [days, setDays] = useState<number>(30);
  const [metrics, setMetrics] = useState<MetricKey[]>([]);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return d.toISOString().slice(0, 10);
  }, [days]);

  const visible = useMemo(
    () => entries.filter((e) => e.date >= cutoff),
    [entries, cutoff]
  );

  // Chart chronologisch, Liste absteigend (neueste zuerst).
  const listed = useMemo(() => [...visible].reverse(), [visible]);

  const toggleMetric = (key: MetricKey) =>
    setMetrics((current) =>
      current.includes(key) ? current.filter((m) => m !== key) : [...current, key]
    );

  return (
    <div className="space-y-5">
      <Surface className="space-y-4">
        <Segmented
          label="Zeitraum"
          options={RANGES}
          value={days}
          onChange={setDays}
        />

        <ScoreChart data={visible} days={days} activeMetrics={metrics} />

        <div className="flex flex-wrap gap-1.5">
          {METRIC_KEYS.map((key) => (
            <FilterChip
              key={key}
              active={metrics.includes(key)}
              onClick={() => toggleMetric(key)}
              color={METRIC_CONFIG[key].color}
            >
              {METRIC_CONFIG[key].label}
            </FilterChip>
          ))}
        </div>
      </Surface>

      <div className="space-y-3">
        <SectionHeading title={`Einträge (${listed.length})`} />

        {listed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-[0.8125rem] text-muted-foreground">
            In diesem Zeitraum liegen keine Analysen vor.
            {earliestDate && ' Wähle einen längeren Zeitraum, um ältere Einträge zu sehen.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {listed.map((entry, index) => {
              // Die Liste ist absteigend — der nächste Eintrag ist der ältere.
              const older = listed[index + 1];
              const delta =
                entry.score != null && older?.score != null ? entry.score - older.score : null;

              return (
                <li key={entry.analysisId}>
                  <Link href={`/skin/${entry.analysisId}`} className="block press">
                    <Surface padded={false} className="flex items-center gap-3.5 p-3">
                      {entry.frontPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.frontPhotoUrl}
                          alt=""
                          className="size-14 shrink-0 rounded-xl border border-border object-cover"
                        />
                      ) : (
                        <div className="size-14 shrink-0 rounded-xl bg-muted" aria-hidden />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[0.875rem] font-medium">
                          {new Intl.DateTimeFormat('de-CH', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          }).format(new Date(`${entry.date}T12:00:00Z`))}
                        </p>
                        {delta !== null && (
                          <div className="mt-1.5">
                            <TrendBadge delta={delta} />
                          </div>
                        )}
                      </div>

                      <span
                        className={cn(
                          'tabular rounded-lg px-2.5 py-1 text-[0.9375rem] font-semibold',
                          TONE_BG[scoreTone(entry.score)]
                        )}
                      >
                        {entry.score ?? '–'}
                      </span>

                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Surface>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
