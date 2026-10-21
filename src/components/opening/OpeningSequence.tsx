import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { wedding } from '../../config/wedding';
import { music } from '../../utils/music';
import { assetUrl } from '../../utils/directions';
import { InvitationScroll } from '../InvitationScroll';
import { PetalField } from '../PetalField';
import { PalaceEntrance } from './PalaceEntrance';
import { RoyalPlaqueButton } from './RoyalPlaqueButton';
import { PhotoReveal } from './PhotoReveal';
import { NamesReveal } from './NamesReveal';
import { RolledScroll } from './RolledScroll';
import { OPENING_PHOTOS, OPENING_TIMING } from './openingConfig';

/**
 * The cinematic opening, played over the page before the main invitation:
 *
 *   A  doors   — the royal palace entrance (PalaceEntrance); the visitor taps to open them
 *               (that tap is also the browser's permission to start the music)
 *   B  photos  — the couple's own photographs, one by one
 *   C  names   — PRAVEEN & KAVIYA
 *   D  scroll  — the rolled invitation; "Open Invitation" unrolls it, then
 *               "Enter the celebration" fades into the website
 *
 * "Skip" is visible and keyboard-reachable throughout. Reduced-motion visitors
 * get short fades instead of movement. Nothing here blocks the page if the
 * sequence is skipped or any step fails.
 */
type Stage = 'doors' | 'opening' | 'photos' | 'names' | 'scroll' | 'unfolding';

export function OpeningSequence({ reducedMotion, mobile, onComplete }: { reducedMotion: boolean; mobile: boolean; onComplete: () => void }) {
  const timing = reducedMotion ? OPENING_TIMING.reduced : OPENING_TIMING.full;
  const [stage, setStage] = useState<Stage>('doors');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [canEnter, setCanEnter] = useState(false);
  const timers = useRef<number[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pendingHash = useRef<string | null>(null);
  const completed = useRef(false);
  const exitSeconds = reducedMotion ? 0.3 : 1.1;

  const later = useCallback((seconds: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, seconds * 1000));
  }, []);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  // Warm the photos so each reveal starts with a decoded image.
  useEffect(() => {
    OPENING_PHOTOS.forEach((p) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = assetUrl(p.jpg[p.jpg.length - 1]?.src ?? '');
    });
  }, []);

  // Keep focus inside the opening for keyboard users.
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  /** Runs once, whether the exit animation reports completion or the safety timer fires first. */
  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
    const hash = pendingHash.current;
    if (hash) {
      window.requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }));
    }
  }, [onComplete, reducedMotion]);

  const finish = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setVisible(false);
    // Safety net: never leave the page locked if the exit animation does not report back.
    window.setTimeout(complete, (exitSeconds + 0.5) * 1000);
  }, [complete, exitSeconds]);

  // Escape skips, like the Skip button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const showScroll = useCallback(() => setStage('scroll'), []);

  const runPhotosThenNames = useCallback(() => {
    if (OPENING_PHOTOS.length === 0) {
      setStage('names');
      later(timing.names, showScroll);
      return;
    }
    setStage('photos');
    OPENING_PHOTOS.forEach((_, i) => {
      if (i > 0) later(timing.photo * i, () => setPhotoIndex(i));
    });
    later(timing.photo * OPENING_PHOTOS.length, () => {
      setStage('names');
      later(timing.names, showScroll);
    });
  }, [later, showScroll, timing.names, timing.photo]);

  const openDoors = useCallback(() => {
    if (stage !== 'doors') return;
    music.startWithInvitation();
    setStage('opening');
    later(timing.doors, runPhotosThenNames);
  }, [stage, later, timing.doors, runPhotosThenNames]);

  const openScroll = useCallback(() => {
    setStage('unfolding');
    later(timing.scrollReady, () => setCanEnter(true));
  }, [later, timing.scrollReady]);

  // Links inside the unrolled scroll ("Confirm Your Presence", "Scroll down")
  // close the opening first, then go to their section.
  const onScrollClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const link = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!link) return;
      e.preventDefault();
      pendingHash.current = link.getAttribute('href');
      finish();
    },
    [finish],
  );

  const sceneFade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reducedMotion ? 0.3 : 0.8 } };

  return (
    <AnimatePresence onExitComplete={complete}>
      {visible && (
        <motion.div
          key="opening"
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${wedding.couple.short} — wedding invitation opening`}
          className="blush-hero fixed inset-0 z-[60] flex flex-col overflow-y-auto overflow-x-hidden outline-none"
          exit={{ opacity: 0, transition: { duration: exitSeconds, ease: [0.65, 0, 0.35, 1] } }}
        >
          <div className="kolam-overlay" aria-hidden="true" />
          <div className="light-rays" aria-hidden="true" />
          {stage !== 'doors' && stage !== 'opening' ? <PetalField depth /> : null}
          <div className="opening-glow pointer-events-none absolute inset-0 -z-[1]" aria-hidden="true" />

          {/* Skip — always available */}
          <div className="pointer-events-none sticky top-0 z-20 flex justify-start p-3 sm:p-5">
            <button type="button" onClick={finish} className="btn-outline pointer-events-auto min-h-[44px] px-5 text-[0.72rem]">
              Skip intro
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-10">
            <AnimatePresence mode="wait">
              {(stage === 'doors' || stage === 'opening') && (
                <motion.div key="doors" className="fixed inset-0" {...sceneFade}>
                  <PalaceEntrance
                    open={stage === 'opening'}
                    reducedMotion={reducedMotion}
                    mobile={mobile}
                    duration={timing.doors}
                    eyebrow={
                      <motion.p
                        className="eyebrow relative px-4 text-center text-gold-dark"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: stage === 'opening' ? 0 : 1, y: 0 }}
                        transition={{ duration: 0.9 }}
                      >
                        {wedding.intro.eyebrow}
                      </motion.p>
                    }
                    action={
                      <motion.div
                        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: stage === 'opening' ? 0 : 1, y: 0 }}
                        transition={stage === 'opening' ? { duration: 0.35 } : { duration: 1, delay: reducedMotion ? 0 : 1.2 }}
                      >
                        <RoyalPlaqueButton onClick={openDoors} disabled={stage !== 'doors'}>
                          {wedding.intro.button}
                        </RoyalPlaqueButton>
                      </motion.div>
                    }
                  />
                </motion.div>
              )}

              {stage === 'photos' && (
                <motion.div key="photos" className="w-full" {...sceneFade}>
                  <PhotoReveal photos={OPENING_PHOTOS} index={photoIndex} reducedMotion={reducedMotion} duration={timing.photo} />
                </motion.div>
              )}

              {stage === 'names' && (
                <motion.div key="names" {...sceneFade}>
                  <NamesReveal reducedMotion={reducedMotion} />
                </motion.div>
              )}

              {stage === 'scroll' && (
                <motion.div key="rolled" {...sceneFade}>
                  <RolledScroll onOpen={openScroll} reducedMotion={reducedMotion} />
                </motion.div>
              )}

              {stage === 'unfolding' && (
                <motion.div key="unfold" className="w-full py-6" {...sceneFade} onClickCapture={onScrollClick}>
                  <InvitationScroll mode="unfold" reducedMotion={reducedMotion} tilt={false} />
                  <motion.div
                    className="mt-10 flex justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={canEnter ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.8 }}
                  >
                    <button type="button" onClick={finish} className="btn-primary px-8" disabled={!canEnter} aria-hidden={!canEnter}>
                      Enter the celebration
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
