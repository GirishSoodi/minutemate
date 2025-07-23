'use server';

/**
 * @fileOverview Summarizes a meeting transcript, extracting key discussion points and decisions.
 *
 * - summarizeMeeting - A function that summarizes the meeting transcript.
 * - SummarizeMeetingInput - The input type for the summarizeMeeting function.
 * - SummarizeMeetingOutput - The return type for the summarizeMeeting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMeetingInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the meeting to be summarized.'),
});
export type SummarizeMeetingInput = z.infer<typeof SummarizeMeetingInputSchema>;

const SummarizeMeetingOutputSchema = z.object({
  title: z.string().describe('A title for the meeting summary.'),
  summary: z
    .string()
    .describe('A concise summary of the meeting, including key discussion points and decisions, formatted as bullet points.'),
});
export type SummarizeMeetingOutput = z.infer<typeof SummarizeMeetingOutputSchema>;

export async function summarizeMeeting(input: SummarizeMeetingInput): Promise<SummarizeMeetingOutput> {
  return summarizeMeetingFlow(input);
}

const summarizeMeetingPrompt = ai.definePrompt({
  name: 'summarizeMeetingPrompt',
  input: {schema: SummarizeMeetingInputSchema},
  output: {schema: SummarizeMeetingOutputSchema},
  prompt: `You are an AI assistant that summarizes meetings.

  Given the following meeting transcript, generate a concise summary highlighting key discussion points and decisions.
  The summary should be formatted as bullet points.
  Also, provide a title for the summary.

  Transcript:
  {{transcript}}`,
});

const summarizeMeetingFlow = ai.defineFlow(
  {
    name: 'summarizeMeetingFlow',
    inputSchema: SummarizeMeetingInputSchema,
    outputSchema: SummarizeMeetingOutputSchema,
  },
  async input => {
    const {output} = await summarizeMeetingPrompt(input);
    return output!;
  }
);
