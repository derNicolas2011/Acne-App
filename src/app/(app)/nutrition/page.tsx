import Link from 'next/link';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { DayNav } from '@/components/shared/day-nav';
import { MealCard } from '@/components/nutrition/meal-card';
import { MealAdvisor } from '@/components/nutrition/meal-advisor';
import { getMealsByDate } from '@/lib/queries/nutrition';
import { getMealPhotoUrls } from '@/lib/supabase/storage';
import { resolveDateParam, today, toTimeString } from '@/lib/date';
import { requireUser } from '@/lib/session';

/* KI-Aufrufe aus diesem Segment brauchen mehr als die Standard-Laufzeit. */
export const maxDuration = 60;

export const metadata = { title: 'Ernährung' };

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const date = resolveDateParam(params.date);
  const currentDate = today();

  const dayMeals = await getMealsByDate(user.id, date);

  // Alle Fotos in einem Storage-Aufruf signieren.
  const photoUrls = await getMealPhotoUrls(
    dayMeals.map((m) => m.imageUrl).filter((p): p is string => Boolean(p))
  );

  return (
    <>
      <PageHeader
        title="Ernährung"
        subtitle="Was du erfasst hast"
        size="large"
      />

      <PageBody className="pb-28 md:pb-8">
        <DayNav date={date} today={currentDate} />

        <div className="space-y-3">
          <SectionHeading
            title={
              dayMeals.length === 0
                ? 'Mahlzeiten'
                : `Mahlzeiten (${dayMeals.length})`
            }
          />

          {dayMeals.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed className="size-5" strokeWidth={1.8} />}
              title={date === currentDate ? 'Noch nichts erfasst' : 'Keine Einträge an diesem Tag'}
              description="Je vollständiger die Einträge, desto belastbarer wird die spätere Auswertung."
              action={
                <Link
                  href="/nutrition/add"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.875rem] font-semibold text-primary-foreground press"
                >
                  <Plus className="size-4" strokeWidth={2.4} aria-hidden />
                  Essen erfassen
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {dayMeals.map((meal) => (
                <li key={meal.id}>
                  <MealCard
                    meal={{
                      id: meal.id,
                      type: meal.type,
                      description: meal.description,
                      time: toTimeString(meal.timestamp),
                      photoUrl: meal.imageUrl ? (photoUrls.get(meal.imageUrl) ?? null) : null,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <MealAdvisor />
      </PageBody>

      {/* Schwebende Hauptaktion in der Daumenzone. */}
      <Link
        href="/nutrition/add"
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[0.9375rem] font-semibold text-primary-foreground shadow-float press md:right-8 md:bottom-8"
      >
        <Plus className="size-5" strokeWidth={2.4} aria-hidden />
        Essen
      </Link>
    </>
  );
}
