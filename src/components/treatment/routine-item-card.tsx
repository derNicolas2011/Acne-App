'use client';

import { useState, useTransition } from 'react';
import { Droplet, Loader2, MoreHorizontal, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { Surface } from '@/components/shared/surface';
import { TIMES_OF_DAY } from '@/lib/date';
import {
  deleteMedication,
  deleteSkincareProduct,
  setMedicationActive,
  setSkincareActive,
} from '@/app/(app)/treatment/actions';
import { cn } from '@/lib/utils';

export interface RoutineItemView {
  id: string;
  kind: 'medication' | 'skincare';
  name: string;
  detail: string | null;
  instructions: string | null;
  frequency: string | null;
  timesOfDay: string[];
  isActive: boolean;
  startDate: string;
  endDate: string | null;
}

function slotLabel(id: string): string {
  return TIMES_OF_DAY.find((t) => t.id === id)?.label ?? id;
}

/** Konfigurierter Eintrag der Routine — Medikament oder Skincare-Produkt. */
export function RoutineItemCard({ item }: { item: RoutineItemView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const Icon = item.kind === 'medication' ? Pill : Droplet;

  const run = (fn: () => Promise<void>, success: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
        setMenuOpen(false);
        setConfirming(false);
      } catch {
        toast.error('Aktion fehlgeschlagen');
      }
    });

  const toggleActive = () =>
    run(
      () =>
        item.kind === 'medication'
          ? setMedicationActive(item.id, !item.isActive)
          : setSkincareActive(item.id, !item.isActive),
      item.isActive ? 'Pausiert' : 'Wieder aktiv'
    );

  const remove = () =>
    run(
      () =>
        item.kind === 'medication'
          ? deleteMedication(item.id)
          : deleteSkincareProduct(item.id),
      'Gelöscht'
    );

  return (
    <Surface padded={false} className={cn('p-4', !item.isActive && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
            item.kind === 'medication' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          )}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-[0.9375rem] font-medium">{item.name}</h3>
            {!item.isActive && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                Pausiert
              </span>
            )}
          </div>

          {item.detail && (
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{item.detail}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.timesOfDay.map((slot) => (
              <span
                key={slot}
                className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
              >
                {slotLabel(slot)}
              </span>
            ))}
            {item.frequency && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                {item.frequency}
              </span>
            )}
          </div>

          {item.instructions && (
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {item.instructions}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Optionen für ${item.name}`}
          aria-expanded={menuOpen}
          className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground press hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="size-4.5" aria-hidden />
        </button>
      </div>

      {menuOpen && !confirming && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={toggleActive}
            disabled={isPending}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[0.8125rem] font-medium press disabled:opacity-60"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            {item.isActive ? 'Pausieren' : 'Fortsetzen'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-9 flex-1 rounded-lg border border-border px-3 text-[0.8125rem] font-medium text-destructive press"
          >
            Löschen
          </button>
        </div>
      )}

      {confirming && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-[0.8125rem] text-muted-foreground">
            {item.name} und alle zugehörigen Einträge löschen? Zum Aufbewahren der
            Historie besser pausieren.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 text-[0.8125rem] font-semibold text-destructive-foreground press disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Endgültig löschen
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-9 flex-1 rounded-lg border border-border px-3 text-[0.8125rem] font-medium press"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </Surface>
  );
}
