import { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * Scene A artwork: a carved South Indian temple doorway with brass lamps and a
 * jasmine-and-rose garland. Pure SVG + CSS transforms (no WebGL).
 *
 * `open` swings the two teak leaves inward on their outer hinges with real
 * perspective, while warm light spills through the widening gap.
 */
export function TempleDoors({ open, reducedMotion, duration }: { open: boolean; reducedMotion: boolean; duration: number }) {
  const swing = reducedMotion ? { duration: 0.01 } : { duration, ease: [0.65, 0, 0.35, 1] as const };
  return (
    <div className="temple-portal relative mx-auto aspect-[400/560] w-full" aria-hidden="true">
      {/* Stone archway with gopuram crown */}
      <Archway />

      {/* Doorway opening (the space the leaves cover) */}
      <div className="absolute left-[17%] right-[17%] top-[27%] bottom-[6%] overflow-hidden rounded-t-[46%_18%]">
        {/* Warm sanctum light behind the doors */}
        <motion.div
          className="portal-light absolute inset-0"
          initial={false}
          animate={{ opacity: open ? 1 : 0.18 }}
          transition={reducedMotion ? { duration: 0.2 } : { duration: duration * 0.9, ease: 'easeOut' }}
        />
        <div className="absolute inset-0" style={{ perspective: '1100px' }}>
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            initial={false}
            animate={{ rotateY: open ? (reducedMotion ? 0 : -104) : 0, opacity: open && reducedMotion ? 0 : 1 }}
            transition={swing}
          >
            <DoorLeaf />
          </motion.div>
          <motion.div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
            initial={false}
            animate={{ rotateY: open ? (reducedMotion ? 0 : 104) : 0, opacity: open && reducedMotion ? 0 : 1 }}
            transition={swing}
          >
            <DoorLeaf mirrored />
          </motion.div>
        </div>
      </div>

      {/* Lens flare at the moment the light breaks through */}
      {!reducedMotion && (
        <motion.div
          className="lens-flare pointer-events-none absolute left-1/2 top-[52%] h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={open ? { opacity: [0, 0.95, 0.35], scale: [0.6, 1.15, 1] } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: duration * 0.9, delay: duration * 0.25, times: [0, 0.5, 1] }}
        />
      )}

      <Garland />
      <BrassLamp className="absolute bottom-[1%] left-[-2%] h-[34%] w-[16%]" />
      <BrassLamp className="absolute bottom-[1%] right-[-2%] h-[34%] w-[16%]" />
    </div>
  );
}

function Archway() {
  const uid = useId().replace(/:/g, '');
  const stone = `stone-${uid}`;
  const goldLine = `gold-line-${uid}`;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 560" preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id={stone} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF9F1" />
          <stop offset="1" stopColor="#F3E3D3" />
        </linearGradient>
        <linearGradient id={goldLine} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8F6A31" />
          <stop offset=".5" stopColor="#D9BC85" />
          <stop offset="1" stopColor="#8F6A31" />
        </linearGradient>
      </defs>
      {/* Gopuram tiers */}
      <g fill={`url(#${stone})`} stroke={`url(#${goldLine})`} strokeWidth="1.4">
        <path d="M150 52h100l-8 22H158z" />
        <path d="M128 74h144l-8 24H136z" />
        <path d="M106 98h188l-8 26H114z" />
        <path d="M178 52c4-18 12-30 22-36 10 6 18 18 22 36z" />
      </g>
      <circle cx="200" cy="12" r="5" fill="#B58A45" />
      {/* Kalasam finials */}
      <g fill="#B58A45">
        <path d="M150 52c0-7 4-11 8-11s8 4 8 11z" opacity=".85" />
        <path d="M234 52c0-7 4-11 8-11s8 4 8 11z" opacity=".85" />
      </g>
      {/* Pillared frame */}
      <path
        d="M30 556V176c0-30 40-52 170-52s170 22 170 52v380h-38V196c0-20-30-34-132-34S68 176 68 196v360z"
        fill={`url(#${stone})`}
        stroke={`url(#${goldLine})`}
        strokeWidth="1.6"
      />
      {/* Carved bands on the pillars */}
      <g fill="none" stroke="#B58A45" strokeOpacity=".55" strokeWidth="1">
        {[230, 300, 370, 440, 510].map((y) => (
          <g key={y}>
            <path d={`M34 ${y}h30M336 ${y}h30`} />
            <path d={`M49 ${y - 14}c6 7 6 14 0 20-6-6-6-13 0-20zM351 ${y - 14}c6 7 6 14 0 20-6-6-6-13 0-20z`} fill="#F5D3DF" fillOpacity=".5" />
          </g>
        ))}
        {/* Arch scallops */}
        <path d="M68 196c20-18 60-30 132-30s112 12 132 30" strokeOpacity=".7" />
        <path d="M80 184c24-14 64-22 120-22s96 8 120 22" strokeOpacity=".4" />
      </g>
      {/* Threshold */}
      <path d="M22 552h356v8H22z" fill="#EAD6C1" stroke="#B58A45" strokeWidth="1" />
    </svg>
  );
}

