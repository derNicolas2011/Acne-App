import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { TodaySkin } from '@/components/dashboard/today-skin';
import { TodayRoutine } from '@/components/dashboard/today-routine';
import { TodayNutrition } from '@/components/dashboard/today-nutrition';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { getDashboardData } from '@/lib/queries/dashboard';
import { getAnalysisForDate } from '@/lib/queries/skin';
import { getSkinPhotoUrl } from '@/lib/supabase/storage';
import { greeting, today } from '@/lib/date';
import { requireUser } from '@/lib/session';

export default async function HomePage() {
  const user = await requireUser();
  const date = today();

  const [data, todayAnalysis] = await Promise.all([
    getDashboardData(user.id, date),
    getAnalysisForDate(user.id, date),
  ]);

  let photoUrl: string | null = null;
  if (todayAnalysis?.frontImagePath) {
    try {
      photoUrl = await getSkinPhotoUrl(todayAnalysis.frontImagePath);
    } catch (error) {
      console.error('Vorschaubild konnte nicht geladen werden:', error);
    }
  }

  const dateLabel = new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-2 md:px-6 md:pt-10">
      <header className="mb-6">
        <p className="text-[0.8125rem] text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.02em]">
          {greeting()}, {user.name}
        </h1>
      </header>

      <div className="space-y-3">
        <TodaySkin
          score={data.score.today}
          yesterdayScore={data.score.yesterday}
          average14={data.score.average14}
          photoUrl={photoUrl}
          analysisId={todayAnalysis?.analysisId ?? null}
        />
        <TodayRoutine medications={data.routine.medications} skincare={data.routine.skincare} />
        <TodayNutrition count={data.nutrition.count} types={data.nutrition.types} />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <Link
        href="/timeline"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-[0.8125rem] font-medium text-muted-foreground press hover:text-foreground"
      >
        <CalendarDays className="size-4" strokeWidth={1.8} aria-hidden />
        Tagesverlauf ansehen
      </Link>
    </div>
  );
}
