import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#invitation', label: 'Invitation' },
  { href: '#ceremony', label: 'Ceremony' },
  { href: '#couple', label: 'Couple' },
  { href: '#rituals', label: 'Rituals' },
  { href: '#reception', label: 'Reception' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#rsvp', label: 'RSVP' },
  { href: '#family', label: 'Family' },
];

/** Discreet top navigation, shown once the invitation has been revealed. */
export function SiteNav({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          className={`on-dark fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
            solid || open ? 'bg-stone/90 shadow-[0_1px_0_rgba(198,161,91,0.25)] backdrop-blur-md' : 'bg-transparent'
          }`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <nav aria-label="Invitation sections" className="mx-auto flex h-16 max-w-6xl items-center justify-between pl-4 pr-16 sm:pl-6 sm:pr-20">
            <a href="#invitation" className="font-display text-xl italic text-ivory" aria-label="Back to the invitation">
              P <span className="not-italic text-gold-light">&amp;</span> K
            </a>
            <ul className="hidden items-center gap-1 md:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="inline-flex min-h-[44px] items-center px-2.5 font-caps text-[0.7rem] uppercase tracking-[0.18em] text-ivory/85 transition-colors hover:text-gold-light"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              ref={menuButton}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ivory md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </nav>
          <AnimatePresence>
            {open && (
              <motion.ul
                id="mobile-menu"
                className="border-t border-gold/20 px-4 pb-4 md:hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[48px] items-center justify-center font-caps text-sm uppercase tracking-[0.24em] text-ivory/90"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
