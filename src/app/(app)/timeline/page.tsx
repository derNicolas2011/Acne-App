import { CalendarDays } from 'lucide-react';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { Surface } from '@/components/shared/surface';
import { EmptyState } from '@/components/shared/states';
import { DayNav } from '@/components/shared/day-nav';
import { TimelineView } from '@/components/timeline/timeline-view';
import { GenerateReportButton } from '@/components/analysis/generate-report-button';
import { InsightBlock, InsightGroup, MedicalDisclaimer } from '@/components/shared/ai-insight';
import { getTimelineEntries } from '@/lib/queries/timeline';
import { getDailySummary } from '@/lib/queries/analysis';
import { resolveDateParam, today } from '@/lib/date';
import { requireUser } from '@/lib/session';

/* KI-Aufrufe aus diesem Segment brauchen mehr als die Standard-Laufzeit. */
export const maxDuration = 60;

export const metadata = { title: 'Tagesverlauf' };

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const date = resolveDateParam(params.date);

  const [entries, summary] = await Promise.all([
    getTimelineEntries(user.id, date),
    getDailySummary(user.id, date),
  ]);

  return (
    <>
      <PageHeader title="Tagesverlauf" subtitle="Dein Tag chronologisch" size="large" />

      <PageBody>
        <DayNav date={date} today={today()} />

        {entries.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" strokeWidth={1.8} />}
            title="Keine Einträge an diesem Tag"
            description="Mahlzeiten, abgehakte Routine und Hautfotos erscheinen hier automatisch in ihrer zeitlichen Reihenfolge."
          />
        ) : (
          <>
            <Surface padded={false} className="px-2 py-3">
              <TimelineView entries={entries} />
            </Surface>

            <section className="space-y-3">
              <SectionHeading title="Zusammenfassung" />

              {summary?.aiSummary ? (
                <Surface className="space-y-4">
                  <InsightGroup>
                    <InsightBlock label="Tagesbild">{summary.aiSummary}</InsightBlock>

                    {summary.skinScore != null && (
                      <InsightBlock label="Skin Score">
                        <span className="tabular font-medium">{summary.skinScore}</span> / 100
                      </InsightBlock>
                    )}

                    {summary.treatmentCompliance != null && (
                      <InsightBlock label="Routine">
                        <span className="tabular font-medium">
                          {Math.round(summary.treatmentCompliance * 100)} %
                        </span>{' '}
                        der geplanten Anwendungen erledigt
                      </InsightBlock>
                    )}
                  </InsightGroup>

                  <MedicalDisclaimer />
                  <GenerateReportButton date={date} label="Neu erstellen" />
                </Surface>
              ) : (
                <Surface className="space-y-3">
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    Die KI fasst die Einträge dieses Tages in wenigen Sätzen zusammen —
                    als Beobachtung, nicht als Bewertung.
                  </p>
                  <GenerateReportButton date={date} />
                </Surface>
              )}
            </section>
          </>
        )}
      </PageBody>
    </>
  );
}
