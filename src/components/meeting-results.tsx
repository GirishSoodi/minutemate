'use client';

import { Check, Clipboard, Loader2, AlertTriangle, FileText, Bot } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SummarizeMeetingOutput } from '@/ai/flows/summarize-meeting';
import type { ExtractActionItemsOutput } from '@/ai/flows/extract-action-items';
import { exportToGoogleDocs } from '@/ai/flows/export-to-google-docs';
import { exportToNotion } from '@/ai/flows/export-to-notion';

interface MeetingResultsProps {
  isLoading: {
    transcription: boolean;
    analysis: boolean;
    upload: boolean;
  };
  transcript: string | null;
  summary: SummarizeMeetingOutput | null;
  actionItems: ExtractActionItemsOutput | null;
  error: string | null;
}

const CopyButton = ({ textToCopy, disabled }: { textToCopy: string; disabled?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const onCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={onCopy} disabled={disabled || !textToCopy}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
    </Button>
  );
};

const formatActionItemsForCopy = (items: ExtractActionItemsOutput) => {
  return items.map(item => `- ${item.task} (Owner: ${item.owner || 'Unassigned'}, Deadline: ${item.deadline || 'None'})`).join('\n');
};

const formatTranscript = (transcript: string | null) => {
  if (!transcript) return null;
  // Filter out any empty lines that might result from splitting
  return transcript.split('\n').filter(line => line.trim() !== '').map((line, index) => {
    if (line.startsWith('Speaker')) {
      const parts = line.split(':');
      const speaker = parts[0];
      const text = parts.slice(1).join(':');
      return (
        <div key={index} className="mb-4">
          <span className="font-bold text-primary">{speaker}:</span>
          <span className="ml-2 text-muted-foreground">{text}</span>
        </div>
      );
    }
    // This will handle any non-speaker lines, though they are less likely now.
    return <p key={index} className="text-muted-foreground mb-4">{line}</p>;
  });
};

export function MeetingResults({
  isLoading,
  transcript,
  summary,
  actionItems,
  error,
}: MeetingResultsProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState({ notion: false, google: false });

  if (isLoading.upload) {
    return (
      <Card className="mx-auto mt-8 max-w-4xl shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold text-muted-foreground">Uploading audio...</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading.transcription) {
    return (
      <Card className="mx-auto mt-8 max-w-4xl shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold text-muted-foreground">Transcribing audio...</p>
          <p className="mt-2 text-sm text-muted-foreground">This may take a few moments...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !transcript) {
    return (
      <Card className="mx-auto mt-8 max-w-4xl shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle />
            Processing Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!transcript) {
    return null;
  }

  const handleExport = async (service: 'notion' | 'google') => {
    if (!summary?.summary || !summary?.title) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No summary available to export.',
        });
        return;
    }
    
    setIsExporting(prev => ({ ...prev, [service]: true }));

    try {
        let result;
        const content = summary.summary + '\n\nAction Items:\n' + (actionItems ? formatActionItemsForCopy(actionItems) : 'None');

        if (service === 'notion') {
            result = await exportToNotion({ title: summary.title, content: content });
        } else {
            result = await exportToGoogleDocs({ title: summary.title, content: content });
        }
        
        toast({
            title: 'Export Successful!',
            description: (
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">
                View your new document here.
              </a>
            ),
        });
    } catch (e: any) {
        const errorMessage = e.message || `Failed to export to ${service}.`;
        console.error(`Export to ${service} failed:`, e);
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: errorMessage,
        });
    } finally {
        setIsExporting(prev => ({ ...prev, [service]: false }));
    }
  };

  return (
    <div className="mt-8">
      <Tabs defaultValue="summary" className="mx-auto max-w-4xl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="action-items">Action Items</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{summary?.title || 'Meeting Summary'}</CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleExport('google')} 
                    disabled={isLoading.analysis || isExporting.google || isExporting.notion}
                >
                  {isExporting.google ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Export to Google Docs
                </Button>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('notion')} 
                    disabled={isLoading.analysis || isExporting.notion || isExporting.google}
                >
                  {isExporting.notion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Export to Notion
                </Button>
                <CopyButton textToCopy={`${summary?.title || ''}\n\n${summary?.summary || ''}`} disabled={isLoading.analysis} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading.analysis ? (
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none pt-4"
                  dangerouslySetInnerHTML={{
                    __html: summary?.summary.replace(/\n/g, '<br />') || 'No summary available.',
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="action-items">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Action Items</CardTitle>
              <CopyButton textToCopy={actionItems ? formatActionItemsForCopy(actionItems) : ''} disabled={isLoading.analysis} />
            </CardHeader>
            <CardContent>
              {isLoading.analysis ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : actionItems && actionItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.task}</TableCell>
                        <TableCell>{item.owner || '-'}</TableCell>
                        <TableCell>{item.deadline || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No action items were identified.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transcript">
          <Card className="shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Full Transcript</CardTitle>
              <CopyButton textToCopy={transcript || ''} />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 w-full rounded-md border p-4">
                 <div className="text-sm">{formatTranscript(transcript)}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
