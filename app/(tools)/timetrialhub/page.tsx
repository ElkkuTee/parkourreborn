import type { Metadata } from 'next';
import Link from 'next/link';
import TimeTrialHub from '@/components/tools/timetrialhub';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Time Trial Hub',
  description: 'Track PARKOUR Reborn time trial records and routes.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <div className="tool-topbar">
            <Button asChild className="back-btn">
              <Link href="/">Back</Link>
            </Button>
            <Button asChild className="back-btn">
              <a href="https://wasans.tully.sh" target="_blank" rel="noopener noreferrer">Official Scoring Website</a>
            </Button>
          </div>
          <TimeTrialHub />
        </div>
      </section>
    </main>
  );
}
