import { createContext, useContext } from 'react';
import type { SequenceTimings } from '../hooks/useInvitationSequence';

export interface SequenceState {
  startedAt: number | null;
  skipped: boolean;
  reducedMotion: boolean;
  timings: SequenceTimings;
}

/** A mutable ref shared by every animated object; read inside useFrame. */
export const SequenceContext = createContext<{ current: SequenceState } | null>(null);

export function useSequenceRef() {
  const ref = useContext(SequenceContext);
  if (!ref) throw new Error('SequenceContext missing');
  return ref;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export interface Progress {
  /** Seconds since the doors were opened (0 before). */
  elapsed: number;
  doors: number;
  travel: number;
}

export function readProgress(state: SequenceState, now = performance.now()): Progress {
  if (state.skipped) return { elapsed: 99, doors: 1, travel: 1 };
  if (state.startedAt === null) return { elapsed: 0, doors: 0, travel: 0 };
  const elapsed = (now - state.startedAt) / 1000;
  const { doorsEnd, travelStart, travelEnd } = state.timings;
  if (state.reducedMotion) {
    // Short transition: the veil in the UI covers an instant cut.
    const done = elapsed > 0.3 ? 1 : 0;
    return { elapsed, doors: done, travel: done };
  }
  return {
    elapsed,
    doors: easeInOutSine(clamp01((elapsed - 0.1) / (doorsEnd - 0.1))),
    travel: smootherstep(clamp01((elapsed - travelStart) / (travelEnd - travelStart))),
  };
}
