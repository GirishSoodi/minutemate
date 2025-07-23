'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { AudioProcessor } from '@/components/audio-processor';
import { MeetingResults } from '@/components/meeting-results';
import type { SummarizeMeetingOutput } from '@/ai/flows/summarize-meeting';
import type { ExtractActionItemsOutput } from '@/ai/flows/extract-action-items';

import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { summarizeMeeting } from '@/ai/flows/summarize-meeting';
import { extractActionItems } from '@/ai/flows/extract-action-items';
import { uploadAudio } from '@/services/upload-audio';

// Helper function to convert Blob to Base64 Data URI
const blobToDataUri = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to Data URI'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function Home() {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummarizeMeetingOutput | null>(null);
  const [actionItems, setActionItems] = useState<ExtractActionItemsOutput | null>(null);
  const [isLoading, setIsLoading] = useState({
    transcription: false,
    analysis: false,
    upload: false,
  });
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setTranscript(null);
    setSummary(null);
    setActionItems(null);
    setError(null);
    setIsLoading({ transcription: false, analysis: false, upload: false });
  };

  const handleAudioProcessing = async (audioBlob: Blob) => {
    resetState();
    setIsLoading({ transcription: false, analysis: false, upload: true });
    setError(null);

    try {
      const audioDataUri = await blobToDataUri(audioBlob);

      // Step 1: Upload audio to Cloudinary
      await uploadAudio({ audioDataUri });
      setIsLoading({ transcription: true, analysis: false, upload: false });

      // Step 2: Transcribe audio
      const transcriptionResult = await transcribeAudio({ audioDataUri });
      const currentTranscript = transcriptionResult.transcript;
      if (!currentTranscript) {
        throw new Error('Transcription failed to produce a result.');
      }
      setTranscript(currentTranscript);
      setIsLoading({ transcription: false, analysis: true, upload: false });

      // Step 3: Summarize and extract action items in parallel
      const [summaryResult, actionItemsResult] = await Promise.all([
        summarizeMeeting({ transcript: currentTranscript }),
        extractActionItems({ transcript: currentTranscript }),
      ]);

      setSummary(summaryResult);
      setActionItems(actionItemsResult);
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      console.error(e);
    } finally {
      setIsLoading({ transcription: false, analysis: false, upload: false });
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <PageHeader />
      <AudioProcessor
        onProcessAudio={handleAudioProcessing}
        isProcessing={isLoading.transcription || isLoading.upload || isLoading.analysis}
      />
      <MeetingResults
        isLoading={isLoading}
        transcript={transcript}
        summary={summary}
        actionItems={actionItems}
        error={error}
      />
    </main>
  );
}
