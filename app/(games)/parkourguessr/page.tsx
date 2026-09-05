import type { Metadata } from 'next';
import Link from 'next/link';
import ComingSoon from '@/components/coming-soon';
import PageHero from '@/components/page-hero';
import { Button } from '@/components/ui/button';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Parkour Guessr',
  description: 'Play Parkour Reborn geoguessr.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Button asChild className="back-btn">
            <Link href="/">&#8592; Back</Link>
          </Button>
          <PageHero title="Parkour Guessr" image={images.backgrounds.games.parkourguessr} />
          <ComingSoon />
        </div>
      </section>
    </main>
  );
}
