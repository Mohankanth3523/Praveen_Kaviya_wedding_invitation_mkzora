import { useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { CornerFlorals, DoorLeaf, Facade, Garlands, Interior, KuthuVilakku, Lantern, PEDIMENT_MASK, Wing } from './PalaceArt';
import { archCurve } from './palaceGeometry';
import { PetalField } from '../PetalField';

/**
 * Scene A — the royal palace entrance.
 *
 * Layers, back to front (each moves at its own rate for parallax):
 *   sky glow → side wings → central facade + lights + doors → garlands and
 *   kuthu vilakku lamps → corner florals → drifting jasmine.
 *
 * Choreography (full motion):
 *   on arrival  the camera eases in towards the doors; lanterns and lamps light
 *               one after another; warm light gathers behind the doors; the
 *               gilded pediment catches the light; a wave of jasmine drifts by.
 *   on "open"   both rosewood doors swing inward; light pours out; the camera
 *               travels through the doorway into the radiant hall beyond; the
 *               screen fills with soft ivory light, ready for the photographs.
 *
 * Reduced motion: no camera moves, parallax or petals — the lamps are lit,
 * and the doors simply fade open.
 */

interface Props {
  open: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  /** Seconds from "open" until the next scene takes over. */
  duration: number;
  eyebrow: ReactNode;
  action: ReactNode;
}

/** Where the doors sit inside the 600 × 900 palace (percentages of the stage box). */
const DOORWAY = { left: '33.3333%', width: '33.3333%', top: '46.4444%', height: '38%' } as const;
const CAMERA_ORIGIN = '50% 65%';

export function PalaceEntrance({ open, reducedMotion, mobile, duration: d, eyebrow, action }: Props) {
  const still = reducedMotion;

  // Pointer parallax (desktop mouse only).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (still || mobile) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [still, mobile, mx, my]);

  const wing = useParallax(sx, sy, 5);
  const arch = useParallax(sx, sy, 9);
  const front = useParallax(sx, sy, 20);
  const corner = useParallax(sx, sy, 30);

  const swing = still ? { duration: 0.4 } : { duration: d * 0.5, delay: 0.1, ease: [0.55, 0.05, 0.3, 1] as const };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden pt-[4.25rem]">
      <div className="palace-sky pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 isolate" aria-hidden="true">
        <PetalField depth={!mobile} />
      </div>
      {eyebrow}

      {/* The stage box: 600 × 900 palace units, as large as the screen allows. */}
      <motion.div
        className="relative mt-3 aspect-[2/3] w-[min(104vw,calc((100svh_-_8rem)_*_0.6667),46rem)] shrink-0 sm:w-[min(94vw,calc((100svh_-_8rem)_*_0.6667),46rem)]"
        style={{ transformOrigin: CAMERA_ORIGIN }}
        initial={still ? false : { scale: 0.93, y: 16 }}
        animate={open && !still ? { scale: 3.2, y: 0 } : { scale: 1, y: 0 }}
        transition={open ? { duration: d * 0.7, delay: d * 0.27, ease: [0.7, 0, 0.84, 0] } : { duration: 6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Side wings extend the facade beyond the screen edges */}
        <motion.div className="pointer-events-none absolute inset-y-0 right-full w-[150%]" style={{ x: wing.x, y: wing.y }} aria-hidden="true">
          <Wing />
        </motion.div>
        <motion.div className="pointer-events-none absolute inset-y-0 left-full w-[150%]" style={{ x: wing.x, y: wing.y }} aria-hidden="true">
          <Wing mirrored />
        </motion.div>

        {/* Central facade, the doorway and its light */}
        <motion.div className="palace-facade absolute inset-0" style={{ x: arch.x, y: arch.y }} aria-hidden="true">
          <Facade />

          <div className="absolute overflow-hidden" style={{ ...DOORWAY, perspective: '700px' }}>
            <Interior />
            {open && (
              <motion.div
                className="portal-light absolute inset-0 mix-blend-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: still ? 0.4 : d * 0.5, delay: still ? 0 : d * 0.15 }}
              />
            )}
            {(['left', 'right'] as const).map((side) => (
              <motion.div
                key={side}
                className={`absolute inset-y-0 w-1/2 ${side === 'left' ? 'left-0' : 'right-0'}`}
                style={{ transformOrigin: `${side} center`, transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                initial={false}
                animate={
                  still ? { opacity: open ? 0 : 1 } : { rotateY: open ? (side === 'left' ? 84 : -84) : 0 }
                }
                transition={swing}
              >
                <DoorLeaf mirrored={side === 'right'} />
                {open && !still && (
                  <motion.div className="absolute inset-0 bg-[#1E0D0A]" initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={swing} />
                )}
              </motion.div>
            ))}
          </div>

          <Lights open={open} still={still} d={d} />

          {/* Gilded pediment catches the light */}
          {!still && (
            <div
              className="palace-shimmer absolute"
              style={{ left: '16%', width: '68%', top: '6.8889%', height: '15.3333%', WebkitMaskImage: PEDIMENT_MASK, maskImage: PEDIMENT_MASK, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }}
            />
          )}

          {/* Light spilling out of the doorway towards the viewer */}
          <motion.div
            className="palace-rays pointer-events-none absolute left-[8%] top-[40%] h-[62%] w-[84%]"
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: open ? 1 : 0.32 }}
            transition={open ? { duration: d * 0.4, delay: d * 0.15 } : { duration: 2, delay: 2.2 }}
          />
        </motion.div>

        {/* Foreground: garlands and the tall kuthu vilakku lamps */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ x: front.x, y: front.y, transformOrigin: CAMERA_ORIGIN }}
          initial={still ? false : { scale: 1.07 }}
          animate={open && !still ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={open ? { duration: d * 0.5, delay: d * 0.3, ease: 'easeIn' } : { duration: 6, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <Garlands />
          <KuthuVilakku className="absolute left-[-1.13%] top-[62.4%] h-[37.1%] w-[17.6%]" delay={1.2} reducedMotion={still} />
          <KuthuVilakku className="absolute left-[83.53%] top-[62.4%] h-[37.1%] w-[17.6%]" delay={1.5} reducedMotion={still} />
        </motion.div>

        {/* The invitation button rests on the palace steps */}
        <div className="absolute inset-x-0 bottom-[1.6%] z-10 flex justify-center">{action}</div>
      </motion.div>

      {/* Floral arrangements framing the lower corners */}
      {(['left', 'right'] as const).map((side) => (
        <motion.div
          key={side}
          className={`pointer-events-none absolute bottom-0 hidden w-[clamp(6rem,16vw,15rem)] sm:block ${side === 'left' ? 'left-0' : 'right-0'}`}
          style={{ x: corner.x, y: corner.y }}
          aria-hidden="true"
        >
          <motion.div
            initial={still ? false : { opacity: 0, y: 30 }}
            animate={open && !still ? { opacity: 0, y: 40, x: side === 'left' ? -60 : 60, scale: 1.15 } : { opacity: 1, y: 0, x: 0, scale: 1 }}
            transition={open ? { duration: d * 0.45, ease: 'easeIn' } : { duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={side === 'right' ? { scaleX: -1 } : undefined}
          >
            <CornerFlorals className="block h-auto w-full" />
          </motion.div>
        </motion.div>
      ))}

      {!still && <JasmineWave open={open} d={d} />}

      {/* The camera passes into pure light before the photographs appear */}
      {open && (
        <motion.div
          className="palace-flood pointer-events-none fixed inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: still ? 0.3 : d * 0.34, delay: still ? 0.1 : d * 0.64, ease: 'easeIn' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function useParallax(sx: MotionValue<number>, sy: MotionValue<number>, amount: number) {
  const x = useTransform(sx, (v: number) => v * -amount);
  const y = useTransform(sy, (v: number) => v * -amount * 0.5);
  return { x, y };
}

/** Lanterns, warm light seeping around the closed doors, and its reflection on the marble. */
function Lights({ open, still, d }: { open: boolean; still: boolean; d: number }) {
  const seep = { duration: 1.8, delay: still ? 0 : 1.9 };
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 900" focusable="false" aria-hidden="true">
      <defs>
        <radialGradient id="palace-tymp-glow" cx="300" cy="412" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity=".95" />
          <stop offset=".6" stopColor="#FFD99A" stopOpacity=".45" />
          <stop offset="1" stopColor="#FFD99A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="palace-floor-glow" cx="300" cy="772" r="150" gradientTransform="translate(0 540) scale(1 .3)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE9BF" stopOpacity=".95" />
          <stop offset="1" stopColor="#FFE9BF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Lantern cx={150} top={316} delay={0.5} reducedMotion={still} />
      <Lantern cx={450} top={316} delay={0.8} reducedMotion={still} />

      {/* Light through the jaali tympanum */}
      <motion.path
        d={`${archCurve(300, 412, 98, 96)}Z`}
        fill="url(#palace-tymp-glow)"
        style={{ mixBlendMode: 'screen' }}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: open ? 1 : 0.8 }}
        transition={seep}
      />
      {/* Thin line of light where the doors meet, and beneath them */}
      <motion.g initial={still ? false : { opacity: 0 }} animate={{ opacity: open ? 0 : 1 }} transition={open ? { duration: 0.4 } : seep}>
        <rect x="298.4" y="420" width="3.2" height="338" fill="#FFF3D2" />
        <rect x="296" y="420" width="8" height="338" fill="#FFE2A6" opacity=".35" />
        <rect x="204" y="754" width="192" height="4" fill="#FFE8B8" opacity=".9" />
      </motion.g>
      {/* Reflection on the polished platform and steps */}
      <motion.ellipse
        cx="300"
        cy="772"
        rx="150"
        ry="45"
        fill="url(#palace-floor-glow)"
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: open ? 1 : 0.55 }}
        transition={open ? { duration: d * 0.4, delay: d * 0.15 } : seep}
      />
    </svg>
  );
}

const WAVE = [
  { top: 18, size: 16, dur: 7.2, delay: 1.6, rot: 520, dy: 34 },
  { top: 30, size: 12, dur: 8.4, delay: 1.9, rot: 400, dy: 26 },
  { top: 10, size: 14, dur: 7.8, delay: 2.3, rot: 610, dy: 40 },
  { top: 42, size: 18, dur: 6.6, delay: 2.6, rot: 470, dy: 22 },
  { top: 24, size: 11, dur: 9, delay: 2.9, rot: 380, dy: 30 },
  { top: 6, size: 13, dur: 8, delay: 3.3, rot: 560, dy: 46 },
  { top: 36, size: 15, dur: 7.4, delay: 3.6, rot: 440, dy: 28 },
  { top: 52, size: 12, dur: 8.6, delay: 4, rot: 500, dy: 18 },
];
const BURST = [
  { a: -150, r: 70 },
  { a: -110, r: 80 },
  { a: -70, r: 78 },
  { a: -30, r: 72 },
  { a: 10, r: 68 },
  { a: 160, r: 66 },
  { a: 200, r: 74 },
  { a: 50, r: 60 },
  { a: 130, r: 62 },
];

const PETAL_COLOURS = [
  ['#FFFDF8', '#E8D9BE'],
  ['#F6A5C0', '#E07FA0'],
  ['#F5891B', '#D9661A'],
  ['#FFC23A', '#E9A21A'],
] as const;

function JasminePetal({ size, tone = 0 }: { size: number; tone?: number }) {
  const [fill, stroke] = PETAL_COLOURS[tone % PETAL_COLOURS.length] ?? PETAL_COLOURS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 1c3 4 3 9 0 18-3-9-3-14 0-18z" fill={fill} stroke={stroke} strokeWidth=".6" />
    </svg>
  );
}

/** One gentle wave of jasmine across the entrance, and a burst towards the camera as the doors open. */
function JasmineWave({ open, d }: { open: boolean; d: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {WAVE.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-0"
          style={{ top: `${p.top}%` }}
          initial={{ x: '-8vw', y: 0, rotate: 0, opacity: 0 }}
          animate={{ x: '108vw', y: `${p.dy}vh`, rotate: p.rot, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'linear', opacity: { duration: p.dur, delay: p.delay, times: [0, 0.1, 0.85, 1] } }}
        >
          <JasminePetal size={p.size} tone={i} />
        </motion.span>
      ))}
      {open &&
        BURST.map((p, i) => {
          const rad = (p.a * Math.PI) / 180;
          return (
            <motion.span
              key={`b${i}`}
              className="absolute left-1/2 top-[62%]"
              initial={{ x: 0, y: 0, scale: 0.6, opacity: 0, rotate: 0 }}
              animate={{ x: `${Math.cos(rad) * p.r}vmin`, y: `${Math.sin(rad) * p.r}vmin`, scale: 3, opacity: [0, 1, 0], rotate: 260 }}
              transition={{ duration: d * 0.6, delay: d * 0.2 + i * 0.04, ease: 'easeOut' }}
            >
              <JasminePetal size={14} tone={i} />
            </motion.span>
          );
        })}
    </div>
  );
}
