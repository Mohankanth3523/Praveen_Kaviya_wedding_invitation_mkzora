import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SITE_TITLE, wedding } from '../config/wedding';
import { useInvitationSequence } from '../hooks/useInvitationSequence';
import { useIsMobile, useReducedMotion } from '../hooks/useReducedMotion';
import { detectDevice } from '../utils/device';
import { music } from '../utils/music';
import type { SequenceState } from '../scenes/sequence';
import { AudioToggle } from '../components/AudioToggle';
import { LoadingScreen, type StageStatus } from '../components/LoadingScreen';
import { IntroOverlay } from '../components/IntroOverlay';
import { InvitationScroll } from '../components/InvitationScroll';
import { WeddingDetails } from '../components/WeddingDetails';
import { CouplePortrait } from '../components/CouplePortrait';
import { ReceptionDetails } from '../components/ReceptionDetails';
import { FamilySection } from '../components/FamilySection';
import { BlessingVerse } from '../components/BlessingVerse';
import { Countdown } from '../components/Countdown';
import { RitualsSection } from '../components/RitualsSection';
import { Gallery } from '../components/Gallery';
import { GuestNotes } from '../components/GuestNotes';
import { DesignerCredit } from '../components/DesignerCredit';
import { RsvpSection } from '../components/RsvpSection';
import { SiteNav } from '../components/SiteNav';
import { BackToTop } from '../components/BackToTop';
import { Toast } from '../components/Toast';
import { StageFallback } from '../components/StageFallback';
import { SceneErrorBoundary } from '../components/SceneErrorBoundary';

const TempleScene = lazy(() => import('../scenes/TempleScene'));

/** Mounted only once the lazy 3D chunk has arrived. */
function ChunkArrived({ onArrive }: { onArrive: () => void }) {
  useEffect(onArrive, [onArrive]);
  return null;
}

const LOAD_TIMEOUT_MS = 12000;

