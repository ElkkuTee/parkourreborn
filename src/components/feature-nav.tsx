'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { images } from '@/lib/assets';

type NavItem = {title: string; image: string; href: string;};
type Feature = {title: string; bg: string; items: NavItem[];};

const features: Feature[] = [
  {
    title: 'Tools',
    bg: images.backgrounds.tools.bg,
    items: [
      { title: 'Tech List', image: images.backgrounds.tools.techlist, href: '/' },
      { title: 'XP Calculator', image: images.backgrounds.tools.xpcalc, href: '/xpcalc' },
    ],
  },
  {
    title: 'Games',
    bg: images.backgrounds.games.bg,
    items: [
      { title: 'Parkour Guessr', image: images.backgrounds.games.parkourguessr, href: '/' },
      { title: 'Incremental Parkour', image: images.backgrounds.games.incrementalparkour, href: '/' },
      { title: 'Bag Opening Simulator', image: images.backgrounds.games.bagopensimulator, href: '/' },
    ],
  },
  {
    title: 'Community',
    bg: images.backgrounds.community.bg,
    items: [
      { title: 'Map', image: images.backgrounds.community.map, href: '/map' },
      { title: 'Contributions', image: images.backgrounds.community.contributions, href: '/' },
    ],
  },
];

const columnsFor = (count: number) => (count === 4 ? 2 : Math.min(count, 3));

export default function FeatureNav() {
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <section className="feature-grid" aria-label="Hub sections" ref={navRef}>
      {features.map((card) => {
        const isOpen = open === card.title;
        const panelId = `feature-nav-${card.title.toLowerCase()}`;
        const columns = columnsFor(card.items.length);

        return (
          <div className={`feature-card-shell ${isOpen ? 'is-open' : ''}`} key={card.title}>
            <button className="feature-card" type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen((current) => (current === card.title ? null : card.title))}>
              <span className="feature-card__image" style={{backgroundImage: `url(${card.bg})`}} />
              <span className="feature-card__shade" />
              <span className="feature-card__content">
                <strong>{card.title}</strong>
              </span>
            </button>

            <AnimatePresence>
              {isOpen ? (
                <div className={`feature-nav-frame feature-nav-frame--${columns}`}>
                  <motion.div
                    className="feature-nav"
                    id={panelId}
                    role="region"
                    aria-label={`${card.title} navigation`}
                    initial={{opacity: 0, y: -8, scale: 0.94, filter: 'blur(8px)'}}
                    animate={{opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'}}
                    exit={{opacity: 0, y: -6, scale: 0.96, filter: 'blur(8px)'}}
                    transition={{type: 'spring', stiffness: 520, damping: 36, mass: 0.7}}
                    style={{transformOrigin: 'top center'}}
                  >
                    <div className="feature-nav__items">
                      {card.items.map((item) => (
                        <Link className="feature-nav__item" href={item.href} key={item.title} onClick={() => setOpen(null)}>
                          <span className="feature-nav__image" style={{backgroundImage: `url(${item.image})`}} />
                          <span className="feature-nav__shade" />
                          <span className="feature-nav__content">
                            <strong>{item.title}</strong>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </section>
  );
}
