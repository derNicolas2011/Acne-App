import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { Surface } from '@/components/shared/surface';
import { DailyChecklist, type ChecklistTask } from '@/components/treatment/daily-checklist';
import {
  RoutineItemCard,
  type RoutineItemView,
} from '@/components/treatment/routine-item-card';
import { DayNav } from '@/components/shared/day-nav';
import {
  getCompliance,
  getMedicationLogs,
  getMedications,
  getSkincareLogs,
  getSkincareProducts,
} from '@/lib/queries/treatment';
import { isScheduledOn, timesOfDay, type RoutineItem } from '@/lib/routine';
import {
  currentTimeOfDay,
  resolveDateParam,
  today,
  TIMES_OF_DAY,
  type TimeOfDay,
} from '@/lib/date';
import { requireUser } from '@/lib/session';

export const metadata = { title: 'Routine' };

const COMPLIANCE_WINDOW = 30;

export default async function TreatmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const date = resolveDateParam(params.date);
  const currentDate = today();

  const [meds, care, medLogs, careLogs, compliance] = await Promise.all([
    getMedications(user.id),
    getSkincareProducts(user.id),
    getMedicationLogs(user.id, date),
    getSkincareLogs(user.id, date),
    getCompliance(user.id, currentDate, COMPLIANCE_WINDOW),
  ]);

  // Aus Einträgen und Häufigkeit die konkreten Aufgaben des Tages bilden.
  const tasks: ChecklistTask[] = [];

  for (const med of meds) {
    if (!isScheduledOn(med as RoutineItem, date)) continue;
    for (const slot of timesOfDay(med)) {
      const log = medLogs.find((l) => l.medicationId === med.id && l.timeOfDay === slot);
      tasks.push({
        id: med.id,
        kind: 'medication',
        name: med.name,
        detail: [med.dosage, med.unit].filter(Boolean).join(' ') || null,
        timeOfDay: slot,
        status: normalizeStatus(log?.status),
      });
    }
  }

  for (const product of care) {
    if (!isScheduledOn(product as RoutineItem, date)) continue;
    for (const slot of timesOfDay(product)) {
      const log = careLogs.find((l) => l.productId === product.id && l.timeOfDay === slot);
      tasks.push({
        id: product.id,
        kind: 'skincare',
        name: product.name,
        detail: product.amount,
        timeOfDay: slot,
        status: normalizeStatus(log?.status),
      });
    }
  }

  const medViews: RoutineItemView[] = meds.map((med) => ({
    id: med.id,
    kind: 'medication',
    name: med.name,
    detail: [med.dosage, med.unit].filter(Boolean).join(' ') || null,
    instructions: med.notes,
    frequency: med.frequency,
    timesOfDay: timesOfDay(med),
    isActive: med.isActive ?? true,
    startDate: med.startDate,
    endDate: med.endDate,
  }));

  const careViews: RoutineItemView[] = care.map((product) => ({
    id: product.id,
    kind: 'skincare',
    name: product.name,
    detail: product.amount,
    instructions: product.instructions,
    frequency: product.frequency,
    timesOfDay: timesOfDay(product),
    isActive: product.isActive ?? true,
    startDate: product.startDate,
    endDate: product.endDate,
  }));

  // Vorgewählter Zeitpunkt: die aktuelle Tageszeit, aber nur wenn dafür
  // überhaupt etwas geplant ist. Sonst stand die Checkliste z. B. mittags
  // auf einem leeren Slot, obwohl morgens und abends Aufgaben offen waren.
  const slotsWithTasks = TIMES_OF_DAY.filter((t) =>
    tasks.some((task) => task.timeOfDay === t.id)
  );
  const preferredSlot = ((): TimeOfDay => {
    if (slotsWithTasks.length === 0) return 'morning';
    if (date !== currentDate) return slotsWithTasks[0].id;

    const now = currentTimeOfDay();
    if (slotsWithTasks.some((t) => t.id === now)) return now;

    // Nächster geplanter Zeitpunkt im Tagesverlauf, sonst der letzte.
    const order = TIMES_OF_DAY.map((t) => t.id);
    const nowIndex = order.indexOf(now);
    const upcoming = slotsWithTasks.find((t) => order.indexOf(t.id) > nowIndex);
    return (upcoming ?? slotsWithTasks[slotsWithTasks.length - 1]).id;
  })();

  return (
    <>
      <PageHeader title="Routine" subtitle="Medikamente & Skincare" size="large" />

      <PageBody>
        {(meds.length > 0 || care.length > 0) && (
          <Surface className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.75rem] font-medium text-muted-foreground">
                Vollständige Tage
              </p>
              <p className="tabular mt-1 text-[1.375rem] font-semibold">
                {compliance.fullDays}
                <span className="text-[0.9375rem] font-normal text-muted-foreground">
                  {' '}
                  / {compliance.scheduledDays || COMPLIANCE_WINDOW}
                </span>
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                letzte {COMPLIANCE_WINDOW} Tage
              </p>
            </div>

            <div className="text-right">
              <p className="tabular text-[1.375rem] font-semibold">
                {Math.round(compliance.slotRate * 100)}%
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                aller Anwendungen
              </p>
              {compliance.streak > 1 && (
                <p className="tabular mt-1.5 text-[0.75rem] font-medium text-positive">
                  {compliance.streak} Tage in Folge
                </p>
              )}
            </div>
          </Surface>
        )}

        <DayNav date={date} today={currentDate} />

        <section className="space-y-3">
          <SectionHeading title="Checkliste" />
          {tasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-[0.8125rem] text-muted-foreground">
              {meds.length === 0 && care.length === 0
                ? 'Lege unten Medikamente oder Skincare an, um sie täglich abzuhaken.'
                : 'An diesem Tag ist nach deiner Konfiguration nichts eingeplant.'}
            </p>
          ) : (
            <DailyChecklist tasks={tasks} date={date} initialTimeOfDay={preferredSlot} />
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Medikamente"
            action={
              <Link
                href="/treatment/medications/new"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.8125rem] font-medium press"
              >
                <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
                Neu
              </Link>
            }
          />
          {medViews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-center text-[0.8125rem] text-muted-foreground">
              Keine Medikamente angelegt.
            </p>
          ) : (
            <div className="space-y-2.5">
              {medViews.map((item) => (
                <RoutineItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Skincare"
            action={
              <Link
                href="/treatment/skincare/new"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.8125rem] font-medium press"
              >
                <Plus className="size-3.5" strokeWidth={2.4} aria-hidden />
                Neu
              </Link>
            }
          />
          {careViews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-center text-[0.8125rem] text-muted-foreground">
              Keine Produkte angelegt.
            </p>
          ) : (
            <div className="space-y-2.5">
              {careViews.map((item) => (
                <RoutineItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <p className="px-1 text-[0.75rem] leading-relaxed text-muted-foreground">
          Die App verwaltet nur, was du hier einträgst. Änderungen an Dosierung oder
          Therapie besprichst du mit deiner Fachperson.
        </p>
      </PageBody>
    </>
  );
}

function normalizeStatus(status: string | undefined): ChecklistTask['status'] {
  if (status === 'done' || status === 'taken') return 'done';
  if (status === 'skipped') return 'skipped';
  if (status === 'missed') return 'missed';
  return 'open';
}
