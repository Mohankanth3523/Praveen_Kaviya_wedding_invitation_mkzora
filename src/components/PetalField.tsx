import type { CSSProperties } from 'react';

/**
 * Slow-falling jasmine and rose petals with a few twinkling gold particles.
 * Pure CSS animation (transform/opacity only, compositor-friendly).
 * Hidden entirely for visitors who prefer reduced motion (see global.css).
 * Positions are fixed (not random) so renders are stable.
 *
 * `depth` adds a far layer (small, faint, slow) and a near layer (larger,
 * faster) around the middle layer, for a sense of depth.
 */
type PetalKind = 'jasmine' | 'rose';
interface PetalSpec {
  left: number;
  dur: number;
  delay: number;
  size: number;
  kind: PetalKind;
  drift: number;
  spin: number;
  alpha: number;
}

const MID: PetalSpec[] = [
  { left: 6, dur: 24, delay: -2, size: 16, kind: 'rose', drift: 60, spin: 280, alpha: 0.8 },
  { left: 15, dur: 30, delay: -14, size: 12, kind: 'jasmine', drift: -30, spin: 200, alpha: 0.9 },
  { left: 27, dur: 26, delay: -8, size: 14, kind: 'rose', drift: 40, spin: 320, alpha: 0.7 },
  { left: 38, dur: 34, delay: -20, size: 11, kind: 'jasmine', drift: 50, spin: 240, alpha: 0.85 },
  { left: 52, dur: 28, delay: -4, size: 15, kind: 'rose', drift: -50, spin: 300, alpha: 0.75 },
  { left: 63, dur: 32, delay: -17, size: 12, kind: 'jasmine', drift: 35, spin: 220, alpha: 0.9 },
  { left: 74, dur: 25, delay: -11, size: 13, kind: 'rose', drift: -35, spin: 260, alpha: 0.7 },
  { left: 85, dur: 29, delay: -24, size: 11, kind: 'jasmine', drift: 45, spin: 210, alpha: 0.85 },
  { left: 93, dur: 27, delay: -6, size: 14, kind: 'rose', drift: -60, spin: 330, alpha: 0.75 },
];

const FAR: PetalSpec[] = [
  { left: 10, dur: 44, delay: -9, size: 8, kind: 'jasmine', drift: 20, spin: 160, alpha: 0.5 },
  { left: 33, dur: 48, delay: -30, size: 7, kind: 'rose', drift: -18, spin: 140, alpha: 0.45 },
  { left: 57, dur: 46, delay: -18, size: 8, kind: 'jasmine', drift: 24, spin: 170, alpha: 0.5 },
  { left: 81, dur: 50, delay: -36, size: 7, kind: 'rose', drift: -20, spin: 150, alpha: 0.45 },
];

const NEAR: PetalSpec[] = [
  { left: 20, dur: 17, delay: -5, size: 22, kind: 'rose', drift: 90, spin: 380, alpha: 0.85 },
  { left: 70, dur: 19, delay: -13, size: 20, kind: 'jasmine', drift: -80, spin: 360, alpha: 0.9 },
];

const PARTICLES: Array<{ left: number; top: number; size: number; dur: number; delay: number }> = [
  { left: 12, top: 22, size: 3, dur: 8, delay: 0 },
  { left: 22, top: 64, size: 2, dur: 10, delay: -3 },
  { left: 33, top: 38, size: 3, dur: 9, delay: -6 },
  { left: 44, top: 78, size: 2, dur: 11, delay: -2 },
  { left: 57, top: 18, size: 3, dur: 8.5, delay: -5 },
  { left: 66, top: 56, size: 2, dur: 10.5, delay: -1 },
  { left: 76, top: 30, size: 3, dur: 9.5, delay: -7 },
  { left: 87, top: 70, size: 2, dur: 12, delay: -4 },
  { left: 92, top: 42, size: 3, dur: 8, delay: -8 },
  { left: 4, top: 48, size: 2, dur: 11, delay: -9 },
];

function PetalShape({ kind, size }: { kind: PetalKind; size: number }) {
  return kind === 'rose' ? (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 1c5 3 8 8 6 13-2 4-7 5-10 3C2 14 2 7 10 1z" fill="#F2BFD0" stroke="#E3A8BD" strokeWidth=".6" />
      <path d="M10 3c1 5 0 9-3 13" fill="none" stroke="#E3A8BD" strokeWidth=".5" opacity=".7" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 1c3 4 3 9 0 18-3-9-3-14 0-18z" fill="#FFFDF8" stroke="#E8D9BE" strokeWidth=".6" />
    </svg>
  );
}

function Petals({ specs, prefix }: { specs: PetalSpec[]; prefix: string }) {
  return (
    <>
      {specs.map((p, i) => (
        <span
          key={`${prefix}${i}`}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
              '--alpha': p.alpha,
            } as CSSProperties
          }
        >
          <PetalShape kind={p.kind} size={p.size} />
        </span>
      ))}
    </>
  );
}

export function PetalField({ depth = false, particles = true }: { depth?: boolean; particles?: boolean }) {
  return (
    <div className="petal-field" aria-hidden="true">
      {depth && <Petals specs={FAR} prefix="f" />}
      <Petals specs={MID} prefix="m" />
      {depth && <Petals specs={NEAR} prefix="n" />}
      {particles &&
        PARTICLES.map((g, i) => (
          <span
            key={`g${i}`}
            className="gold-particle"
            style={
              {
                left: `${g.left}%`,
                top: `${g.top}%`,
                '--size': `${g.size}px`,
                '--dur': `${g.dur}s`,
                '--delay': `${g.delay}s`,
              } as CSSProperties
            }
          />
        ))}
    </div>
  );
}
