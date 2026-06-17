import type { Metadata } from 'next';
import Link from 'next/link';
import TimeTrialHub from '@/components/tools/timetrialhub';

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
            <Link className="back-btn" href="/">
              Back
            </Link>
            <a className="back-btn" href="https://wasans.tully.sh" target="_blank" rel="noopener noreferrer">
              Official Scoring Website
            </a>
          </div>
          <TimeTrialHub />
        </div>
      </section>
    </main>
  );
}
