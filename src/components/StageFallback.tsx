import { motion } from 'framer-motion';
import type { Phase, SequenceTimings } from '../hooks/useInvitationSequence';

interface Props {
  phase: Phase;
  skipped: boolean;
  reducedMotion: boolean;
  timings: SequenceTimings;
}

/**
 * Layered, illustrated temple for devices without WebGL (or with very little
 * memory). Same story — entrance, doors parting, passage to the mandapam —
 * with SVG and CSS transforms only.
 */
export function StageFallback({ phase, skipped, reducedMotion, timings }: Props) {
  const opened = phase !== 'intro';
  const inside = skipped || phase === 'mandapam' || phase === 'invitation' || phase === 'details';
  const doorDur = reducedMotion ? 0.3 : timings.doorsEnd;
  const travelDur = reducedMotion ? 0.3 : timings.travelEnd - timings.travelStart;

  return (
    <div className="absolute inset-0 overflow-hidden bg-stone" aria-hidden="true">
      {/* Interior: pillared hall glowing with lamps. */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: inside ? 1 : 0, scale: inside ? 1 : 1.08 }}
        transition={{ duration: skipped ? 0 : 1.2, ease: 'easeOut' }}
      >
        <Interior />
      </motion.div>

      {/* Exterior: gopuram at pre-dawn. Zooms into the doorway when opened. */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: '50% 80%' }}
        initial={false}
        animate={{ scale: opened && !reducedMotion ? 3.2 : 1, opacity: inside ? 0 : 1 }}
        transition={{
          scale: { duration: travelDur, delay: reducedMotion ? 0 : timings.travelStart, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: skipped ? 0 : 0.9 },
        }}
      >
        <Exterior opened={opened} doorDur={doorDur} />
      </motion.div>
    </div>
  );
}

