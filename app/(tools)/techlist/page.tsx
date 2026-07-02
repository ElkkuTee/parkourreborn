import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/page-hero';
import TechList from '@/components/tools/techlist';
import { Button } from '@/components/ui/button';
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
          <Button asChild className="back-btn">
            <Link href="/">Back</Link>
          </Button>
          <PageHero eyebrow="Tool" title="Tech List" image={images.backgrounds.tools.techlist} />
          <TechList />
        </div>
      </section>
    </main>
  );
}
