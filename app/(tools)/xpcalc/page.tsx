import type { Metadata } from 'next';
import Link from 'next/link';
import XPCalculator from '@/components/tools/xpcalc';

export const metadata: Metadata = {
  title: 'XP Calculator | Parkour Reborn Hub',
  description: 'Calculate PARKOUR Reborn levels, XP, multipliers, and combo score.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Link className="back-btn" href="/">
            Back
          </Link>
          <XPCalculator />
        </div>
      </section>
    </main>
  );
}