function Exterior({ opened, doorDur }: { opened: boolean; doorDur: number }) {
  const tiers = Array.from({ length: 6 }, (_, i) => {
    const half = 132 - i * 17;
    const y0 = 318 - i * 34;
    return { half, y0, y1: y0 - 34, i };
  });
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0d1c" />
          <stop offset="0.45" stopColor="#231c33" />
          <stop offset="0.72" stopColor="#6b3b3a" />
          <stop offset="0.86" stopColor="#c27a4b" />
        </linearGradient>
        <linearGradient id="fb-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2f27" />
          <stop offset="1" stopColor="#8a6d52" />
        </linearGradient>
        <linearGradient id="fb-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a1f10" />
          <stop offset="0.5" stopColor="#5e3520" />
          <stop offset="1" stopColor="#3a1f10" />
        </linearGradient>
        <radialGradient id="fb-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd28a" stopOpacity="1" />
          <stop offset="0.5" stopColor="#ffb24f" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffb24f" stopOpacity="0" />
        </radialGradient>
        <pattern id="fb-studs" width="9" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="8" r="1.3" fill="#d6a956" />
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#fb-sky)" />
      {/* Palms */}
      {[28, 372].map((x, k) => (
        <g key={x} fill="#120d0c" transform={`translate(${x} 470) scale(${k ? -1 : 1} 1)`}>
          <path d="M0 0 C 4 -60 10 -120 18 -170 L 22 -170 C 15 -120 9 -60 6 0 Z" />
          {[-60, -25, 10, 45, 80, 120, 160].map((a) => (
            <path key={a} d="M20 -170 q 30 -6 55 18 q -30 -10 -55 -14z" transform={`rotate(${a} 20 -170)`} />
          ))}
        </g>
      ))}
      {/* Prakaram walls */}
      <rect x="0" y="420" width="400" height="80" fill="#2a211c" />
      {/* Gopuram tiers */}
      {tiers.map(({ half, y0, y1, i }) => (
        <g key={i}>
          <path d={`M${200 - half} ${y0} L${200 - half + 6} ${y1} L${200 + half - 6} ${y1} L${200 + half} ${y0} Z`} fill="url(#fb-stone)" />
          <rect x={200 - half - 3} y={y1 - 3} width={half * 2 + 6} height="5" fill="#9d7957" opacity="0.55" />
          {Array.from({ length: Math.floor(half / 11) }, (_, k) => {
            const x = 200 - half + 10 + k * 22;
            return <rect key={k} x={x} y={y1 - 11} width={k % 2 ? 12 : 8} height={8} rx={k % 2 ? 4 : 2} fill="#6e5643" />;
          })}
          {[-half / 2, 0, half / 2].map((dx) => (
            <rect key={dx} x={200 + dx - 7} y={y0 - 25} width="14" height="16" rx="7" fill="#1d1612" opacity="0.8" />
          ))}
        </g>
      ))}
      <path d="M150 114 Q 200 70 250 114 Z" fill="#5a4636" />
      {[-24, -12, 0, 12, 24].map((dx) => (
        <path key={dx} d={`M${200 + dx} 74 c 4 6 4 10 0 16 c -4 -6 -4 -10 0 -16z`} fill="#d8b064" />
      ))}
      {/* Base wall with doorway */}
      <rect x="62" y="318" width="276" height="182" fill="url(#fb-stone)" />
      <rect x="56" y="314" width="288" height="8" fill="#9d7957" opacity="0.7" />
      <rect x="160" y="378" width="80" height="122" fill="#1a120e" />
      <rect x="152" y="370" width="96" height="8" fill="#9d7957" />
      <rect x="152" y="370" width="8" height="130" fill="#9d7957" />
      <rect x="240" y="370" width="8" height="130" fill="#9d7957" />
      {/* Light from inside */}
      <motion.ellipse
        cx="200"
        cy="440"
        rx="60"
        ry="80"
        fill="url(#fb-glow)"
        initial={false}
        animate={{ opacity: opened ? 1 : 0.35, scale: opened ? 1.6 : 1 }}
        transition={{ duration: doorDur }}
        style={{ transformOrigin: '200px 440px' }}
      />
      {/* Doors: scaleX approximates the leaves swinging inward. */}
      <motion.g
        initial={false}
        animate={{ scaleX: opened ? 0.1 : 1 }}
        transition={{ duration: doorDur, ease: [0.45, 0, 0.55, 1] }}
        style={{ transformOrigin: '160px 440px', transformBox: 'view-box' }}
      >
        <rect x="160" y="378" width="39.5" height="122" fill="url(#fb-wood)" />
        <rect x="160" y="378" width="39.5" height="122" fill="url(#fb-studs)" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ scaleX: opened ? 0.1 : 1 }}
        transition={{ duration: doorDur, ease: [0.45, 0, 0.55, 1] }}
        style={{ transformOrigin: '240px 440px', transformBox: 'view-box' }}
      >
        <rect x="200.5" y="378" width="39.5" height="122" fill="url(#fb-wood)" />
        <rect x="200.5" y="378" width="39.5" height="122" fill="url(#fb-studs)" />
      </motion.g>
      {/* Lamps */}
      {[128, 272].map((x) => (
        <g key={x}>
          <circle cx={x} cy={452} r="22" fill="url(#fb-glow)" />
          <path d={`M${x - 8} 500 h16 l-5 -10 h-6 z M${x - 1.5} 490 v-34 h3 v34z M${x - 10} 456 h20 l-4 4 h-12z`} fill="#c99a45" />
          <path d={`M${x} 446 c 2 3 2 5 0 8 c -2 -3 -2 -5 0 -8z`} fill="#ffe2a3" />
        </g>
      ))}
      <rect x="0" y="500" width="400" height="100" fill="#3a2e26" />
      <rect x="120" y="500" width="160" height="8" fill="#6e5643" />
    </svg>
  );
}

function Interior() {
  const pillars = [0, 1, 2, 3];
  return (
    <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_55%,#8a4d22_0%,#3a2015_45%,#140c09_100%)]">
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,#2a1a12,#4a3020)]" />
      {pillars.map((i) => {
        const scale = 1 - i * 0.2;
        const offset = 3 + i * 9;
        return (
          <div key={i}>
            {[0, 1].map((side) => (
              <div
                key={side}
                className="absolute bg-[linear-gradient(90deg,#1c130e,#5e4634_45%,#2b1e16)]"
                style={{
                  ...(side ? { right: `${offset}%` } : { left: `${offset}%` }),
                  width: `${9 * scale}%`,
                  height: `${88 * scale}%`,
                  bottom: `${34 - 22 * scale}%`,
                  opacity: 0.55 + scale * 0.45,
                  boxShadow: 'inset 0 -40px 60px rgba(255,170,80,0.18)',
                }}
              />
            ))}
          </div>
        );
      })}
      <div className="absolute left-1/2 top-[48%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#d8b064]/60 [clip-path:inset(0_0_35%_0)]" />
      <div className="absolute left-1/2 top-[50%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,199,107,0.45),transparent)]" />
    </div>
  );
}
