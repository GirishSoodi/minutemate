'use server';

/**
 * @fileOverview Generates a title for the meeting based on the transcript.
 *
 * - generateMeetingTitle - A function that handles the meeting title generation process.
 * - GenerateMeetingTitleInput - The input type for the generateMeetingTitle function.
 * - GenerateMeetingTitleOutput - The return type for the generateMeetingTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMeetingTitleInputSchema = z.object({
  transcript: z.string().describe('The transcript of the meeting.'),
});
export type GenerateMeetingTitleInput = z.infer<typeof GenerateMeetingTitleInputSchema>;

const GenerateMeetingTitleOutputSchema = z.object({
  title: z.string().describe('The generated title for the meeting.'),
});
export type GenerateMeetingTitleOutput = z.infer<typeof GenerateMeetingTitleOutputSchema>;

export async function generateMeetingTitle(input: GenerateMeetingTitleInput): Promise<GenerateMeetingTitleOutput> {
  return generateMeetingTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingTitlePrompt',
  input: {schema: GenerateMeetingTitleInputSchema},
  output: {schema: GenerateMeetingTitleOutputSchema},
  prompt: `You are an expert at generating titles for meetings.

  Generate a concise and relevant title that captures the essence of the meeting based on the following transcript:

  Transcript: {{{transcript}}}

  Title: `,
});

const generateMeetingTitleFlow = ai.defineFlow(
  {
    name: 'generateMeetingTitleFlow',
    inputSchema: GenerateMeetingTitleInputSchema,
    outputSchema: GenerateMeetingTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
