import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListMusic } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="mb-8 text-center md:mb-12 relative">
      <div className="absolute top-0 right-0">
        <Button asChild variant="outline">
          <Link href="/recordings">
            <ListMusic className="mr-2 h-4 w-4" />
            All Recordings
          </Link>
        </Button>
      </div>
      <h1 className="text-4xl font-bold tracking-tighter text-primary font-headline sm:text-5xl md:text-6xl">
        Meeting Maestro
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-xl">
        Record or upload your meeting audio. Get a transcript, summary, and action items, all powered by AI.
      </p>
    </header>
  );
}
