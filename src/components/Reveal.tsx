import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Gentle fade-and-rise when a block scrolls into view. Content is always in the DOM. */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: reduced ? 0.3 : 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ id, eyebrow, title, tone = 'burgundy' }: { id: string; eyebrow?: string; title: string; tone?: 'burgundy' | 'ivory' }) {
  return (
    <div className="text-center">
      {eyebrow && <p className={`eyebrow ${tone === 'ivory' ? 'text-gold-dark' : 'text-burgundy'}`}>{eyebrow}</p>}
      <h2
        id={id}
        className={`mt-3 font-caps uppercase tracking-[0.18em] text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] ${
          tone === 'ivory' ? 'gold-foil' : 'gold-foil-dark'
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
