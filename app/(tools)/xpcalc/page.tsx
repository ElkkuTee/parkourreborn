import type { Metadata } from 'next';
import Link from 'next/link';
import XPCalculator from '@/components/tools/xpcalc';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'XP Calculator',
  description: 'Calculate PARKOUR Reborn levels, XP, and combo score.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Button asChild className="back-btn">
            <Link href="/">Back</Link>
          </Button>
          <XPCalculator />
        </div>
      </section>
    </main>
  );
}