function DoorLeaf({ mirrored = false }: { mirrored?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const teak = `teak-${uid}`;
  const brass = `brass-${uid}`;
  const studs: Array<[number, number]> = [];
  for (let row = 0; row < 9; row += 1) for (let col = 0; col < 3; col += 1) studs.push([38 + col * 62, 46 + row * 52]);
  return (
    <svg
      className="door-leaf h-full w-full"
      viewBox="0 0 200 520"
      preserveAspectRatio="none"
      focusable="false"
      style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id={teak} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5E3522" />
          <stop offset=".55" stopColor="#7A4A2E" />
          <stop offset="1" stopColor="#4E2B1B" />
        </linearGradient>
        <radialGradient id={brass} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#FFF0C9" />
          <stop offset=".45" stopColor="#D9B46A" />
          <stop offset="1" stopColor="#7D5A28" />
        </radialGradient>
      </defs>
      <rect width="200" height="520" fill={`url(#${teak})`} />
      {/* Gold border strip */}
      <rect x="4" y="4" width="192" height="512" fill="none" stroke="#C9A15F" strokeWidth="3" />
      {/* Carved panels */}
      {[
        [18, 24, 164, 132],
        [18, 172, 164, 176],
        [18, 364, 164, 132],
      ].map(([x, y, w, h]) => (
        <g key={y}>
          <rect x={x} y={y} width={w} height={h} rx="6" fill="none" stroke="#3A1F13" strokeWidth="3" />
          <rect x={(x ?? 0) + 6} y={(y ?? 0) + 6} width={(w ?? 0) - 12} height={(h ?? 0) - 12} rx="4" fill="none" stroke="#A8744C" strokeOpacity=".7" />
          {/* Lotus medallion */}
          <g transform={`translate(${(x ?? 0) + (w ?? 0) / 2} ${(y ?? 0) + (h ?? 0) / 2})`} fill="none" stroke="#D9B46A" strokeWidth="1.4">
            <circle r="20" />
            <path d="M0-16c6 7 6 16 0 24-6-8-6-17 0-24zM-16 2c8-2 14 0 16 6-8 2-14 0-16-6zM16 2c-8-2-14 0-16 6 8 2 14 0 16-6z" fill="#D9B46A" fillOpacity=".25" />
          </g>
        </g>
      ))}
      {/* Brass bosses */}
      {studs.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.2" fill={`url(#${brass})`} />
      ))}
      {/* Ring handle on the meeting edge */}
      <g transform="translate(184 262)">
        <circle r="9" fill={`url(#${brass})`} />
        <circle cy="16" r="13" fill="none" stroke="#D9B46A" strokeWidth="3" />
      </g>
    </svg>
  );
}

function Garland() {
  const beads = (y0: number, sag: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return { x: 40 + t * 320, y: y0 + Math.sin(t * Math.PI) * sag, rose: i % 5 === 2 };
    });
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-[19%] h-[16%] w-full" viewBox="0 0 400 90" preserveAspectRatio="none" focusable="false">
      {[beads(8, 46, 33), beads(4, 30, 27)].map((row, k) => (
        <g key={k}>
          {row.map((b, i) => (
            <circle
              key={i}
              cx={b.x}
              cy={b.y}
              r={b.rose ? 4.6 : 3.4}
              fill={b.rose ? '#EBA6BC' : '#FFFDF8'}
              stroke={b.rose ? '#D68AA3' : '#E8D9BE'}
              strokeWidth=".8"
            />
          ))}
        </g>
      ))}
      {/* Hanging strands */}
      {[60, 120, 200, 280, 340].map((x) => (
        <g key={x}>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={x} cy={22 + i * 8 + (x === 200 ? 28 : 12)} r="2.6" fill="#FFFDF8" stroke="#E8D9BE" strokeWidth=".7" />
          ))}
          <circle cx={x} cy={(x === 200 ? 28 : 12) + 56} r="3.4" fill="#EBA6BC" stroke="#D68AA3" strokeWidth=".7" />
        </g>
      ))}
    </svg>
  );
}

function BrassLamp({ className = '' }: { className?: string }) {
  const grad = `lamp-brass-${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} viewBox="0 0 60 190" focusable="false">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7D5A28" />
          <stop offset=".5" stopColor="#E3C27E" />
          <stop offset="1" stopColor="#7D5A28" />
        </linearGradient>
      </defs>
      {/* Flame with glow */}
      <g className="lamp-flame" style={{ transformOrigin: '30px 34px' }}>
        <ellipse cx="30" cy="22" rx="16" ry="20" fill="#FFE2A8" opacity=".45" />
        <path d="M30 6c6 8 7 16 0 26-7-10-6-18 0-26z" fill="#FFC56B" />
        <path d="M30 14c3 5 3 10 0 16-3-6-3-11 0-16z" fill="#FFF6DD" />
      </g>
      <g fill={`url(#${grad})`}>
        <path d="M14 36h32c-2 8-8 12-16 12s-14-4-16-12z" />
        <rect x="27" y="48" width="6" height="96" />
        <ellipse cx="30" cy="70" rx="7" ry="4" />
        <ellipse cx="30" cy="100" rx="9" ry="5" />
        <ellipse cx="30" cy="128" rx="7" ry="4" />
        <path d="M12 184c4-22 12-34 18-38 6 4 14 16 18 38z" />
        <rect x="6" y="182" width="48" height="6" rx="2" />
      </g>
    </svg>
  );
}