export default function App() {
  const reducedMotion = useReducedMotion();
  const mobile = useIsMobile();
  const [device] = useState(detectDevice);
  const [status, setStatus] = useState<StageStatus>(device.useFallback ? 'fallback' : 'loading');
  const seq = useInvitationSequence(reducedMotion, mobile);
  const [toast, setToast] = useState<string | null>(null);
  const [loaderDone, setLoaderDone] = useState(false);
  const finishLoader = useCallback(() => setLoaderDone(true), []);
  // The music begins with the doors opening (this click is the visitor's permission to play sound).
  const openInvitation = useCallback(() => {
    music.startWithInvitation();
    seq.open();
  }, [seq]);
  const [stageVisible, setStageVisible] = useState(true);
  const stageRef = useRef<HTMLElement>(null);
  const scrollFocus = useRef<HTMLDivElement>(null);

  const useFallback = status === 'fallback';

  const showMessage = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const toFallback = useCallback((reason: string) => {
    if (import.meta.env.DEV) console.warn('[invitation] Using the illustrated stage:', reason);
    setStatus('fallback');
  }, []);
  const onChunk = useCallback(() => setStatus((s) => (s === 'loading' ? 'building' : s)), []);
  const onReady = useCallback(() => setStatus((s) => (s === 'fallback' ? s : 'ready')), []);

  // Never leave visitors on a loader: fall back if the 3D scene stalls.
  useEffect(() => {
    if (status !== 'loading' && status !== 'building') return;
    const id = window.setTimeout(() => toFallback('3D scene load timeout'), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [status, toFallback]);

  // Pause rendering when the stage is off-screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStageVisible(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Visitors open the invitation first; scrolling unlocks once it has unfolded.
  const cinematic = !seq.atLeast('invitation');
  useEffect(() => {
    if (!cinematic) return;
    document.body.classList.add('is-locked');
    window.scrollTo({ top: 0 });
    return () => document.body.classList.remove('is-locked');
  }, [cinematic]);

  // After the doors open, move focus to the invitation for keyboard and screen-reader users.
  useEffect(() => {
    if (seq.phase === 'invitation') scrollFocus.current?.focus({ preventScroll: true });
  }, [seq.phase]);

  useEffect(() => {
    document.title = SITE_TITLE;
    if (import.meta.env.DEV) {
      console.info('[invitation] Pending verification:', wedding.pendingVerification);
    }
  }, []);

  const sequenceState: SequenceState = useMemo(
    () => ({ startedAt: seq.startedAt, skipped: seq.skipped, reducedMotion, timings: seq.timings }),
    [seq.startedAt, seq.skipped, reducedMotion, seq.timings],
  );

  const scrollMode = seq.atLeast('invitation') ? (seq.skipped ? 'open' : 'unfold') : 'hidden';
  // The first screen (after the loader) shows only the "Open Wedding Invitation" button.
  const introVisible = seq.phase === 'intro' && loaderDone;

  return (
    <>
      {!loaderDone && <LoadingScreen status={status} onDone={finishLoader} />}
      <AudioToggle onMessage={showMessage} />
      <SiteNav visible={seq.atLeast('invitation')} />

      <main>
        <h1 className="sr-only">
          {wedding.couple.short} — Wedding Invitation, {wedding.dateLabel}
        </h1>

        <section
          id="invitation"
          ref={stageRef}
          aria-label="Wedding invitation"
          className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone px-0 pb-12 pt-20 [min-height:100svh]"
        >
          <div className="absolute inset-0">
            {useFallback ? (
              <StageFallback phase={seq.phase} skipped={seq.skipped} reducedMotion={reducedMotion} timings={seq.timings} />
            ) : (
              <SceneErrorBoundary onError={toFallback}>
                <Suspense fallback={null}>
                  <ChunkArrived onArrive={onChunk} />
                  <TempleScene
                    sequence={sequenceState}
                    mobile={mobile}
                    lowPower={device.lowPower}
                    paused={!stageVisible}
                    onReady={onReady}
                    onError={toFallback}
                  />
                </Suspense>
              </SceneErrorBoundary>
            )}
          </div>
          <div className="stage-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

          <IntroOverlay visible={introVisible} reducedMotion={reducedMotion} onOpen={openInvitation} />

          {/* Reduced motion: a brief veil replaces the camera journey. */}
          <AnimatePresence>
            {reducedMotion && (seq.phase === 'opening' || seq.phase === 'entering') && (
              <motion.div
                key="veil"
                className="pointer-events-none absolute inset-0 z-20 bg-stone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </AnimatePresence>

          <div ref={scrollFocus} tabIndex={-1} className="relative z-10 w-full outline-none">
            <InvitationScroll
              mode={scrollMode}
              reducedMotion={reducedMotion}
              tilt={!mobile && !reducedMotion}
            />
          </div>
        </section>

        <BlessingVerse />
        <WeddingDetails onMessage={showMessage} />
        <CouplePortrait />
        <Countdown />
        <RitualsSection />
        <ReceptionDetails />
        <Gallery />
        <GuestNotes onMessage={showMessage} />
        <RsvpSection />
        <FamilySection onMessage={showMessage} />
      </main>

      <footer className="maroon-damask on-dark px-4 pb-10 pt-12 text-center">
        <div className="frieze mx-auto w-72" aria-hidden="true" />
        <p className="display-names gold-foil mt-6 pb-1 text-[clamp(2.2rem,1.8rem+2vw,3.2rem)]">{wedding.couple.short}</p>
        <p className="mt-2 font-caps text-[0.85rem] tracking-[0.2em] text-ivory/85">{wedding.dateLabel}</p>
        <p className="mt-1 font-caps text-[0.75rem] tracking-[0.2em] text-gold-light/80">Vaniyambadi · Tamil Nadu</p>
        <DesignerCredit />
      </footer>

      <BackToTop />
      <Toast message={toast} />
    </>
  );
}
