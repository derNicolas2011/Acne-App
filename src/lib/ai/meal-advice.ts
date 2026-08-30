import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { MEAL_ADVICE_SYSTEM_PROMPT } from './prompts';

/**
 * Entscheidungshilfe *vor* dem Essen.
 *
 * Das Modell vergleicht Optionen, statt ein Lebensmittel zu bewerten.
 * Die drei Ebenen (allgemein / eigene Daten / Unsicherheit) sind im Schema
 * getrennt, damit die Oberfläche sie nicht vermischen kann.
 */
export const mealAdviceSchema = z.object({
  situation: z
    .string()
    .describe('Ein Satz, der die geschilderte Situation neutral zusammenfasst.'),
  options: z
    .array(
      z.object({
        title: z.string().describe('Kurzer Name der Option, z. B. "Grillburger mit Salat"'),
        note: z
          .string()
          .describe('Ein bis zwei Sätze, warum diese Option so eingeordnet wird. Beschreibend, nicht wertend.'),
        profile: z
          .enum(['konservativ', 'ausgewogen', 'reichhaltig'])
          .describe(
            'konservativ = wenig Zucker/Verarbeitung, reichhaltig = viel Zucker/Fett/Verarbeitung'
          ),
      })
    )
    .min(2)
    .max(4)
    .describe('Vergleichbare Optionen in der geschilderten Situation.'),
  generalNote: z
    .string()
    .describe(
      'Allgemein gut belegte Ernährungsinformation zur Situation. Keine Aussage über Akne-Ursachen.'
    ),
  uncertainty: z
    .string()
    .describe(
      'Was sich aus den Daten NICHT ableiten lässt. Immer ausfüllen, immer auf Deutsch.'
    ),
});

export type MealAdvice = z.infer<typeof mealAdviceSchema>;

export interface MealAdviceContext {
  /** Aktueller Skin Score, falls für heute vorhanden. */
  currentScore: number | null;
  /** Durchschnitt der letzten 14 Tage. */
  averageScore: number | null;
  /** Anzahl bisher erfasster Hautanalysen — Mass für die Datenbasis. */
  analysisCount: number;
  /** Typische Mahlzeiten der letzten Tage, stark gekürzt. */
  recentMeals: string[];
}

export async function getMealAdvice(question: string, context: MealAdviceContext) {
  const dataBasis =
    context.analysisCount >= 14
      ? `Es liegen ${context.analysisCount} Hautanalysen vor.`
      : `Es liegen erst ${context.analysisCount} Hautanalysen vor — die Datenbasis ist für persönliche Muster noch zu klein.`;

  const prompt = `
Situation des Nutzers:
${question}

Kontext (nur als Hintergrund, nicht als Beweis für Zusammenhänge):
- Skin Score heute: ${context.currentScore ?? 'nicht erfasst'}
- Durchschnitt der letzten 14 Tage: ${context.averageScore ?? 'nicht verfügbar'}
- ${dataBasis}
- Zuletzt erfasste Mahlzeiten: ${
    context.recentMeals.length > 0 ? context.recentMeals.slice(0, 12).join('; ') : 'keine'
  }

Vergleiche realistische Optionen in dieser Situation.
  `.trim();

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: mealAdviceSchema,
    system: MEAL_ADVICE_SYSTEM_PROMPT,
    prompt,
  });

  return object;
}
