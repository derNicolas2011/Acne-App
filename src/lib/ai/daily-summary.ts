import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { DAILY_SUMMARY_SYSTEM_PROMPT } from './prompts';

export interface DailySummaryInput {
  date: string;
  skinAnalysis?: { score: number; summary: string; comparedToPrevious: string } | null;
  averageScore14Days?: number | null;
  medicationCompliance: { total: number; completed: number };
  skincareCompliance: { total: number; completed: number };
  meals: { type: string; description: string | null }[];
  previousDaySummary?: string | null;
}

export async function generateDailySummary(data: DailySummaryInput) {
  const prompt = `
Bitte erstelle die tägliche Zusammenfassung für den Nutzer.
Hier sind die Daten für den Tag (${data.date}):

Hautzustand:
${data.skinAnalysis ? 
  `- Score: ${data.skinAnalysis.score}/100\n- KI-Zusammenfassung: ${data.skinAnalysis.summary}\n- Vergleich zu gestern: ${data.skinAnalysis.comparedToPrevious}` : 
  '- Keine Hautanalyse verfügbar'}
${data.averageScore14Days ? `- 14-Tage-Durchschnitt Score: ${data.averageScore14Days}/100` : ''}

Routine-Einhaltung:
- Medikamente: ${data.medicationCompliance.completed} von ${data.medicationCompliance.total} eingenommen
- Hautpflege: ${data.skincareCompliance.completed} von ${data.skincareCompliance.total} durchgeführt

Mahlzeiten:
${data.meals.length > 0 ? 
  data.meals.map(m => `- ${m.type}: ${m.description || 'Keine Beschreibung'}`).join('\n') : 
  '- Keine Mahlzeiten eingetragen'}

Vorherige Tageszusammenfassung (als Kontext):
${data.previousDaySummary || '- Keine vorhanden'}
  `.trim();

  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: DAILY_SUMMARY_SYSTEM_PROMPT,
    prompt,
  });

  return text;
}
