'use client';

import { useCallback, useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { Segmented } from '@/components/shared/segmented';
import { TrendBadge } from '@/components/shared/trend-badge';
import { TONE_BG, scoreTone } from '@/lib/score';
import { cn } from '@/lib/utils';

export interface ComparePhoto {
  analysisId: string;
  date: string;
  score: number | null;
  frontPhotoUrl: string | null;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Kurzform für die engen Auswahlfelder — sonst kollidiert sie mit dem Pfeil. */
function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  }).format(new Date(`${date}T12:00:00Z`));
}

function daysAgo(date: string): number {
  const ms = Date.now() - Date.parse(`${date}T12:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

const VIEW_OPTIONS = [
  { value: 'slider' as const, label: 'Slider' },
  { value: 'side' as const, label: 'Nebeneinander' },
];

/**
 * Vorher/Nachher-Vergleich zweier Zeitpunkte.
 * Der Slider legt beide Bilder deckungsgleich übereinander — dadurch
 * fallen Veränderungen deutlich stärker auf als bei zwei Bildern nebeneinander.
 */
export function PhotoCompare({ entries }: { entries: ComparePhoto[] }) {
  // entries kommen absteigend (neueste zuerst).
  const [beforeId, setBeforeId] = useState(
    entries[Math.min(entries.length - 1, findIndexAround(entries, 30))]?.analysisId ?? ''
  );
  const [afterId, setAfterId] = useState(entries[0]?.analysisId ?? '');
  const [view, setView] = useState<'slider' | 'side'>('slider');
  const [position, setPosition] = useState(50);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const before = entries.find((e) => e.analysisId === beforeId) ?? entries[entries.length - 1];
  const after = entries.find((e) => e.analysisId === afterId) ?? entries[0];

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  const delta =
    after?.score != null && before?.score != null ? after.score - before.score : null;

  if (!before || !after) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <PhotoSelect
          label="Vorher"
          value={beforeId}
          onChange={setBeforeId}
          entries={entries}
        />
        <PhotoSelect label="Nachher" value={afterId} onChange={setAfterId} entries={entries} />
      </div>

      <Segmented label="Darstellung" options={VIEW_OPTIONS} value={view} onChange={setView} />

      {view === 'slider' ? (
        <div
          ref={containerRef}
          className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-muted"
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) updateFromPointer(e.clientX);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
        >
          {after.frontPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={after.frontPhotoUrl}
              alt={`Hautfoto vom ${formatDate(after.date)}`}
              className="absolute inset-0 size-full object-cover"
              draggable={false}
            />
          )}

          {before.frontPhotoUrl && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={before.frontPhotoUrl}
                alt={`Hautfoto vom ${formatDate(before.date)}`}
                className="absolute inset-0 size-full object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Trennlinie mit Griff */}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
            style={{ left: `${position}%` }}
          >
            <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-float">
              <MoveHorizontal className="size-4" strokeWidth={2.2} aria-hidden />
            </span>
          </div>

          <PhotoTag className="left-3" date={before.date} score={before.score} caption="Vorher" />
          <PhotoTag
            className="right-3"
            date={after.date}
            score={after.score}
            caption="Nachher"
          />

          {/* Tastaturzugängliche Alternative zum Ziehen. */}
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(position)}
            onChange={(e) => setPosition(Number(e.target.value))}
            aria-label="Vergleichsposition"
            className="absolute inset-x-0 bottom-0 h-10 w-full cursor-ew-resize opacity-0"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <SidePhoto caption="Vorher" entry={before} />
          <SidePhoto caption="Nachher" entry={after} />
        </div>
      )}

      <Surface className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.75rem] text-muted-foreground">
            {formatDate(before.date)} → {formatDate(after.date)}
          </p>
          <p className="tabular mt-1.5 flex items-baseline gap-2 text-[1.25rem] font-semibold">
            <span className={cn('rounded-md px-2 py-0.5', TONE_BG[scoreTone(before.score)])}>
              {before.score ?? '–'}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className={cn('rounded-md px-2 py-0.5', TONE_BG[scoreTone(after.score)])}>
              {after.score ?? '–'}
            </span>
          </p>
        </div>

        <div className="text-right">
          {delta !== null && <TrendBadge delta={delta} />}
          <p className="mt-1.5 text-[0.75rem] text-muted-foreground">
            {Math.abs(daysAgo(before.date) - daysAgo(after.date))} Tage dazwischen
          </p>
        </div>
      </Surface>

      <p className="px-1 text-[0.75rem] leading-relaxed text-muted-foreground">
        Unterschiede in Licht, Abstand und Kamerawinkel beeinflussen den Eindruck.
        Der Vergleich ist am aussagekräftigsten bei ähnlichen Aufnahmebedingungen.
      </p>
    </div>
  );
}

function PhotoTag({
  caption,
  date,
  score,
  className,
}: {
  caption: string;
  date: string;
  score: number | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-3 rounded-lg bg-black/55 px-2.5 py-1.5 text-white backdrop-blur-sm',
        className
      )}
    >
      <p className="text-[0.625rem] font-medium uppercase tracking-wide opacity-80">{caption}</p>
      <p className="tabular text-[0.8125rem] font-semibold">
        {new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(
          new Date(`${date}T12:00:00Z`)
        )}
        {score != null && <span className="ml-1.5 opacity-90">· {score}</span>}
      </p>
    </div>
  );
}

function SidePhoto({ caption, entry }: { caption: string; entry: ComparePhoto }) {
  return (
    <figure>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted">
        {entry.frontPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.frontPhotoUrl}
            alt={`Hautfoto vom ${formatDate(entry.date)}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[0.75rem] text-muted-foreground">
            Bild nicht verfügbar
          </div>
        )}
      </div>
      <figcaption className="mt-2 px-0.5">
        <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          {caption}
        </span>
        <span className="tabular block text-[0.8125rem] font-medium">
          {formatDate(entry.date)}
          {entry.score != null && ` · ${entry.score}`}
        </span>
      </figcaption>
    </figure>
  );
}

function PhotoSelect({
  label,
  value,
  onChange,
  entries,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  entries: ComparePhoto[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.75rem] font-medium text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full truncate rounded-xl border border-input bg-card py-2 pr-9 pl-3 text-[0.875rem] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {entries.map((entry) => (
          <option key={entry.analysisId} value={entry.analysisId}>
            {formatDateShort(entry.date)}
            {entry.score != null ? ` · ${entry.score}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Index des Eintrags, der einem Abstand von `days` Tagen am nächsten kommt. */
function findIndexAround(entries: ComparePhoto[], days: number): number {
  let bestIndex = entries.length - 1;
  let bestDistance = Number.POSITIVE_INFINITY;
  entries.forEach((entry, index) => {
    const distance = Math.abs(daysAgo(entry.date) - days);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

