import { notFound } from 'next/navigation';
import { PageBody, PageHeader } from '@/components/shared/page-header';
import { Surface } from '@/components/shared/surface';
import { TrendBadge } from '@/components/shared/trend-badge';
import { ScoreRing } from '@/components/skin/score-ring';
import { MetricBar } from '@/components/skin/metric-bar';
import { DeleteEntryButton } from '@/components/skin/delete-entry-button';
import {
  ConfidenceTag,
  InsightBlock,
  InsightGroup,
  MedicalDisclaimer,
} from '@/components/shared/ai-insight';
import { getAnalysisById, getAverageScore, getPreviousAnalysis } from '@/lib/queries/skin';
import { addDaysToDateString, toDateString } from '@/lib/date';
import { comparisonLabel, scoreLabel } from '@/lib/score';
import { requireUser } from '@/lib/session';

export const metadata = { title: 'Analyse' };

export default async function AnalysisResultPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const user = await requireUser();
  const { analysisId } = await params;

  // Immer auf den angemeldeten Nutzer eingeschränkt — sonst wären fremde
  // Gesichtsfotos allein über die ID erreichbar.
  const analysis = await getAnalysisById(user.id, analysisId);
  if (!analysis) notFound();

  const date = toDateString(analysis.takenAt);
  const [previous, average14] = await Promise.all([
    getPreviousAnalysis(user.id, new Date(analysis.takenAt.getTime() - 1000)),
    getAverageScore(user.id, addDaysToDateString(date, -13), date),
  ]);

  const delta =
    analysis.score != null && previous?.score != null ? analysis.score - previous.score : null;
  const vsAverage =
    analysis.score != null && average14 != null ? analysis.score - average14 : null;

  const dateLabel = new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(analysis.takenAt);

  return (
    <>
      <PageHeader title="Hautanalyse" subtitle={dateLabel} backHref="/skin" />

      <PageBody>
        {/* Foto und Score */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {analysis.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={analysis.photoUrl}
              alt={`Hautfoto vom ${dateLabel}`}
              className="aspect-[3/4] w-full rounded-2xl border border-border object-cover sm:w-48"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-muted text-[0.8125rem] text-muted-foreground sm:w-48">
              Bild nicht verfügbar
            </div>
          )}

          <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
            <ScoreRing score={analysis.score} size="lg" />
            <div className="text-center sm:text-left">
              <p className="text-[1rem] font-semibold">{scoreLabel(analysis.score)}</p>
              {delta !== null && (
                <div className="mt-2">
                  <TrendBadge delta={delta} suffix="ggü. letztem Foto" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KI-Einschätzung als benannte Blöcke statt Fliesstext */}
        <Surface className="space-y-4">
          <InsightGroup>
            {analysis.summary && (
              <InsightBlock label="Beobachtung">{analysis.summary}</InsightBlock>
            )}

            <InsightBlock label="Vergleich">
              {delta !== null ? (
                <>
                  {comparisonLabel(analysis.comparedToPrevious) ??
                    (delta > 0
                      ? 'Verbessert gegenüber dem letzten Foto'
                      : delta < 0
                        ? 'Stärker gereizt als beim letzten Foto'
                        : 'Weitgehend unverändert')}
                  {' · '}
                  <span className="tabular font-medium">
                    {delta > 0 ? '+' : delta < 0 ? '−' : '±'}
                    {Math.abs(delta)} Punkte
                  </span>
                </>
              ) : (
                'Noch kein früheres Foto zum Vergleich vorhanden.'
              )}
            </InsightBlock>

            {vsAverage !== null && (
              <InsightBlock label="Einordnung">
                Dein Score liegt{' '}
                {vsAverage === 0
                  ? 'genau auf'
                  : `${Math.abs(vsAverage)} Punkte ${vsAverage > 0 ? 'über' : 'unter'}`}{' '}
                {vsAverage === 0 ? 'deinem' : 'deinem'} 14-Tage-Durchschnitt von{' '}
                <span className="tabular font-medium">{average14}</span>.
              </InsightBlock>
            )}
          </InsightGroup>

          <ConfidenceTag value={analysis.confidence} />
          <MedicalDisclaimer />
        </Surface>

        {/* Einzelmerkmale */}
        <Surface className="space-y-4">
          <h2 className="text-[0.9375rem] font-semibold">Erfasste Merkmale</h2>
          <p className="-mt-2 text-[0.75rem] text-muted-foreground">
            Niedrigere Werte bedeuten weniger sichtbare Auffälligkeiten.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricBar label="Entzündungen" value={analysis.inflammation} />
            <MetricBar label="Rötungen" value={analysis.redness} />
            <MetricBar label="Trockenheit" value={analysis.dryness} />
            <MetricBar label="Fettigkeit" value={analysis.oiliness} />
            <MetricBar label="Akne-Male" value={analysis.acneScars} />
            <MetricBar
              label="Sichtbare Läsionen"
              value={analysis.visibleLesions}
              kind="count"
            />
            <MetricBar label="Mitesser" value={analysis.comedones} kind="count" />
          </div>
        </Surface>

        <DeleteEntryButton analysisId={analysis.id} />
      </PageBody>
    </>
  );
}
