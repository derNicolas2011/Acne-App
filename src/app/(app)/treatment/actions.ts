'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  medicationLogs,
  medications,
  skincareLogs,
  skincareProducts,
} from '@/lib/db/schema';
import { requireUserId } from '@/lib/session';
import { isValidDateString } from '@/lib/date';

const TIME_OF_DAY = ['morning', 'noon', 'evening', 'night'] as const;
const STATUS = ['done', 'missed', 'skipped'] as const;

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich').max(120),
  timesOfDay: z.array(z.enum(TIME_OF_DAY)).min(1, 'Mindestens ein Zeitpunkt'),
  frequency: z.string().max(60).optional(),
  startDate: z.string().refine(isValidDateString, 'Ungültiges Startdatum'),
  endDate: z
    .string()
    .refine((v) => v === '' || isValidDateString(v), 'Ungültiges Enddatum')
    .optional(),
});

const medicationSchema = itemSchema.extend({
  dosage: z.string().max(40).optional(),
  unit: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
});

const skincareSchema = itemSchema.extend({
  amount: z.string().max(60).optional(),
  instructions: z.string().max(1000).optional(),
});

/** Leere Strings aus Formularen in `null` überführen. */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export async function addMedication(input: unknown) {
  const userId = await requireUserId();
  const data = medicationSchema.parse(input);

  await db.insert(medications).values({
    userId,
    name: data.name,
    dosage: orNull(data.dosage),
    unit: orNull(data.unit),
    notes: orNull(data.notes),
    timesOfDay: data.timesOfDay,
    frequency: orNull(data.frequency) ?? 'Täglich',
    startDate: data.startDate,
    endDate: orNull(data.endDate),
    isActive: true,
  });

  revalidatePath('/treatment');
  revalidatePath('/');
}

export async function addSkincareProduct(input: unknown) {
  const userId = await requireUserId();
  const data = skincareSchema.parse(input);

  await db.insert(skincareProducts).values({
    userId,
    name: data.name,
    amount: orNull(data.amount),
    instructions: orNull(data.instructions),
    timesOfDay: data.timesOfDay,
    frequency: orNull(data.frequency) ?? 'Täglich',
    startDate: data.startDate,
    endDate: orNull(data.endDate),
    isActive: true,
  });

  revalidatePath('/treatment');
  revalidatePath('/');
}

const logSchema = z.object({
  id: z.string().min(1).max(64),
  date: z.string().refine(isValidDateString),
  timeOfDay: z.enum(TIME_OF_DAY),
  status: z.enum(STATUS),
});

export async function logMedicationStatus(input: unknown) {
  const userId = await requireUserId();
  const { id, date, timeOfDay, status } = logSchema.parse(input);

  // Nur eigene Medikamente dürfen protokolliert werden.
  const [owned] = await db
    .select({ id: medications.id })
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)))
    .limit(1);
  if (!owned) throw new Error('Medikament nicht gefunden');

  await db
    .insert(medicationLogs)
    .values({ medicationId: id, userId, date, timeOfDay, status })
    .onConflictDoUpdate({
      target: [medicationLogs.medicationId, medicationLogs.date, medicationLogs.timeOfDay],
      set: { status },
    });

  revalidatePath('/treatment');
  revalidatePath('/');
}

export async function logSkincareStatus(input: unknown) {
  const userId = await requireUserId();
  const { id, date, timeOfDay, status } = logSchema.parse(input);

  const [owned] = await db
    .select({ id: skincareProducts.id })
    .from(skincareProducts)
    .where(and(eq(skincareProducts.id, id), eq(skincareProducts.userId, userId)))
    .limit(1);
  if (!owned) throw new Error('Produkt nicht gefunden');

  await db
    .insert(skincareLogs)
    .values({ productId: id, userId, date, timeOfDay, status })
    .onConflictDoUpdate({
      target: [skincareLogs.productId, skincareLogs.date, skincareLogs.timeOfDay],
      set: { status },
    });

  revalidatePath('/treatment');
  revalidatePath('/');
}

/** Entfernt einen Eintrag aus der Routine, ohne die Historie zu löschen. */
export async function setMedicationActive(id: string, isActive: boolean) {
  const userId = await requireUserId();
  await db
    .update(medications)
    .set({ isActive })
    .where(and(eq(medications.id, id), eq(medications.userId, userId)));
  revalidatePath('/treatment');
  revalidatePath('/');
}

export async function setSkincareActive(id: string, isActive: boolean) {
  const userId = await requireUserId();
  await db
    .update(skincareProducts)
    .set({ isActive })
    .where(and(eq(skincareProducts.id, id), eq(skincareProducts.userId, userId)));
  revalidatePath('/treatment');
  revalidatePath('/');
}

/** Löscht einen Eintrag samt seiner Logs. */
export async function deleteMedication(id: string) {
  const userId = await requireUserId();
  await db
    .delete(medicationLogs)
    .where(and(eq(medicationLogs.medicationId, id), eq(medicationLogs.userId, userId)));
  await db
    .delete(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)));
  revalidatePath('/treatment');
  revalidatePath('/');
}

export async function deleteSkincareProduct(id: string) {
  const userId = await requireUserId();
  await db
    .delete(skincareLogs)
    .where(and(eq(skincareLogs.productId, id), eq(skincareLogs.userId, userId)));
  await db
    .delete(skincareProducts)
    .where(and(eq(skincareProducts.id, id), eq(skincareProducts.userId, userId)));
  revalidatePath('/treatment');
  revalidatePath('/');
}
