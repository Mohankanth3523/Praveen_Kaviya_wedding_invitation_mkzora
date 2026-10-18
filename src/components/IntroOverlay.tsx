import { AnimatePresence, motion } from 'framer-motion';
import { wedding } from '../config/wedding';
import { Divider } from './Ornaments';

interface Props {
  visible: boolean;
  reducedMotion: boolean;
  onOpen: () => void;
}

/** Scene 1 text: eyebrow, names, date and the call to open the doors. */
export function IntroOverlay({ visible, reducedMotion, onOpen }: Props) {
  const rise = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.4, delay: delay * 0.2 } } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0, transition: { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] } },
        };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="on-dark absolute inset-0 z-20 flex flex-col items-center justify-between px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[clamp(4.5rem,11vh,7rem)] text-center text-ivory"
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
        >
          <div className="flex flex-col items-center">
            <motion.p className="eyebrow text-glow text-gold-light" {...rise(0.3)}>
              {wedding.intro.eyebrow}
            </motion.p>
            <motion.p
              className="display-names text-glow mt-4 text-[clamp(3rem,2rem+6vw,6.5rem)] text-ivory"
              {...rise(0.6)}
            >
              {wedding.couple.groomShort} <span className="font-display not-italic text-gold-light">&amp;</span>{' '}
              {wedding.couple.brideShort}
            </motion.p>
            <motion.div {...rise(0.9)}>
              <Divider className="mx-auto mt-4 h-5 w-56 sm:w-72" tone="light" />
              <p className="text-glow mt-3 font-caps text-[clamp(0.95rem,0.85rem+0.4vw,1.15rem)] tracking-[0.14em] text-ivory/95">
                {wedding.dateLabel}
              </p>
            </motion.div>
          </div>

          <motion.div className="flex flex-col items-center gap-3" {...rise(1.3)}>
            <button type="button" onClick={onOpen} className="btn-primary px-8 text-[0.82rem] sm:text-[0.86rem]">
              {wedding.intro.button}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
