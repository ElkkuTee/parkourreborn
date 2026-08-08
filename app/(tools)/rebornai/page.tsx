import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/page-hero';
import RebornAi from '@/components/tools/rebornai';
import { Button } from '@/components/ui/button';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Reborn AI',
  description: 'Ask about PARKOUR Reborn techs, time trials, world records and community stuff.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Button asChild className="back-btn">
            <Link href="/">Back</Link>
          </Button>
          <PageHero eyebrow="Tool" title="Reborn AI" image={images.backgrounds.tools.rebornai} />
          <RebornAi />
        </div>
      </section>
    </main>
  );
}
