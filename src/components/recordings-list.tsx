'use client';

import { useEffect, useState } from 'react';
import type { Recording } from '@/services/get-recordings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Music4 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface RecordingsListProps {
  recordings: Recording[];
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function RecordingsList({ recordings }: RecordingsListProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (recordings.length === 0) {
    return <p className="text-muted-foreground">You have no recordings yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Playback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recordings.map((recording) => (
          <TableRow key={recording.public_id}>
            <TableCell className="font-medium flex items-center gap-2">
              <Music4 className="h-4 w-4 text-primary" />
              {recording.filename}
            </TableCell>
            <TableCell>
              {isClient ? (
                format(new Date(recording.created_at), 'PPP p')
              ) : (
                <Skeleton className="h-4 w-40" />
              )}
            </TableCell>
            <TableCell>{formatDuration(recording.duration)}</TableCell>
            <TableCell className="text-right">
              <audio controls src={recording.secure_url} preload="none" className="w-64 h-10 ml-auto"></audio>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
