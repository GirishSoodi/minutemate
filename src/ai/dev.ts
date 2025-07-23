import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-meeting.ts';
import '@/ai/flows/extract-action-items.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/generate-meeting-title.ts';
import '@/ai/flows/export-to-google-docs.ts';
import '@/ai/flows/export-to-notion.ts';
