import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SITE_TITLE, wedding } from '../config/wedding';
import { useIsMobile, useReducedMotion } from '../hooks/useReducedMotion';
import { AudioToggle } from '../components/AudioToggle';
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
import { Picture } from '../components/Picture';
import { PetalField } from '../components/PetalField';
import { FloralCorners } from '../components/Ornaments';
import { OpeningSequence } from '../components/opening/OpeningSequence';
import { OPENING_SEEN_KEY } from '../components/opening/openingConfig';

/**
 * The cinematic opening (components/opening) replaced the earlier Three.js
 * temple stage. The 3D files (src/scenes, StageFallback, LoadingScreen,
 * IntroOverlay) are kept in the repository but are no longer loaded.
 */

/** Skip the opening on a reload within the same visit, or when arriving on a deep link (e.g. #rsvp). */
function shouldSkipOpening(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  if (hash && hash !== '#invitation') return true;
  try {
    return window.sessionStorage.getItem(OPENING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const reducedMotion = useReducedMotion();
  const mobile = useIsMobile();
  const [openingDone, setOpeningDone] = useState(shouldSkipOpening);
  const [toast, setToast] = useState<string | null>(null);
  const invitationFocus = useRef<HTMLDivElement>(null);

  const showMessage = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Lock page scrolling while the opening plays over it.
  useEffect(() => {
    if (openingDone) return;
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [openingDone]);

  const completeOpening = useCallback(() => {
    try {
      window.sessionStorage.setItem(OPENING_SEEN_KEY, '1');
    } catch {
      /* storage unavailable — the opening simply plays again next time */
    }
    setOpeningDone(true);
    // Hand keyboard and screen-reader focus to the invitation.
    window.requestAnimationFrame(() => invitationFocus.current?.focus({ preventScroll: true }));
  }, []);

  const replayOpening = useCallback(() => {
    window.scrollTo({ top: 0 });
    setOpeningDone(false);
  }, []);

  useEffect(() => {
    document.title = SITE_TITLE;
    if (import.meta.env.DEV) {
      console.info('[invitation] Pending verification:', wedding.pendingVerification);
    }
  }, []);

  return (
    <>
      {!openingDone && <OpeningSequence reducedMotion={reducedMotion} mobile={mobile} onComplete={completeOpening} />}
      <AudioToggle onMessage={showMessage} />
      <SiteNav visible={openingDone} />

      <main aria-hidden={!openingDone ? true : undefined}>
        <h1 className="sr-only">
          {wedding.couple.short} — Wedding Invitation, {wedding.dateLabel}
        </h1>

        {/* Invitation: editorial layout — framed portrait beside the unrolled scroll. */}
        <section
          id="invitation"
          aria-label="Wedding invitation"
          className="surface-sunset relative scroll-mt-16 overflow-hidden px-4 pb-[clamp(4rem,9vw,6.5rem)] pt-[clamp(6rem,12vw,8rem)]"
        >
          <div className="kolam-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div ref={invitationFocus} tabIndex={-1} className="relative mx-auto grid max-w-6xl items-center gap-12 outline-none lg:grid-cols-12 lg:gap-10">
            <div className="lg:order-2 lg:col-span-7">
              <InvitationScroll mode={openingDone ? 'open' : 'hidden'} reducedMotion={reducedMotion} tilt={!mobile && !reducedMotion} />
            </div>
            <motion.figure
              className="relative mx-auto w-full max-w-md lg:order-1 lg:col-span-5 lg:max-w-none"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: reducedMotion ? 0.3 : 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="frame-double rounded-[8px] bg-blush p-[10px] shadow-petal-lg">
                <div className="overflow-hidden rounded-[4px]" style={{ aspectRatio: `${wedding.photos.hero.width} / ${wedding.photos.hero.height}` }}>
                  <Picture photo={wedding.photos.hero} sizes="(min-width: 1024px) 28rem, 90vw" imgClassName="block h-full w-full object-cover" />
                </div>
              </div>
              <FloralCorners className="h-16 w-16 sm:h-20 sm:w-20" />
              <figcaption className="eyebrow mt-5 text-center text-gold-dark">{wedding.portraitCaption}</figcaption>
            </motion.figure>
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

      <footer className="surface-sunset toran-top relative overflow-hidden border-t border-petal px-4 pb-10 pt-14 text-center">
        <PetalField particles={false} />
        <div className="frieze gold-sweep mx-auto w-72" aria-hidden="true" />
        <motion.p
          className="display-names gold-foil closing-shimmer mt-6 pb-1 text-[clamp(2.2rem,1.8rem+2vw,3.2rem)]"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, letterSpacing: '0.18em', y: 10 }}
          whileInView={{ opacity: 1, letterSpacing: '0.005em', y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reducedMotion ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {wedding.couple.short}
        </motion.p>
        <p className="mt-2 font-caps text-[0.85rem] tracking-[0.2em] text-burgundy">{wedding.dateLabel}</p>
        <p className="mt-1 font-caps text-[0.75rem] tracking-[0.2em] text-gold-dark">Vaniyambadi · Tamil Nadu</p>
        <button
          type="button"
          onClick={replayOpening}
          className="mt-6 inline-flex min-h-[44px] items-center px-3 font-caps text-[0.72rem] uppercase tracking-[0.2em] text-burgundy underline decoration-gold/60 underline-offset-4 transition-colors hover:text-gold-dark"
        >
          Replay the opening
        </button>
        <DesignerCredit />
      </footer>

      <BackToTop />
      <Toast message={toast} />
    </>
  );
}
