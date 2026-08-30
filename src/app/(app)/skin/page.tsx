import Link from 'next/link';
import { Camera, GitCompareArrows, ImageOff } from 'lucide-react';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { SkinHistory, type HistoryEntry } from '@/components/skin/skin-history';
import { TodaySkinHero } from '@/components/skin/today-hero';
import {
  getAnalysisForDate,
  getAverageScore,
  getScoreForDate,
  getSkinSeries,
  withSignedUrls,
} from '@/lib/queries/skin';
import { addDaysToDateString, today } from '@/lib/date';
import { requireUser } from '@/lib/session';

export const metadata = { title: 'Haut' };

/** Wie weit der Verlauf geladen wird — deckt den längsten Zeitraum (6 M) ab. */
const HISTORY_DAYS = 180;

export default async function SkinPage() {
  const user = await requireUser();
  const endDate = today();
  const startDate = addDaysToDateString(endDate, -(HISTORY_DAYS - 1));

  const [series, todayAnalysis, yesterdayScore, average14] = await Promise.all([
    getSkinSeries(user.id, startDate, endDate),
    getAnalysisForDate(user.id, endDate),
    getScoreForDate(user.id, addDaysToDateString(endDate, -1)),
    getAverageScore(user.id, addDaysToDateString(endDate, -13), endDate),
  ]);

  const withUrls = await withSignedUrls(series);

  // Das signierte Bild von heute stammt aus demselben Batch — kein Extra-Aufruf.
  const todayEntry = todayAnalysis
    ? withUrls.find((entry) => entry.analysisId === todayAnalysis.analysisId)
    : undefined;

  const entries: HistoryEntry[] = withUrls.map((entry) => ({
    analysisId: entry.analysisId,
    date: entry.date,
    score: entry.score,
    redness: entry.redness,
    inflammation: entry.inflammation,
    visibleLesions: entry.visibleLesions,
    frontPhotoUrl: entry.frontPhotoUrl,
  }));

  return (
    <>
      <PageHeader
        title="Haut"
        subtitle="Heute und Verlauf"
        size="large"
        action={
          entries.length >= 2 ? (
            <Link
              href="/skin/compare"
              aria-label="Fotos vergleichen"
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground press hover:bg-muted hover:text-foreground"
            >
              <GitCompareArrows className="size-5" strokeWidth={1.8} aria-hidden />
            </Link>
          ) : null
        }
      />

      <PageBody>
        {todayAnalysis && (
          <TodaySkinHero
            data={{
              analysisId: todayAnalysis.analysisId,
              frontPhotoUrl: todayEntry?.frontPhotoUrl ?? null,
              score: todayAnalysis.score,
              summary: todayAnalysis.summary,
              yesterdayScore,
              average14,
            }}
          />
        )}

        {/* Bei leerem Verlauf trägt der Empty State die Aufforderung selbst. */}
        {entries.length > 0 &&
          (todayAnalysis ? (
            <Link
              href="/skin/upload"
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 text-[0.875rem] font-semibold shadow-card press"
            >
              <Camera className="size-[1.125rem]" strokeWidth={2} aria-hidden />
              Weiteres Foto aufnehmen
            </Link>
          ) : (
            <Link
              href="/skin/upload"
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-5 py-4 text-[0.9375rem] font-semibold text-primary-foreground shadow-raised press"
            >
              <Camera className="size-5" strokeWidth={2} aria-hidden />
              Foto für heute aufnehmen
            </Link>
          ))}

        {entries.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="size-5" strokeWidth={1.8} />}
            title="Noch kein Hautfoto vorhanden"
            description="Mit dem ersten Foto beginnt dein Verlauf. Am aussagekräftigsten wird er, wenn du täglich etwa zur gleichen Zeit fotografierst."
            action={
              <Link
                href="/skin/upload"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.875rem] font-semibold text-primary-foreground press"
              >
                Erstes Foto hinzufügen
              </Link>
            }
          />
        ) : (
          <section className="space-y-3">
            <SectionHeading title="Verlauf" />
            <SkinHistory entries={entries} earliestDate={startDate} />
          </section>
        )}
      </PageBody>
    </>
  );
}
