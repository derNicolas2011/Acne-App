import Link from 'next/link';
import { Camera, ListChecks, Plus } from 'lucide-react';

/**
 * Die zwei Aktionen, die täglich zählen — bewusst gross und in der
 * Daumenzone. Das Hautfoto ist die wichtigste und deshalb hervorgehoben.
 */
export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/skin/upload"
        className="col-span-2 flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 py-4 text-[0.9375rem] font-semibold text-primary-foreground shadow-raised press"
      >
        <Camera className="size-5" strokeWidth={2} aria-hidden />
        Hautfoto aufnehmen
      </Link>

      <Link
        href="/nutrition/add"
        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 text-[0.875rem] font-semibold shadow-card press"
      >
        <Plus className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
        Essen
      </Link>

      <Link
        href="/treatment"
        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 text-[0.875rem] font-semibold shadow-card press"
      >
        <ListChecks className="size-[1.125rem]" strokeWidth={2.2} aria-hidden />
        Routine
      </Link>
    </div>
  );
}
