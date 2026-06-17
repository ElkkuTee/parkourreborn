import type { Metadata } from 'next';
import Link from 'next/link';
import ComingSoon from '@/components/coming-soon';
import PageHero from '@/components/page-hero';
import { images } from '@/lib/assets';

export const metadata: Metadata = {
  title: 'Tech List',
  description: 'See all PARKOUR Reborn techs.',
};

export default function Page() {
  return (
    <main className="hub-shell min-h-screen overflow-x-hidden">
      <section className="hub-page hub-page--wide">
        <div className="hub-container">
          <Link className="back-btn" href="/">
            Back
          </Link>
          <PageHero eyebrow="Tools" title="Tech List" image={images.backgrounds.tools.techlist} />
          <ComingSoon />
        </div>
      </section>
    </main>
  );
}
