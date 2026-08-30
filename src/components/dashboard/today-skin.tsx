import Link from 'next/link';
import { Camera } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { TrendBadge } from '@/components/shared/trend-badge';
import { ScoreRing } from '@/components/skin/score-ring';
import { scoreLabel } from '@/lib/score';

interface TodaySkinProps {
  score: number | null;
  yesterdayScore: number | null;
  average14: number | null;
  photoUrl: string | null;
  analysisId: string | null;
}

/**
 * Die wichtigste Karte des Home-Screens: Hautzustand heute.
 * Ohne Foto wird sie zur Aufforderung, eines zu machen.
 */
export function TodaySkin({
  score,
  yesterdayScore,
  average14,
  photoUrl,
  analysisId,
}: TodaySkinProps) {
  if (score == null) {
    return (
      <Surface className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Camera className="size-5" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-medium">Noch kein Hautfoto heute</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
            Ein Foto genügt für den heutigen Score.
          </p>
        </div>
        <Link
          href="/skin/upload"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-[0.8125rem] font-semibold text-primary-foreground press"
        >
          Foto
        </Link>
      </Surface>
    );
  }

  const delta = yesterdayScore != null ? score - yesterdayScore : null;
  const content = (
    <Surface className="space-y-3">
      {/* Zwei Zeilen statt einer: bei 375px blieben sonst nur ~135px für den
          Text zwischen Ring und Vorschaubild, wodurch das Trend-Badge in
          das Foto lief. */}
      <div className="flex items-center gap-4">
        <ScoreRing score={score} size="md" />

        <div className="min-w-0 flex-1">
          <p className="text-[0.75rem] font-medium text-muted-foreground">Haut heute</p>
          <p className="mt-1 truncate text-[1.0625rem] font-semibold">{scoreLabel(score)}</p>
          {average14 != null && (
            <p className="tabular mt-1 text-[0.75rem] text-muted-foreground">
              Ø 14 Tage: {average14}
            </p>
          )}
        </div>

        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Hautfoto von heute"
            className="size-16 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {delta !== null ? (
          <TrendBadge delta={delta} suffix="ggü. gestern" />
        ) : (
          <span className="text-[0.75rem] text-muted-foreground">
            Kein Vergleichswert von gestern
          </span>
        )}
      </div>
    </Surface>
  );

  return analysisId ? (
    <Link href={`/skin/${analysisId}`} className="block press">
      {content}
    </Link>
  ) : (
    content
  );
}
