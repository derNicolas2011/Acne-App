import Link from 'next/link';
import { Camera, ChevronRight } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { TrendBadge } from '@/components/shared/trend-badge';
import { ScoreRing } from '@/components/skin/score-ring';
import { InsightBlock } from '@/components/shared/ai-insight';
import { scoreLabel } from '@/lib/score';

export interface TodayHeroData {
  analysisId: string;
  frontPhotoUrl: string | null;
  score: number | null;
  summary: string | null;
  yesterdayScore: number | null;
  average14: number | null;
}

/**
 * "Heute" auf der Hautseite: grosses Foto, Score, Veränderung und die
 * kurze KI-Beobachtung. Der Einstieg in den Bereich zeigt damit zuerst
 * den aktuellen Zustand, erst danach den Verlauf.
 */
export function TodaySkinHero({ data }: { data: TodayHeroData }) {
  const delta =
    data.score != null && data.yesterdayScore != null ? data.score - data.yesterdayScore : null;

  return (
    <Surface className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold">Heute</h2>
        <Link
          href={`/skin/${data.analysisId}`}
          className="inline-flex items-center gap-0.5 text-[0.8125rem] font-medium text-muted-foreground press hover:text-foreground"
        >
          Details
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {data.frontPhotoUrl ? (
          <Link href={`/skin/${data.analysisId}`} className="block press sm:w-40 sm:shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.frontPhotoUrl}
              alt="Hautfoto von heute"
              className="max-h-[42dvh] w-full rounded-xl border border-border object-cover sm:max-h-none"
            />
          </Link>
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-muted text-muted-foreground sm:w-40">
            <Camera className="size-6" strokeWidth={1.6} aria-hidden />
          </div>
        )}

        <div className="flex flex-1 items-center gap-4 sm:flex-col sm:items-start">
          <ScoreRing score={data.score} size="md" />
          <div>
            <p className="text-[0.9375rem] font-semibold">{scoreLabel(data.score)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {delta !== null ? (
                <TrendBadge delta={delta} suffix="ggü. gestern" />
              ) : (
                <span className="text-[0.75rem] text-muted-foreground">
                  Kein Wert von gestern
                </span>
              )}
            </div>
            {data.average14 != null && (
              <p className="tabular mt-2 text-[0.75rem] text-muted-foreground">
                Ø 14 Tage: {data.average14}
              </p>
            )}
          </div>
        </div>
      </div>

      {data.summary && (
        <div className="border-t border-border pt-4">
          <InsightBlock label="Beobachtung">{data.summary}</InsightBlock>
        </div>
      )}
    </Surface>
  );
}
