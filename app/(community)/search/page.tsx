import type { Metadata } from 'next';
import Link from 'next/link';
import CommunitySearch from '@/components/community/search';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for memes, files and other content.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Link className="back-btn" href="/">
            Back
          </Link>
          <PageHero eyebrow="Community" title="Search" image={images.backgrounds.community.search} />
          <CommunitySearch />
        </div>
      </section>
    </main>
  );
}
