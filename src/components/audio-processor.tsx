
'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Upload, Square, Loader2, Pause, Play, Send, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AudioProcessorProps {
  onProcessAudio: (blob: Blob) => void;
  isProcessing: boolean;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
};

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};


export function AudioProcessor({ onProcessAudio, isProcessing }: AudioProcessorProps) {
  const { toast } = useToast();
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setAudioPreview(null);
      setRecordedBlob(null);
      setRealtimeTranscript('');
      setElapsedTime(0);

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // This part is for potential real-time streaming in the future
          // For now, we will transcribe after stopping.
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioPreview(audioUrl);
        setRecordingStatus('stopped');
        stream.getTracks().forEach(track => track.stop());
        stopTimer();
      };

      mediaRecorderRef.current.start(1000); // Trigger ondataavailable every second
      setRecordingStatus('recording');
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check your browser permissions.',
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingStatus === 'recording' || recordingStatus === 'paused')) {
      mediaRecorderRef.current.stop();
    }
  };
  
  const resetRecording = () => {
    setRecordingStatus('idle');
    setAudioPreview(null);
    setRecordedBlob(null);
    setRealtimeTranscript('');
    audioChunksRef.current = [];
    stopTimer();
    setElapsedTime(0);
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
    }
  };

  const handleProcessAudio = () => {
    if (recordedBlob) {
      onProcessAudio(recordedBlob);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        const fileBlob = new Blob([file], { type: file.type });
        setRecordedBlob(fileBlob);
        const audioUrl = URL.createObjectURL(fileBlob);
        setAudioPreview(audioUrl);
        setRecordingStatus('stopped');
        onProcessAudio(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a valid audio file.',
        });
      }
    }
  };
  
  const renderRecordingControls = () => {
    if (isProcessing) {
      return (
        <Button disabled className="w-48 h-12 text-lg">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Processing...
        </Button>
      );
    }

    switch (recordingStatus) {
      case 'idle':
        return (
          <Button onClick={startRecording} className="w-48 h-12 text-lg">
            <Mic className="mr-2 h-6 w-6" /> Record
          </Button>
        );
      case 'recording':
        return (
          <div className="flex gap-4">
            <Button onClick={pauseRecording} variant="secondary" className="h-12 text-lg">
              <Pause className="mr-2 h-6 w-6" /> Pause
            </Button>
            <Button onClick={stopRecording} variant="destructive" className="h-12 text-lg">
              <Square className="mr-2 h-6 w-6 fill-white" /> Stop
            </Button>
          </div>
        );
      case 'paused':
        return (
          <div className="flex gap-4">
            <Button onClick={resumeRecording} className="h-12 text-lg">
              <Play className="mr-2 h-6 w-6 fill-white" /> Resume
            </Button>
            <Button onClick={stopRecording} variant="destructive" className="h-12 text-lg">
              <Square className="mr-2 h-6 w-6 fill-white" /> Stop
            </Button>
          </div>
        );
      case 'stopped':
        return (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-muted-foreground">Preview your recording:</p>
            {audioPreview && <audio controls src={audioPreview} className="w-full max-w-sm"></audio>}
            <div className="flex gap-4 mt-2">
              <Button onClick={resetRecording} variant="outline" className="h-12 text-lg">
                <RefreshCw className="mr-2 h-6 w-6" /> Record Again
              </Button>
              <Button onClick={handleProcessAudio} className="h-12 text-lg bg-green-600 hover:bg-green-700">
                <Send className="mr-2 h-6 w-6" /> Process Meeting
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTimer = () => {
    if (recordingStatus === 'recording' || recordingStatus === 'paused') {
        return (
            <div className="mt-4 flex items-center justify-center gap-2 text-lg font-mono text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>{formatTime(elapsedTime)}</span>
            </div>
        )
    }
    return null;
  }

  return (
    <Card className="mx-auto max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Process Your Meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="record">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record" onClick={resetRecording}>
              <Mic className="mr-2 h-4 w-4" /> Record Audio
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" /> Upload File
            </TabsTrigger>
          </TabsList>
          <TabsContent value="record" className="mt-6 text-center flex flex-col items-center justify-center min-h-[150px]">
             {recordingStatus === 'idle' && <p className="mb-4 text-muted-foreground">Click the button to start recording your meeting.</p>}
             {recordingStatus === 'recording' && <p className="mb-4 text-muted-foreground animate-pulse text-red-400">Recording in progress...</p>}
             {recordingStatus === 'paused' && <p className="mb-4 text-muted-foreground">Recording paused.</p>}
            {renderRecordingControls()}
            {renderTimer()}
            {realtimeTranscript && (
              <Card className="mt-6 w-full">
                <CardHeader>
                  <CardTitle className="text-lg">Real-time Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-left">{realtimeTranscript}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="upload" className="mt-6">
             <p className="mb-4 text-muted-foreground text-center">Select an audio file from your device.</p>
            <div className="flex items-center justify-center">
               <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/webm,audio/wav,audio/mpeg,audio/*"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="hidden"
                />
                <Button asChild variant="outline" className="w-full h-12 text-lg" disabled={isProcessing}>
                  <label htmlFor="audio-upload" className="cursor-pointer flex items-center justify-center">
                     {isProcessing ? (
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-6 w-6" />
                    )}
                    {isProcessing ? 'Processing...' : 'Choose an Audio File'}
                  </label>
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
