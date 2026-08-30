import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { Surface } from '@/components/shared/surface';
import { EmptyState, InsufficientDataNote } from '@/components/shared/states';
import { TrendBadge } from '@/components/shared/trend-badge';
import { MedicalDisclaimer } from '@/components/shared/ai-insight';
import { ObservationCard } from '@/components/analysis/observation-card';
import { AnalysisRange } from '@/components/analysis/analysis-range';
import { getSkinSeries } from '@/lib/queries/skin';
import { getDailyComplianceSeries } from '@/lib/queries/treatment';
import { getMealsWithAnalysisInRange } from '@/lib/queries/nutrition';
import {
  analysedMealCount,
  coverage,
  foodObservations,
  routineObservation,
  trendSummary,
} from '@/lib/insights';
import { addDaysToDateString, today } from '@/lib/date';
import { requireUser } from '@/lib/session';

export const metadata = { title: 'Analyse' };

const RANGES = [30, 90, 180] as const;
const DEFAULT_RANGE = 90;

function resolveRange(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return (RANGES as readonly number[]).includes(parsed) ? parsed : DEFAULT_RANGE;
}

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const days = resolveRange(params.range);

  const endDate = today();
  const startDate = addDaysToDateString(endDate, -(days - 1));

  const [skinEntries, complianceSeries, mealsData] = await Promise.all([
    getSkinSeries(user.id, startDate, endDate),
    getDailyComplianceSeries(user.id, startDate, endDate),
    getMealsWithAnalysisInRange(user.id, startDate, endDate),
  ]);

  const trend = trendSummary(skinEntries, startDate, endDate);
  const routine = routineObservation(skinEntries, complianceSeries);
  const food = foodObservations(
    skinEntries,
    mealsData.map((meal) => ({ date: meal.date, properties: meal.properties }))
  );

  const analysedMeals = analysedMealCount(
    mealsData.map((meal) => ({ date: meal.date, properties: meal.properties }))
  );
  const dayCoverage = coverage(skinEntries, days);

  return (
    <>
      <PageHeader
        title="Analyse"
        subtitle="Muster in deinen eigenen Daten"
        size="large"
      />

      <PageBody>
        <AnalysisRange ranges={RANGES} active={days} />

        {skinEntries.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="size-5" strokeWidth={1.8} />}
            title="Noch keine Auswertung möglich"
            description="Sobald du regelmässig Hautfotos, Mahlzeiten und deine Routine erfasst, entstehen hier Vergleiche über die Zeit."
            action={
              <Link
                href="/skin/upload"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.875rem] font-semibold text-primary-foreground press"
              >
                Erstes Foto aufnehmen
              </Link>
            }
          />
        ) : (
          <>
            {/* Trend */}
            <Surface className="space-y-3">
              <SectionHeading title="Hautentwicklung" />
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[0.75rem] text-muted-foreground">
                    Ø zweite Hälfte des Zeitraums
                  </p>
                  <p className="tabular mt-1 text-[2rem] font-semibold leading-none">
                    {trend.currentAverage ?? '–'}
                  </p>
                </div>
                {trend.delta !== null && (
                  <TrendBadge delta={trend.delta} suffix="ggü. erster Hälfte" />
                )}
              </div>
              <p className="tabular text-[0.75rem] text-muted-foreground">
                {trend.dataPoints} Analysen · {Math.round(dayCoverage * 100)} % der Tage erfasst
              </p>
              {dayCoverage < 0.3 && (
                <InsufficientDataNote>
                  Bei weniger als einem Drittel erfasster Tage sind Vergleiche über
                  längere Zeiträume nur eingeschränkt aussagekräftig.
                </InsufficientDataNote>
              )}
            </Surface>

            {/* Routine ↔ Haut */}
            <section className="space-y-3">
              <SectionHeading title="Routine und Haut" />
              {routine ? (
                <ObservationCard observation={routine} />
              ) : (
                <InsufficientDataNote>
                  Für diesen Vergleich braucht es Tage mit vollständig erledigter
                  Routine und Hautfotos am Folgetag. Beides ist im gewählten
                  Zeitraum noch zu selten zusammengekommen.
                </InsufficientDataNote>
              )}
            </section>

            {/* Ernährung ↔ Haut */}
            <section className="space-y-3">
              <SectionHeading title="Ernährung und Haut" />
              {food.length > 0 ? (
                <div className="space-y-2.5">
                  {food.map((observation) => (
                    <ObservationCard key={observation.id} observation={observation} />
                  ))}
                </div>
              ) : (
                <InsufficientDataNote>
                  {analysedMeals === 0
                    ? 'Für Ernährungsvergleiche werden die Bestandteile erfasster Mahlzeiten ausgewertet. Im gewählten Zeitraum liegen dazu noch keine Daten vor.'
                    : `Bisher sind ${analysedMeals} Mahlzeiten ausgewertet — für belastbare Vergleiche sind es noch zu wenige.`}
                </InsufficientDataNote>
              )}
            </section>

            <Surface className="space-y-2.5">
              <h2 className="text-[0.9375rem] font-semibold">Wie diese Auswertung entsteht</h2>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                Verglichen wird jeweils der durchschnittliche Skin Score an Tagen
                mit einem Merkmal gegen die übrigen Tage. Für Ernährungsmerkmale
                wird eine Verzögerung von zwei Tagen angesetzt, für die Routine
                von einem Tag.
              </p>
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                Solche Vergleiche zeigen Zusammenhänge, keine Ursachen. Viele
                weitere Faktoren wirken auf das Hautbild ein und werden hier
                nicht erfasst.
              </p>
              <MedicalDisclaimer />
            </Surface>
          </>
        )}
      </PageBody>
    </>
  );
}
