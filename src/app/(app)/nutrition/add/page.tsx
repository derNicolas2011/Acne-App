import { PageBody, PageHeader } from '@/components/shared/page-header';
import { AddMealForm } from '@/components/nutrition/add-meal-form';
import { currentHour } from '@/lib/date';
import { suggestedMealType } from '@/lib/meal-types';
import { getSettings } from '@/lib/settings';
import { requireUser } from '@/lib/session';

/* KI-Aufrufe aus diesem Segment brauchen mehr als die Standard-Laufzeit. */
export const maxDuration = 60;

export const metadata = { title: 'Essen erfassen' };

export default async function AddMealPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <>
      <PageHeader title="Essen erfassen" backHref="/nutrition" />
      <PageBody>
        {/* Uhrzeit bestimmt die Vorauswahl — spart auf dem Handy einen Tap. */}
        <AddMealForm
          initialType={suggestedMealType(currentHour())}
          presets={settings.mealPresets}
        />
      </PageBody>
    </>
  );
}
