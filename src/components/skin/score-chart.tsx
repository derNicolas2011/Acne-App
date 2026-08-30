'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface ChartPoint {
  date: string;
  score: number | null;
  redness?: number | null;
  inflammation?: number | null;
  visibleLesions?: number | null;
}

export type MetricKey = 'redness' | 'inflammation' | 'visibleLesions';

export const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; max: number }> = {
  redness: { label: 'Rötung', color: 'var(--chart-4)', max: 10 },
  inflammation: { label: 'Entzündung', color: 'var(--chart-5)', max: 10 },
  visibleLesions: { label: 'Läsionen', color: 'var(--chart-3)', max: 25 },
};

function formatAxisDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (days > 120) return new Intl.DateTimeFormat('de-CH', { month: 'short' }).format(d);
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(d);
}

function formatFullDate(date: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00Z`));
}

/**
 * Skin Score über Zeit. Zusatzmetriken laufen auf einer eigenen,
 * normalisierten Achse mit — sonst wäre der 0–10-Bereich unsichtbar.
 */
export function ScoreChart({
  data,
  days,
  activeMetrics = [],
  className,
}: {
  data: ChartPoint[];
  days: number;
  activeMetrics?: MetricKey[];
  className?: string;
}) {
  const chartData = useMemo(
    () =>
      data
        .filter((d) => d.score != null)
        .map((d) => {
          const point: Record<string, string | number | null> = {
            date: d.date,
            axisLabel: formatAxisDate(d.date, days),
            score: d.score,
          };
          // Auf 0–100 skalieren, damit alles eine gemeinsame Achse teilt.
          for (const key of Object.keys(METRIC_CONFIG) as MetricKey[]) {
            const raw = d[key];
            point[key] =
              raw == null ? null : Math.min(100, (raw / METRIC_CONFIG[key].max) * 100);
            point[`${key}Raw`] = raw ?? null;
          }
          return point;
        }),
    [data, days]
  );

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex h-[220px] items-center justify-center rounded-xl bg-muted/40 px-6 text-center text-[0.8125rem] text-muted-foreground',
          className
        )}
      >
        Für diesen Zeitraum liegen noch keine Analysen vor.
      </div>
    );
  }

  if (chartData.length === 1) {
    return (
      <div
        className={cn(
          'flex h-[220px] flex-col items-center justify-center gap-1 rounded-xl bg-muted/40 px-6 text-center',
          className
        )}
      >
        <p className="tabular text-[2rem] font-semibold">{chartData[0].score}</p>
        <p className="text-[0.8125rem] text-muted-foreground">
          Ein Datenpunkt — ab zwei Analysen entsteht ein Verlauf.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('h-[220px] w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {/* left: -6 statt -22 — bei -22 wurde die dreistellige 100er-Beschriftung
            der Y-Achse am linken Rand abgeschnitten. */}
        <AreaChart data={chartData} margin={{ top: 8, right: 6, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="0"
            opacity={0.7}
          />
          <XAxis
            dataKey="axisLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            width={34}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Record<string, string | number | null>;
              return (
                <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-raised">
                  <p className="text-[0.6875rem] text-muted-foreground">
                    {formatFullDate(String(row.date))}
                  </p>
                  <p className="tabular mt-1 text-[0.875rem] font-semibold">
                    Score {row.score}
                  </p>
                  {activeMetrics.map((key) => (
                    <p key={key} className="tabular mt-0.5 text-[0.75rem] text-muted-foreground">
                      {METRIC_CONFIG[key].label}: {row[`${key}Raw`] ?? '–'}
                    </p>
                  ))}
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--chart-1)"
            strokeWidth={2.25}
            fill="url(#scoreFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--chart-1)' }}
            connectNulls
            isAnimationActive={false}
          />

          {activeMetrics.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={METRIC_CONFIG[key].color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
