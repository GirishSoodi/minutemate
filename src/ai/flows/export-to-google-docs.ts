'use server';
/**
 * @fileOverview Exports a meeting summary to a new Google Doc.
 *
 * - exportToGoogleDocs - A function that handles creating a Google Doc.
 * - ExportToGoogleDocsInput - The input type for the export function.
 * - ExportToGoogleDocsOutput - The return type for the export function.
 */

import { ai } from '@/ai/genkit';
import { createGoogleDoc } from '@/services/google-docs-service';
import { z } from 'genkit';

const ExportToGoogleDocsInputSchema = z.object({
  title: z.string().describe('The title of the meeting.'),
  content: z.string().describe('The summary content of the meeting.'),
});
export type ExportToGoogleDocsInput = z.infer<typeof ExportToGoogleDocsInputSchema>;

const ExportToGoogleDocsOutputSchema = z.object({
  url: z.string().describe('The URL of the newly created Google Doc.'),
});
export type ExportToGoogleDocsOutput = z.infer<typeof ExportToGoogleDocsOutputSchema>;

export async function exportToGoogleDocs(
  input: ExportToGoogleDocsInput
): Promise<ExportToGoogleDocsOutput> {
  return exportToGoogleDocsFlow(input);
}

const exportToGoogleDocsFlow = ai.defineFlow(
  {
    name: 'exportToGoogleDocsFlow',
    inputSchema: ExportToGoogleDocsInputSchema,
    outputSchema: ExportToGoogleDocsOutputSchema,
  },
  async (input) => {
    // This flow directly calls the tool to create the document.
    const googleDoc = await createGoogleDoc(input);
    return {
      url: googleDoc.url,
    };
  }
);
