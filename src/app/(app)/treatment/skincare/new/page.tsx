'use client';

import { PageBody, PageHeader } from '@/components/shared/page-header';
import { RoutineItemForm } from '@/components/treatment/routine-item-form';
import { addSkincareProduct } from '@/app/(app)/treatment/actions';

const FREQUENCIES = ['Täglich', 'Jeden 2. Tag', '2x wöchentlich', 'Bei Bedarf'] as const;

export default function NewSkincarePage() {
  return (
    <>
      <PageHeader title="Neues Produkt" backHref="/treatment" />
      <PageBody>
        <RoutineItemForm
          namePlaceholder="z. B. Benzoylperoxid 5%"
          submitLabel="Produkt speichern"
          frequencies={FREQUENCIES}
          defaultTimesOfDay={['morning', 'evening']}
          redirectTo="/treatment"
          fields={[
            { name: 'amount', label: 'Menge (optional)', placeholder: 'z. B. erbsengross' },
            {
              name: 'instructions',
              label: 'Anwendung (optional)',
              placeholder: 'z. B. dünn auf die betroffenen Stellen auftragen',
              multiline: true,
            },
          ]}
          onSubmit={(values) =>
            addSkincareProduct({
              name: values.name,
              amount: values.amount,
              instructions: values.instructions,
              timesOfDay: values.timesOfDay,
              frequency: values.frequency,
              startDate: values.startDate,
              endDate: values.endDate,
            })
          }
        />
      </PageBody>
    </>
  );
}
