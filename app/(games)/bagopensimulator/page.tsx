import type { Metadata } from 'next';
import Link from 'next/link';
import ComingSoon from '@/components/coming-soon';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Bag Opening Simulator',
  description: 'Open PARKOUR Reborn bags in a simulator.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Link className="back-btn" href="/">
            Back
          </Link>
          <PageHero eyebrow="Games" title="Bag Opening Simulator" image={images.backgrounds.games.bagopensimulator} />
          <ComingSoon />
        </div>
      </section>
    </main>
  );
}
