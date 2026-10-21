import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { wedding, type Photo } from '../config/wedding';
import { Picture } from './Picture';
import { Reveal } from './Reveal';

/** All four original photographs, with a full-screen viewer. */
export function Gallery() {
  const photos: Photo[] = [wedding.photos.hero, ...wedding.photos.gallery, wedding.photos.reception];
  const [index, setIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const open = (i: number, el: HTMLElement) => {
    opener.current = el;
    setIndex(i);
    dialog.current?.showModal?.();
  };
  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClose = () => {
      setIndex(null);
      opener.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    el.addEventListener('close', onClose);
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('close', onClose);
      el.removeEventListener('keydown', onKey);
    };
  }, [step]);

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="surface-plum toran-top scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="eyebrow text-[#F6D98E]">Cherished frames</p>
          <h2 id="gallery-title" className="gold-foil-light mt-3 font-caps text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] uppercase tracking-[0.18em]">
            Gallery
          </h2>
          <div className="frieze mx-auto mt-5 w-64" aria-hidden="true" />
        </Reveal>
        <div className="mt-12 space-y-3 sm:space-y-5">
          {photos.map((photo, i) =>
            i === 0 ? (
              <Reveal key={photo.alt}>
                <PhotoButton photo={photo} sizes="(min-width: 1024px) 72rem, 100vw" onOpen={(el) => open(0, el)} />
              </Reveal>
            ) : null,
          )}
          <ul className="grid grid-cols-3 gap-3 sm:gap-5">
            {photos.slice(1).map((photo, k) => (
              <li key={photo.alt}>
                <Reveal delay={k * 0.1}>
                  <PhotoButton photo={photo} sizes="(min-width: 1024px) 24rem, 33vw" onOpen={(el) => open(k + 1, el)} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-label="Photo viewer"
        className="m-auto max-h-[100svh] max-w-[100vw] bg-transparent p-0 backdrop:bg-pearl/95 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        {index !== null && (
          <div className="relative flex h-[100svh] w-[100vw] items-center justify-center p-4 sm:p-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                transition={{ duration: reduced ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Picture
                  photo={photos[index]}
                  sizes="100vw"
                  eager
                  imgClassName="max-h-[calc(100svh-6rem)] w-auto max-w-full rounded-[4px] object-contain shadow-[0_40px_80px_-40px_rgba(117,68,87,0.6)] ring-1 ring-gold/50"
                />
              </motion.div>
            </AnimatePresence>
            <button type="button" onClick={close} aria-label="Close photo" className="absolute right-3 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-panel text-burgundy shadow-petal transition-colors hover:bg-blush">
              <X size={20} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-panel text-burgundy shadow-petal transition-colors hover:bg-blush sm:left-5">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold/60 bg-panel text-burgundy shadow-petal transition-colors hover:bg-blush sm:right-5">
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-panel/90 px-3 py-1 font-caps text-[0.75rem] tracking-[0.2em] text-burgundy">
              {index + 1} / {photos.length}
            </p>
          </div>
        )}
      </dialog>
    </section>
  );
}

function PhotoButton({ photo, sizes, onOpen }: { photo: Photo; sizes: string; onOpen: (el: HTMLElement) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(e.currentTarget)}
      className="frame-double group block w-full overflow-hidden rounded-[6px] bg-panel p-[5px] shadow-petal transition-shadow duration-500 hover:shadow-petal-lg sm:p-[8px]"
      aria-label={`View photo larger: ${photo.alt}`}
    >
      <span className="block overflow-hidden" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Picture
          photo={photo}
          sizes={sizes}
          imgClassName="block h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
        />
      </span>
    </button>
  );
}
