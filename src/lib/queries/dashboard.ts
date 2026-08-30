import { addDaysToDateString } from '@/lib/date';
import { getAverageScore, getScoreForDate, hasPhotoOnDate } from '@/lib/queries/skin';
import { getMealCountByDate } from '@/lib/queries/nutrition';
import { getRoutineStatus } from '@/lib/queries/treatment';

export interface DashboardData {
  score: {
    today: number | null;
    yesterday: number | null;
    average14: number | null;
    hasPhotoToday: boolean;
  };
  routine: {
    medications: { total: number; completed: number };
    skincare: { total: number; completed: number };
  };
  nutrition: { count: number; types: string[] };
}

/** Alle Kennzahlen des Home-Screens in einem Rutsch. */
export async function getDashboardData(userId: string, date: string): Promise<DashboardData> {
  const yesterday = addDaysToDateString(date, -1);
  const fourteenDaysAgo = addDaysToDateString(date, -13);

  const [today, prev, average14, hasPhotoToday, routine, nutrition] = await Promise.all([
    getScoreForDate(userId, date),
    getScoreForDate(userId, yesterday),
    getAverageScore(userId, fourteenDaysAgo, date),
    hasPhotoOnDate(userId, date),
    getRoutineStatus(userId, date),
    getMealCountByDate(userId, date),
  ]);

  return {
    score: { today, yesterday: prev, average14, hasPhotoToday },
    routine,
    nutrition,
  };
}
