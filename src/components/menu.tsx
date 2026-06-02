'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { images } from '@/lib/assets';

const MenuIcon = ({ open }: { open: boolean }) => (
  <span className={`menu-icon ${open ? 'is-open' : ''}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

export default function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="menu-toggle" type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MenuIcon open={open} />
      </button>

      <aside className={`side-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="side-menu__brand">
          <Image src={images.logo.main} alt="" width={34} height={34} />
          <span>PR Hub</span>
        </div>
        <nav className="side-menu__nav" aria-label="Main menu">
          <Link href="/" className="side-menu__link" onClick={() => setOpen(false)}>
            Home
          </Link>
          <button className="side-menu__link" type="button">
            Settings
          </button>
        </nav>
      </aside>

      <button className={`menu-scrim ${open ? 'is-open' : ''}`} type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
    </>
  );
}
