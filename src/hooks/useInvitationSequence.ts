import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * intro → opening → entering → mandapam → invitation → details
 * Every transition is driven from here (timers), so the 3D scene, the CSS
 * fallback and the overlays all read one source of truth. The scene only
 * *renders* progress; it never decides the phase, so a stalled WebGL context
 * cannot trap the visitor.
 */
export type Phase = 'intro' | 'opening' | 'entering' | 'mandapam' | 'invitation' | 'details';

export const PHASE_ORDER: Phase[] = ['intro', 'opening', 'entering', 'mandapam', 'invitation', 'details'];

export interface SequenceTimings {
  /** Seconds from the click. */
  doorsEnd: number;
  travelStart: number;
  travelEnd: number;
  invitationAt: number;
  detailsAt: number;
}

export function getTimings(reducedMotion: boolean, mobile: boolean): SequenceTimings {
  if (reducedMotion) {
    return { doorsEnd: 0.5, travelStart: 0.1, travelEnd: 0.6, invitationAt: 0.7, detailsAt: 1.2 };
  }
  if (mobile) {
    return { doorsEnd: 2.0, travelStart: 0.7, travelEnd: 4.0, invitationAt: 4.3, detailsAt: 6.4 };
  }
  return { doorsEnd: 2.4, travelStart: 0.8, travelEnd: 5.0, invitationAt: 5.4, detailsAt: 7.8 };
}

export interface InvitationSequence {
  phase: Phase;
  /** performance.now() when the doors were opened; null before, or when skipped. */
  startedAt: number | null;
  skipped: boolean;
  timings: SequenceTimings;
  open: () => void;
  skip: () => void;
  atLeast: (phase: Phase) => boolean;
}

export function useInvitationSequence(reducedMotion: boolean, mobile: boolean): InvitationSequence {
  const [phase, setPhase] = useState<Phase>('intro');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<Phase>('intro');
  phaseRef.current = phase;

  // Timings are frozen at the moment the doors open, so resizing mid-flight
  // cannot desynchronise the camera and the overlays.
  const liveTimings = useMemo(() => getTimings(reducedMotion, mobile), [reducedMotion, mobile]);
  const [frozenTimings, setFrozenTimings] = useState<SequenceTimings | null>(null);
  const timings = frozenTimings ?? liveTimings;

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const open = useCallback(() => {
    // Ignore repeated clicks: only the intro can start the sequence.
    if (phaseRef.current !== 'intro') return;
    const t = liveTimings;
    setFrozenTimings(t);
    setStartedAt(performance.now());
    setPhase('opening');
    phaseRef.current = 'opening';
    const at = (seconds: number, next: Phase) => {
      timers.current.push(
        window.setTimeout(() => {
          // Never move backwards (e.g. if the visitor skipped meanwhile).
          if (PHASE_ORDER.indexOf(next) > PHASE_ORDER.indexOf(phaseRef.current)) {
            phaseRef.current = next;
            setPhase(next);
          }
        }, seconds * 1000),
      );
    };
    at(t.doorsEnd * 0.6, 'entering');
    at(t.travelEnd, 'mandapam');
    at(t.invitationAt, 'invitation');
    at(t.detailsAt, 'details');
  }, [liveTimings]);

  const skip = useCallback(() => {
    clearTimers();
    setSkipped(true);
    setPhase('details');
    phaseRef.current = 'details';
  }, [clearTimers]);

  const atLeast = useCallback(
    (target: Phase) => PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(target),
    [phase],
  );

  return { phase, startedAt, skipped, timings, open, skip, atLeast };
}
