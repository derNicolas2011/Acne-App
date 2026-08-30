import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  meals,
  medicationLogs,
  medications,
  skinAnalyses,
  skinPhotos,
  skincareLogs,
  skincareProducts,
} from '@/lib/db/schema';
import { APP_TIMEZONE, toTimeString } from '@/lib/date';
import { isCompleted } from '@/lib/routine';

export type TimelineEventType = 'medication' | 'skincare' | 'meal' | 'skin_photo';

export interface TimelineEntry {
  id: string;
  type: TimelineEventType;
  time: string;
  title: string;
  description?: string;
  status?: string;
  href?: string;
  /** Millisekunden seit Epoche — serialisierbar über die RSC-Grenze. */
  sortKey: number;
}

/**
 * Ungefähre Uhrzeit eines Tageszeit-Slots. Logs speichern nur
 * morning/noon/evening/night, für die Timeline brauchen wir eine Position.
 */
const SLOT_HOURS: Record<string, number> = { morning: 8, noon: 12, evening: 20, night: 22 };

export async function getTimelineEntries(userId: string, date: string): Promise<TimelineEntry[]> {
  const tz = sql.raw(`'${APP_TIMEZONE}'`);

  const [medLogs, careLogs, dayMeals, photos] = await Promise.all([
    db
      .select({
        id: medicationLogs.id,
        name: medications.name,
        dosage: medications.dosage,
        unit: medications.unit,
        timeOfDay: medicationLogs.timeOfDay,
        status: medicationLogs.status,
      })
      .from(medicationLogs)
      .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
      .where(and(eq(medicationLogs.userId, userId), eq(medicationLogs.date, date))),

    db
      .select({
        id: skincareLogs.id,
        name: skincareProducts.name,
        timeOfDay: skincareLogs.timeOfDay,
        status: skincareLogs.status,
      })
      .from(skincareLogs)
      .innerJoin(skincareProducts, eq(skincareLogs.productId, skincareProducts.id))
      .where(and(eq(skincareLogs.userId, userId), eq(skincareLogs.date, date))),

    db
      .select({
        id: meals.id,
        type: meals.type,
        description: meals.description,
        timestamp: meals.timestamp,
      })
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          sql`DATE(${meals.timestamp} AT TIME ZONE ${tz}) = ${date}::date`
        )
      ),

    db
      .select({
        id: skinPhotos.id,
        takenAt: skinPhotos.takenAt,
        score: skinAnalyses.score,
        analysisId: skinAnalyses.id,
      })
      .from(skinPhotos)
      .leftJoin(skinAnalyses, eq(skinPhotos.id, skinAnalyses.skinPhotoId))
      .where(
        and(
          eq(skinPhotos.userId, userId),
          sql`DATE(${skinPhotos.takenAt} AT TIME ZONE ${tz}) = ${date}::date`
        )
      ),
  ]);

  const slotTime = (timeOfDay: string): { label: string; sortKey: number } => {
    const hour = SLOT_HOURS[timeOfDay];
    if (hour === undefined) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(timeOfDay);
      if (match) {
        return {
          label: timeOfDay.padStart(5, '0'),
          sortKey: Number(match[1]) * 60 + Number(match[2]),
        };
      }
      return { label: '–', sortKey: 24 * 60 };
    }
    return { label: `${String(hour).padStart(2, '0')}:00`, sortKey: hour * 60 };
  };

  const minutesOfDay = (d: Date): number => {
    const [h, m] = toTimeString(d).split(':');
    return Number(h) * 60 + Number(m);
  };

  const entries: TimelineEntry[] = [];

  const statusLabel = (status: string) => {
    if (isCompleted(status)) return 'erledigt';
    if (status === 'skipped') return 'übersprungen';
    if (status === 'missed') return 'ausgelassen';
    return status;
  };

  for (const log of medLogs) {
    const { label, sortKey } = slotTime(log.timeOfDay);
    const dose = [log.dosage, log.unit].filter(Boolean).join(' ');
    entries.push({
      id: `med-${log.id}`,
      type: 'medication',
      time: label,
      title: log.name,
      description: [dose, statusLabel(log.status)].filter(Boolean).join(' · '),
      status: log.status,
      sortKey,
    });
  }

  for (const log of careLogs) {
    const { label, sortKey } = slotTime(log.timeOfDay);
    entries.push({
      id: `care-${log.id}`,
      type: 'skincare',
      time: label,
      title: log.name,
      description: statusLabel(log.status),
      status: log.status,
      sortKey,
    });
  }

  for (const meal of dayMeals) {
    entries.push({
      id: `meal-${meal.id}`,
      type: 'meal',
      time: toTimeString(meal.timestamp),
      title: meal.type,
      description: meal.description || undefined,
      href: '/nutrition',
      sortKey: minutesOfDay(meal.timestamp),
    });
  }

  for (const photo of photos) {
    entries.push({
      id: `photo-${photo.id}`,
      type: 'skin_photo',
      time: toTimeString(photo.takenAt),
      title: 'Hautfoto',
      description:
        photo.score != null ? `Skin Score ${photo.score}` : 'Noch nicht analysiert',
      href: photo.analysisId ? `/skin/${photo.analysisId}` : undefined,
      sortKey: minutesOfDay(photo.takenAt),
    });
  }

  return entries.sort((a, b) => a.sortKey - b.sortKey);
}
