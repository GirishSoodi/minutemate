'use server';

/**
 * @fileOverview Extracts action items from a meeting transcript.
 *
 * - extractActionItems - A function that extracts action items from a meeting transcript.
 * - ExtractActionItemsInput - The input type for the extractActionItems function.
 * - ExtractActionItemsOutput - The return type for the extractActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractActionItemsInputSchema = z.object({
  transcript: z.string().describe('The transcript of the meeting.'),
});
export type ExtractActionItemsInput = z.infer<typeof ExtractActionItemsInputSchema>;

const ExtractActionItemsOutputSchema = z.array(z.object({
  task: z.string().describe('The description of the action item task.'),
  owner: z.string().optional().describe('The person responsible for the action item, if mentioned.'),
  deadline: z.string().optional().describe('The deadline for the action item, if mentioned.')
})).describe('An array of action items extracted from the transcript.');
export type ExtractActionItemsOutput = z.infer<typeof ExtractActionItemsOutputSchema>;

export async function extractActionItems(input: ExtractActionItemsInput): Promise<ExtractActionItemsOutput> {
  return extractActionItemsFlow(input);
}

const extractActionItemsPrompt = ai.definePrompt({
  name: 'extractActionItemsPrompt',
  input: {schema: ExtractActionItemsInputSchema},
  output: {schema: ExtractActionItemsOutputSchema},
  prompt: `You are an AI assistant tasked with extracting action items from meeting transcripts.

  Analyze the following transcript and identify any actionable tasks, who is responsible for them (owner), and any deadlines mentioned. If the owner or deadline is not explicitly stated in the transcript, leave those fields blank.

  Format the output as a JSON array of objects, where each object has the keys 'task', 'owner', and 'deadline'.

  Transcript:
  {{transcript}}`,
});

const extractActionItemsFlow = ai.defineFlow(
  {
    name: 'extractActionItemsFlow',
    inputSchema: ExtractActionItemsInputSchema,
    outputSchema: ExtractActionItemsOutputSchema,
  },
  async input => {
    const {output} = await extractActionItemsPrompt(input);
    return output!;
  }
);
