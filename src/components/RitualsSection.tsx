import { motion, useReducedMotion } from 'framer-motion';
import { wedding } from '../config/wedding';
import { Reveal } from './Reveal';

/** Each ritual's lotus takes a different festive colour. */
const LOTUS = ['#F6A5C0', '#7FD1C7', '#FFC96B', '#E79AD0', '#8FD6A8', '#9DBDF2'];

/** The traditional moments of a Tamil Hindu wedding, explained for guests. */
export function RitualsSection() {
  const { rituals } = wedding;
  const reduced = useReducedMotion();
  return (
    <section id="rituals" aria-labelledby="rituals-title" className="surface-blush toran-top scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="eyebrow text-gold-dark">Tradition &amp; Togetherness</p>
          <h2 id="rituals-title" className="gold-foil mt-3 font-caps text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] uppercase tracking-[0.18em]">
            {rituals.heading}
          </h2>
          <div className="frieze mx-auto mt-5 w-72" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl font-display text-[1.25rem] italic leading-relaxed text-burgundy">{rituals.intro}</p>
        </Reveal>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rituals.items.map((ritual, i) => (
            <li key={ritual.name}>
              <Reveal delay={(i % 3) * 0.1} className="h-full">
                <article className="card-petal group relative h-full px-6 pb-7 pt-8 text-center hover:-translate-y-0.5">
                  <div className="pointer-events-none absolute inset-[6px] rounded-[10px] border border-gold/25" aria-hidden="true" />
                  <motion.svg
                    className="mx-auto mb-2 h-7 w-12 text-gold"
                    viewBox="0 0 48 28"
                    aria-hidden="true"
                    focusable="false"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -12 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: reduced ? 0.3 : 1.1, delay: (i % 3) * 0.12 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <g fill={LOTUS[i % LOTUS.length]} stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
                      <path d="M24 3c4 6 4 13 0 20-4-7-4-14 0-20z" />
                      <path d="M24 23c-6-2-11-7-12-14 6 1 10 6 12 14z" />
                      <path d="M24 23c6-2 11-7 12-14-6 1-10 6-12 14z" />
                      <path d="M24 23c-9 0-16-3-20-8 7 0 14 3 20 8z" fillOpacity=".6" />
                      <path d="M24 23c9 0 16-3 20-8-7 0-14 3-20 8z" fillOpacity=".6" />
                    </g>
                  </motion.svg>
                  <span className="numeral gold-foil block text-4xl font-semibold" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-caps text-[1.05rem] uppercase tracking-[0.18em] text-burgundy">{ritual.name}</h3>
                  <p lang="ta" className="mt-1 font-tamil text-[0.95rem] leading-[1.8] text-gold-dark">
                    {ritual.tamil}
                  </p>
                  <div className="mx-auto my-4 h-px w-12 bg-gold/60" aria-hidden="true" />
                  <p className="text-[1rem] leading-relaxed text-ink">{ritual.description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
