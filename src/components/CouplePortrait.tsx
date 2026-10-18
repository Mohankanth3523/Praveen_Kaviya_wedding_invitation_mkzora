import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { wedding } from '../config/wedding';
import { Picture } from './Picture';
import { Divider } from './Ornaments';
import { Reveal } from './Reveal';

/** Scene 6 — the couple's own photographs, unaltered and visually dominant. */
export function CouplePortrait() {
  const frame = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: frame, offset: ['start end', 'end start'] });
  // Restrained parallax: the image is only 4% larger than its frame.
  const y = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['-1.8%', '1.8%']);
  const { hero } = wedding.photos;

  return (
    <section
      id="couple"
      aria-labelledby="couple-title"
      className="maroon-damask on-dark relative scroll-mt-16 overflow-hidden px-4 py-[clamp(4rem,10vw,7rem)]"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="eyebrow text-gold-light">The Couple</p>
          <h2 id="couple-title" className="display-names gold-foil mt-3 pb-2 text-[clamp(2.8rem,1.9rem+4.4vw,5.2rem)]">
            {wedding.couple.groomShort} <span className="not-italic">&amp;</span> {wedding.couple.brideShort}
          </h2>
          <Divider className="mx-auto mt-4 h-5 w-60" tone="light" />
        </Reveal>

        <motion.div
          ref={frame}
          className="frame-double relative mx-auto mt-10 max-w-5xl overflow-hidden bg-[#3a0c13] p-[10px] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '0px 0px -15% 0px' }}
          transition={{ duration: reduced ? 0.3 : 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[2px] ring-1 ring-gold/40" style={{ aspectRatio: `${hero.width} / ${hero.height}` }}>
            <motion.div className="absolute inset-0" style={{ y, scale: reduced ? 1 : 1.04 }}>
              <Picture photo={hero} sizes="(min-width: 1024px) 64rem, 100vw" imgClassName="h-full w-full object-cover object-[50%_30%]" />
            </motion.div>
          </div>
        </motion.div>

        <Reveal className="mt-8 text-center" delay={0.1}>
          <p className="eyebrow text-gold-light">{wedding.portraitCaption}</p>
        </Reveal>

      </div>
    </section>
  );
}
