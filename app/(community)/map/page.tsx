import type { Metadata } from 'next';
import Link from 'next/link';
import MapCard from '@/components/community/mapcard';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Map',
  description: 'View the Parkour Reborn map.',
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
            <a className="back-btn" href="https://map.themirrorcafe.cc" target="_blank" rel="noopener noreferrer">
              Official Interactive Map
            </a>
          </div>
          <PageHero eyebrow="Community" title="Map" image={images.backgrounds.community.map} />
          <MapCard image={images.elements.map.normal} />
        </div>
      </section>
    </main>
  );
}
