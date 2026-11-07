'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Behandelingen', href: '/#behandelingen' },
  { label: 'Nagel Designer', href: '/designer' },
  { label: 'Portfolio', href: '/#portfolio' },
  { label: 'Tarieven', href: '/#tarieven' },
  { label: 'Contact', href: '/#contact' },
] as const;

const CTA_HREF = '/#contact';
const CTA_LABEL = 'Afspraak Maken';

const FOCUS_RING =
  'focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);
  const isActive = (href: string) => href === pathname;

  return (
    <header className="sticky top-0 z-50 border-b border-taupe/30 bg-canvas/80 backdrop-blur-md">
      <div
        aria-hidden="true"
        className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
      />
      <nav
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8"
        aria-label="Hoofdnavigatie"
      >
        <Link
          href="/"
          onClick={closeMenu}
          className={`group flex items-center gap-2 font-serif text-2xl font-semibold tracking-[0.2em] text-primary ${FOCUS_RING}`}
        >
          BELISE
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-accent transition-transform duration-200 group-hover:scale-150 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative text-sm font-medium tracking-wide transition-colors after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:bg-accent after:transition-transform after:duration-200 hover:text-accent-dark hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none ${FOCUS_RING} ${
                    active
                      ? 'text-accent-dark after:scale-x-100'
                      : 'text-primary/80 after:scale-x-0'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href={CTA_HREF}
            className="hidden rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-canvas shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 lg:inline-flex"
          >
            {CTA_LABEL}
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Menu sluiten' : 'Menu openen'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent-soft lg:hidden"
          >
            {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="border-t border-taupe/30 bg-card lg:hidden">
          <ul className="flex flex-col px-6 py-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href} className="border-b border-taupe/20 last:border-b-0">
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className={`block py-4 text-base font-medium transition-colors hover:text-accent ${
                      active ? 'text-accent-dark' : 'text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="px-6 pb-6">
            <Link
              href={CTA_HREF}
              onClick={closeMenu}
              className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-canvas shadow-sm transition-transform active:scale-[0.97]"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}