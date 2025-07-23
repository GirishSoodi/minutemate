'use server';
/**
 * @fileOverview Exports a meeting summary to a new Notion page.
 *
 * - exportToNotion - A function that handles creating a Notion page.
 * - ExportToNotionInput - The input type for the export function.
 * - ExportToNotionOutput - The return type for the export function.
 */

import { ai } from '@/ai/genkit';
import { createNotionPage } from '@/services/notion-service';
import { z } from 'genkit';
import { config } from 'dotenv';

const ExportToNotionInputSchema = z.object({
  title: z.string().describe('The title of the meeting.'),
  content: z.string().describe('The summary content of the meeting.'),
});
export type ExportToNotionInput = z.infer<typeof ExportToNotionInputSchema>;

const ExportToNotionOutputSchema = z.object({
  url: z.string().describe('The URL of the newly created Notion page.'),
});
export type ExportToNotionOutput = z.infer<typeof ExportToNotionOutputSchema>;

export async function exportToNotion(
  input: ExportToNotionInput
): Promise<ExportToNotionOutput> {
  return exportToNotionFlow(input);
}

const exportToNotionFlow = ai.defineFlow(
  {
    name: 'exportToNotionFlow',
    inputSchema: ExportToNotionInputSchema,
    outputSchema: ExportToNotionOutputSchema,
  },
  async (input) => {
    // Force a reload of environment variables to bypass caching issues.
    config({ override: true });

    // This flow now directly calls the tool to create the Notion page.
    const notionPage = await createNotionPage(input);
    return {
      url: notionPage.url,
    };
  }
);
