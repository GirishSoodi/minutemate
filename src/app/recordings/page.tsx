import { getRecordings } from '@/services/get-recordings';
import { RecordingsList } from '@/components/recordings-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RecordingsPage() {
  const recordings = await getRecordings();

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tighter text-primary font-headline sm:text-5xl">
          All Recordings
        </h1>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Your Past Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordingsList recordings={recordings} />
        </CardContent>
      </Card>
    </main>
  );
}
