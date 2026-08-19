'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, Clock, ClipboardList, ArrowBigLeft, House, Search } from 'lucide-react';
import { images } from '@/lib/assets';
import MenuAuth from '@/components/menu-auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';

const mainLinks = [
  { name: 'Tech List', href: '/techlist', icon: ClipboardList },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Time Trial Hub', href: '/timetrialhub', icon: Clock },
];

const redirectLinks = [
  { name: 'Wiki', href: 'https://parkourreborn.wiki', icon: BookOpen },
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className={`menu-toggle ${open ? 'is-open' : ''}`} type="button" tabIndex={-1} aria-label="Open menu" aria-expanded={open}>
          <MenuIcon open={open} />
        </Button>
      </SheetTrigger>

      <aside className={`side-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="side-menu__brand">
          <Image src={images.logo.main} alt="" width={34} height={34} />
          <span>PR Hub</span>
        </div>

        <Link href="/" className="side-menu__link side-menu__link--home" tabIndex={-1} onClick={() => setOpen(false)}>
          <House className="side-menu__icon size-8" aria-hidden="true" />
          <span>Home</span>
        </Link>

        <nav className="side-menu__nav" aria-label="Main menu">
          {mainLinks.map(({ href, icon: Icon, name }) => (
            <Link
              href={href}
              className="side-menu__link"
              key={name}
              tabIndex={-1}
              onClick={() => setOpen(false)}
            >
              <Icon className="side-menu__icon size-8" aria-hidden="true" />
              <span>{name}</span>
            </Link>
          ))}
          {redirectLinks.map(({ href, icon: Icon, name }) => (
            <Link
              href={href}
              className="side-menu__link"
              key={name}
              tabIndex={-1}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <Icon className="side-menu__icon size-8" aria-hidden="true" />
              <span>{name}</span>
            </Link>
          ))}
          <MenuAuth />
        </nav>
        <div className="side-menu__footer">
          <Button className="side-menu__resume" type="button" tabIndex={-1} onClick={() => setOpen(false)}>
            <span className="side-menu__resume-mark side-menu__resume-mark--tl" aria-hidden="true" />
            <span className="side-menu__resume-mark side-menu__resume-mark--br" aria-hidden="true" />
            <span className="side-menu__resume-bg" aria-hidden="true" />
            <ArrowBigLeft className="side-menu__resume-icon size-7" aria-hidden="true" />
            <span className="side-menu__resume-text">Resume</span>
          </Button>
        </div>
      </aside>

      <Button className={`menu-scrim ${open ? 'is-open' : ''}`} type="button" tabIndex={-1} aria-label="Close menu" onClick={() => setOpen(false)} />
    </Sheet>
  );
}
