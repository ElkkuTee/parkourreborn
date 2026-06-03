import type { Metadata } from 'next';
import Link from 'next/link';
import ComingSoon from '@/components/coming-soon';
import PageHero from '@/components/page-hero';
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
          <Link className="back-btn" href="/">
            Back
          </Link>
          <PageHero eyebrow="Games" title="Parkour Guessr" image={images.backgrounds.games.parkourguessr} />
          <ComingSoon />
        </div>
      </section>
    </main>
  );
}
