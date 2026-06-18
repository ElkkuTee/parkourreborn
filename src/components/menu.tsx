'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { images } from '@/lib/assets';
import MenuAuth from '@/components/menu-auth';

const mainLinks = [
  { name: 'Tech List', href: '/techlist' },
  { name: 'Search', href: '/search' },
  { name: 'Time Trial Hub', href: '/timetrialhub' },
];

const redirectLinks = [
  { name: 'Wiki', href: 'https://parkourreborn.wiki' },
];

const MenuIcon = ({ open }: { open: boolean }) => (
  <span className={`menu-icon ${open ? 'is-open' : ''}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

export default function Menu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const typing = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.matches('input, textarea, select, [contenteditable="true"]');
    };

    const clearFocus = () => {
      if (document.activeElement instanceof HTMLElement && !typing(document.activeElement)) document.activeElement.blur();
    };

    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopImmediatePropagation();
        clearFocus();
        setOpen((current) => !current);
        requestAnimationFrame(clearFocus);
        return;
      }

      if (typing(event.target)) return;

      if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof HTMLElement && event.target.closest('a, button, [role="button"]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const focus = (event: FocusEvent) => {
      if (typing(event.target)) return;
      if (event.target instanceof HTMLElement) event.target.blur();
    };

    document.addEventListener('keydown', keyboard, true);
    document.addEventListener('focusin', focus, true);
    return () => {
      document.removeEventListener('keydown', keyboard, true);
      document.removeEventListener('focusin', focus, true);
    };
  }, []);

  return (
    <>
      <button className="menu-toggle" type="button" tabIndex={-1} aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MenuIcon open={open} />
      </button>

      <aside className={`side-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="side-menu__brand">
          <Image src={images.logo.main} alt="" width={34} height={34} />
          <span>PR Hub</span>
        </div>
        <nav className="side-menu__nav" aria-label="Main menu">
          <Link href="/" className="side-menu__link" tabIndex={-1} onClick={() => setOpen(false)}>
            Home
          </Link>
          <span className="side-menu__line" />
          {mainLinks.map((link) => (
            <Link
              href={link.href}
              className="side-menu__link"
              key={link.name}
              tabIndex={-1}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <span className="side-menu__line" />
          {redirectLinks.map((link) => (
            <Link
              href={link.href}
              className="side-menu__link"
              key={link.name}
              tabIndex={-1}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="side-menu__footer">
          <MenuAuth />
        </div>
      </aside>

      <button className={`menu-scrim ${open ? 'is-open' : ''}`} type="button" tabIndex={-1} aria-label="Close menu" onClick={() => setOpen(false)} />
    </>
  );
}
