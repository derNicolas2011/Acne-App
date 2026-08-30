import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from './prompts';

export const foodAnalysisSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    category: z.string().optional(),
  })).describe('Einzelne Bestandteile der Mahlzeit'),
  estimatedProperties: z.object({
    sugar: z.enum(['low', 'medium', 'high']),
    dairy: z.boolean(),
    fat: z.enum(['low', 'medium', 'high']),
    processed: z.enum(['minimal', 'moderate', 'highly']),
    carbs: z.enum(['low', 'medium', 'high']),
    protein: z.enum(['low', 'medium', 'high']),
  }),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().describe('Kurze Anmerkung auf Deutsch, falls relevant'),
});

export async function analyzeMealText(description: string) {
  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: foodAnalysisSchema,
    system: FOOD_ANALYSIS_SYSTEM_PROMPT,
    prompt: `Bitte analysiere die folgende Mahlzeit basierend auf dieser Beschreibung:\n${description}`,
  });

  return object;
}

export async function analyzeMealImage({ 
  imageBase64, 
  description 
}: { 
  imageBase64: string; 
  description?: string 
}) {
  let promptText = 'Bitte analysiere dieses Foto einer Mahlzeit.';
  if (description) {
    promptText += `\nZusätzliche Beschreibung des Nutzers: ${description}`;
  }

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: foodAnalysisSchema,
    system: FOOD_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image', image: imageBase64 }
        ],
      },
    ],
  });

  return object;
}
