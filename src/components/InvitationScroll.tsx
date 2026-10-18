import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { wedding } from '../config/wedding';
import { Crest, Divider } from './Ornaments';

interface Props {
  /** 'hidden' before the mandapam, 'unfold' to animate, 'open' to show instantly. */
  mode: 'hidden' | 'unfold' | 'open';
  reducedMotion: boolean;
  tilt: boolean;
}

const EASE = [0.65, 0, 0.35, 1] as const;

/**
 * Scene 4: the ivory parchment that unrolls in the mandapam.
 * Real DOM text (selectable, screen-reader friendly) on a paper object given
 * depth by perspective, rollers, lamp-lit gradient and a cast shadow.
 */
export function InvitationScroll({ mode, reducedMotion, tilt }: Props) {
  const instant = mode === 'open' || reducedMotion;
  const unfold = instant ? 0 : 1.9;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-3.5, 3.5]), { stiffness: 60, damping: 18 });
  const rotX = useSpring(useTransform(my, [-1, 1], [5.5, 1.5]), { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (!tilt || mode === 'hidden') return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [tilt, mode, mx, my]);

  if (mode === 'hidden') return null;

  const item = (i: number) =>
    instant
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 10, filter: 'blur(3px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.9, delay: unfold * 0.55 + i * 0.32, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="relative z-10 mx-auto w-full max-w-[34rem] px-3 sm:px-0" style={{ perspective: '1400px' }}>
      {/* Golden light pooling behind the parchment. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,199,107,0.42),rgba(255,199,107,0)_70%)] blur-xl"
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6 }}
      />
      <motion.div
        className="relative"
        style={{ rotateX: tilt ? rotX : 3, rotateY: tilt ? rotY : 0, transformStyle: 'preserve-3d' }}
        initial={instant ? false : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Cast shadow on the mandapam floor. */}
        <div
          aria-hidden="true"
          className="absolute -bottom-10 left-1/2 h-10 w-[85%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-xl"
        />

        {/* Rollers travel from the centre seam to the edges as it unrolls. */}
        <Roller position="top" unfold={unfold} />
        <Roller position="bottom" unfold={unfold} />

        <motion.article
          aria-labelledby="scroll-names"
          className="paper gold-frame relative overflow-hidden px-6 pb-9 pt-9 text-center shadow-[0_30px_60px_-25px_rgba(0,0,0,0.75),0_0_0_1px_rgba(157,121,87,0.25)] sm:px-12 sm:pb-11 sm:pt-11"
          initial={instant ? false : { clipPath: 'inset(49.5% 0% 49.5% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: unfold, ease: EASE, delay: instant ? 0 : 0.35 }}
        >
          {/* Lamp-light falloff across the paper. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(255,214,150,0.28),transparent_70%)]"
          />
          <motion.div {...item(0)}>
            <Crest className="mx-auto h-10 w-16 sm:h-12 sm:w-20" />
            <p className="eyebrow mt-3 text-burgundy/85">{wedding.invitation.blessing}</p>
          </motion.div>
          <motion.h2
            id="scroll-names"
            className="display-names mt-4 text-[clamp(2.6rem,1.8rem+4vw,4.4rem)] text-burgundy"
            {...item(1)}
          >
            {wedding.couple.groomShort} <span className="not-italic text-gold-dark">&amp;</span> {wedding.couple.brideShort}
          </motion.h2>
          <motion.p
            className="mx-auto mt-3 max-w-[24rem] font-body text-[clamp(1.05rem,0.98rem+0.35vw,1.22rem)] italic leading-relaxed text-burgundy/90"
            {...item(2)}
          >
            {wedding.invitation.request}
          </motion.p>
          <motion.div {...item(3)}>
            <Divider className="mx-auto my-5 h-5 w-52 sm:w-64" />
            <p className="eyebrow text-burgundy">{wedding.ceremony.heading}</p>
            <p className="mt-2 font-caps text-[1.05rem] tracking-[0.06em] text-burgundy">{wedding.dateLabel}</p>
            <p className="mt-1 text-burgundy/90">
              <span className="font-caps text-[0.85rem] uppercase tracking-[0.16em]">{wedding.ceremony.timeLabel}</span>{' '}
              <span aria-hidden="true">·</span> {wedding.ceremony.timeRange}
            </p>
            <p className="mt-2 font-display text-[1.25rem] font-semibold leading-snug text-burgundy">
              {wedding.ceremony.venue.name}
            </p>
            <p className="text-[0.98rem] text-burgundy/85">{wedding.ceremony.venue.addressLines[0]}</p>
          </motion.div>
          <motion.div className="mt-6 flex flex-col items-center gap-2" {...item(4)}>
            <a href="#rsvp" className="btn-primary">
              Confirm Your Presence
            </a>
            <a
              href="#ceremony"
              className="inline-flex min-h-[48px] flex-col items-center justify-center gap-1 px-4 font-caps text-[0.72rem] uppercase tracking-[0.24em] text-burgundy/80 hover:text-burgundy"
            >
              Scroll down
              <motion.span
                aria-hidden="true"
                animate={reducedMotion ? undefined : { y: [0, 5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown size={20} />
              </motion.span>
            </a>
          </motion.div>
        </motion.article>
      </motion.div>
    </div>
  );
}

function Roller({ position, unfold }: { position: 'top' | 'bottom'; unfold: number }) {
  const isTop = position === 'top';
  const from = { [isTop ? 'top' : 'bottom']: '50%' };
  const to = { [isTop ? 'top' : 'bottom']: '0%' };
  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute -left-3 -right-3 z-10 h-4 sm:-left-4 sm:-right-4 sm:h-[18px] ${
        isTop ? '-translate-y-1/2' : 'translate-y-1/2'
      }`}
      initial={unfold ? from : false}
      animate={to}
      style={unfold ? undefined : to}
      transition={{ duration: unfold, ease: EASE, delay: unfold ? 0.35 : 0 }}
    >
      <div className="roller h-full w-full rounded-full" />
      <div className="roller-cap absolute -left-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full sm:h-7 sm:w-7" />
      <div className="roller-cap absolute -right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full sm:h-7 sm:w-7" />
    </motion.div>
  );
}
