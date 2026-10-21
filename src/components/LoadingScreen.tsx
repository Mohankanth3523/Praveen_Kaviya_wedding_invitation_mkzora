import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { wedding } from '../config/wedding';
import { Crest } from './Ornaments';

export type StageStatus = 'loading' | 'building' | 'ready' | 'fallback';

/**
 * Real milestones, smoothed for display:
 *   fonts loaded → 3D code downloaded → temple built → 100%.
 * The number creeps slowly towards each milestone's ceiling so it never
 * stalls visibly, and only reaches 100% when the temple is truly ready.
 */
function targetFor(status: StageStatus, fontsReady: boolean) {
  if (status === 'ready' || status === 'fallback') return 100;
  if (status === 'building') return 92;
  return fontsReady ? 68 : 30;
}

export function LoadingScreen({ status, onDone }: { status: StageStatus; onDone: () => void }) {
  const [fontsReady, setFontsReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const [visible, setVisible] = useState(true);
  const value = useRef(0);
  const target = targetFor(status, fontsReady);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    let alive = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) void fonts.ready.then(() => alive && setFontsReady(true));
    else setFontsReady(true);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const goal = targetRef.current;
      const gap = goal - value.current;
      // Ease towards the goal; faster when the final milestone is reached.
      const speed = goal === 100 ? 4.5 : 1.4;
      value.current = Math.min(goal, value.current + Math.max(gap * speed * dt, goal === 100 ? 0 : 0.02));
      const shown = Math.floor(value.current);
      setPercent((p) => (p === shown ? p : shown));
      if (value.current >= 99.5) {
        setPercent(100);
        window.setTimeout(() => setVisible(false), 450);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="loader"
          className="blush-hero fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 text-center"
          exit={{ opacity: 0, transition: { duration: 1.0, ease: [0.65, 0, 0.35, 1] } }}
          role="progressbar"
          aria-label="Loading the wedding invitation"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          {/* Kolam texture and inner double frame */}
          <div className="kolam-overlay" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-4 border border-gold/50 sm:inset-8" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-[22px] border border-petal sm:inset-[38px]" aria-hidden="true" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 -z-10 rounded-full bg-[#FFE7C2]/80 blur-2xl"
                animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Crest className="h-16 w-24 sm:h-20 sm:w-28" />
            </div>

            <p className="eyebrow mt-6 text-gold-dark">{wedding.invitation.blessing}</p>
            <p className="display-names gold-foil mt-3 pb-1 text-[clamp(2.6rem,1.8rem+4vw,4.4rem)]">{wedding.couple.short}</p>

            <div className="numeral gold-foil mt-8 text-[clamp(3rem,2.2rem+3.5vw,4.6rem)] font-semibold leading-none" aria-hidden="true">
              {percent}
              <span className="ml-1 align-top text-[0.42em]">%</span>
            </div>

            {/* Gold progress line with a travelling glint */}
            <div className="relative mt-6 h-px w-[min(18rem,70vw)] bg-petal" aria-hidden="true">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-dark via-gold-light to-gold"
                style={{ width: `${percent}%`, transition: 'width 120ms linear' }}
              />
              <div
                className="absolute -top-[3px] h-[7px] w-[7px] -translate-x-1/2 rotate-45 bg-gold shadow-[0_0_12px_rgba(217,188,133,0.95)]"
                style={{ left: `${percent}%`, transition: 'left 120ms linear' }}
              />
              <span className="absolute -left-1 -top-[3px] h-[7px] w-[7px] rotate-45 border border-gold/70" />
              <span className="absolute -right-1 -top-[3px] h-[7px] w-[7px] rotate-45 border border-gold/70" />
            </div>

            <p className="mt-5 font-caps text-[0.72rem] uppercase tracking-[0.32em] text-burgundy">
              Loading invitation
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
