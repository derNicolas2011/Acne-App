import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { SKIN_ANALYSIS_SYSTEM_PROMPT } from './prompts';

export const skinAnalysisSchema = z.object({
  score: z.number().min(0).max(100).describe('Gesamtbewertung des Hautzustands, 100 = beste Haut, 0 = schlechteste'),
  inflammation: z.number().min(0).max(10).describe('Grad der Entzündungen, 0 = keine'),
  redness: z.number().min(0).max(10).describe('Grad der Rötungen, 0 = keine'),
  visibleLesions: z.number().min(0).describe('Anzahl sichtbarer Unreinheiten/Läsionen'),
  comedones: z.number().min(0).describe('Anzahl sichtbarer Mitesser'),
  dryness: z.number().min(0).max(10).describe('Grad der Trockenheit, 0 = keine'),
  oiliness: z.number().min(0).max(10).describe('Grad der Fettigkeit, 0 = keine'),
  acneScars: z.number().min(0).max(10).describe('Sichtbarkeit von Akne-Malen, 0 = keine'),
  summary: z.string().describe('Kurze Zusammenfassung auf Deutsch, max 3 Sätze. Beobachtungen, keine Diagnosen.'),
  comparedToPrevious: z.enum(['improved', 'worsened', 'stable', 'unknown']).describe('Vergleich zum Vorbild, falls vorhanden'),
  confidence: z.number().min(0).max(1).describe('Konfidenz der Analyse'),
});

export async function analyzeSkinPhoto({
  imageBase64,
  previousScore,
  previousSummary,
}: {
  imageBase64: string;
  previousScore?: number;
  previousSummary?: string;
}) {
  let prompt = 'Bitte analysiere dieses Bild der Gesichtshaut.';
  
  if (previousScore !== undefined || previousSummary !== undefined) {
    prompt += '\n\nKontext zur vorherigen Analyse:';
    if (previousScore !== undefined) prompt += `\nVorheriger Score: ${previousScore}`;
    if (previousSummary !== undefined) prompt += `\nVorherige Zusammenfassung: ${previousSummary}`;
  }

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: skinAnalysisSchema,
    system: SKIN_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: imageBase64 }
        ],
      },
    ],
  });

  return object;
}
