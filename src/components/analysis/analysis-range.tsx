'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Segmented } from '@/components/shared/segmented';

const LABELS: Record<number, string> = {
  30: '30 Tage',
  90: '90 Tage',
  180: '6 Monate',
};

/** Zeitraumwahl der Analyse — als URL-Parameter, damit sie teilbar bleibt. */
export function AnalysisRange({
  ranges,
  active,
}: {
  ranges: readonly number[];
  active: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Segmented
      label="Zeitraum der Auswertung"
      value={active}
      onChange={(value) => router.push(`${pathname}?range=${value}`)}
      options={ranges.map((range) => ({
        value: range,
        label: LABELS[range] ?? `${range} Tage`,
      }))}
    />
  );
}
