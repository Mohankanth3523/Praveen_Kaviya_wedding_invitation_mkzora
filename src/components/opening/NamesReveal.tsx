import { motion } from 'framer-motion';
import { wedding } from '../../config/wedding';
import { Divider } from '../Ornaments';

/** Scene C: PRAVEEN & KAVIYA, settling from wide letter-spacing with a light sweep. */
export function NamesReveal({ reducedMotion }: { reducedMotion: boolean }) {
  const line = (delay: number) =>
    reducedMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, delay: delay * 0.3 } }
      : {
          initial: { opacity: 0, letterSpacing: '0.7em', filter: 'blur(6px)' },
          animate: { opacity: 1, letterSpacing: '0.2em', filter: 'blur(0px)' },
          transition: { duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="relative px-4 text-center">
      <motion.p className="eyebrow text-gold-dark" {...line(0)}>
        {wedding.invitation.blessing}
      </motion.p>
      <div className="gold-sweep mx-auto mt-6 inline-block px-2">
        <motion.p
          className="font-display text-[clamp(2.6rem,1.6rem+6vw,6rem)] font-semibold uppercase leading-[1.05] text-burgundy"
          {...line(0.2)}
        >
          {wedding.couple.groomShort}
        </motion.p>
        <motion.p
          className="display-names gold-foil my-1 text-[clamp(2.2rem,1.6rem+3vw,4rem)]"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: reducedMotion ? 0.6 : 1.1, delay: reducedMotion ? 0.1 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-label="and"
        >
          &amp;
        </motion.p>
        <motion.p
          className="font-display text-[clamp(2.6rem,1.6rem+6vw,6rem)] font-semibold uppercase leading-[1.05] text-burgundy"
          {...line(0.9)}
        >
          {wedding.couple.brideShort}
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: reducedMotion ? 0.3 : 1.6 }}
      >
        <Divider className="mx-auto mt-6 h-5 w-56 sm:w-72" />
        <p className="mt-3 font-caps text-[clamp(0.95rem,0.85rem+0.4vw,1.15rem)] tracking-[0.14em] text-burgundy">{wedding.dateLabel}</p>
      </motion.div>
    </div>
  );
}
