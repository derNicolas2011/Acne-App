'use client';

import { PageBody, PageHeader } from '@/components/shared/page-header';
import { RoutineItemForm } from '@/components/treatment/routine-item-form';
import { addMedication } from '@/app/(app)/treatment/actions';

const FREQUENCIES = ['Täglich', 'Jeden 2. Tag', 'Wöchentlich', 'Bei Bedarf'] as const;

export default function NewMedicationPage() {
  return (
    <>
      <PageHeader title="Neues Medikament" backHref="/treatment" />
      <PageBody>
        <RoutineItemForm
          namePlaceholder="z. B. Isotretinoin"
          submitLabel="Medikament speichern"
          frequencies={FREQUENCIES}
          defaultTimesOfDay={['morning']}
          redirectTo="/treatment"
          fields={[
            { name: 'dosage', label: 'Dosierung', placeholder: 'z. B. 20', half: true },
            { name: 'unit', label: 'Einheit', placeholder: 'z. B. mg', half: true },
            {
              name: 'notes',
              label: 'Hinweise (optional)',
              placeholder: 'z. B. mit dem Essen einnehmen',
              multiline: true,
            },
          ]}
          onSubmit={(values) =>
            addMedication({
              name: values.name,
              dosage: values.dosage,
              unit: values.unit,
              notes: values.notes,
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
