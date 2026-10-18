import { wedding } from '../config/wedding';
import { Reveal } from './Reveal';

/** The traditional moments of a Tamil Hindu wedding, explained for guests. */
export function RitualsSection() {
  const { rituals } = wedding;
  return (
    <section id="rituals" aria-labelledby="rituals-title" className="maroon-damask on-dark scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="eyebrow text-gold-light">Tradition &amp; Togetherness</p>
          <h2 id="rituals-title" className="gold-foil mt-3 font-caps text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] uppercase tracking-[0.18em]">
            {rituals.heading}
          </h2>
          <div className="frieze mx-auto mt-5 w-72" aria-hidden="true" />
          <p className="mx-auto mt-6 max-w-2xl font-display text-[1.25rem] italic leading-relaxed text-ivory/85">{rituals.intro}</p>
        </Reveal>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rituals.items.map((ritual, i) => (
            <li key={ritual.name}>
              <Reveal delay={(i % 3) * 0.1} className="h-full">
                <article className="group relative h-full border border-gold/45 bg-[rgba(33,27,24,0.28)] px-6 pb-7 pt-8 text-center transition-colors duration-500 hover:border-gold/80">
                  <div className="pointer-events-none absolute inset-[6px] border border-gold/20" aria-hidden="true" />
                  <span className="numeral gold-foil block text-4xl font-semibold" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 font-caps text-[1.05rem] uppercase tracking-[0.18em] text-ivory">{ritual.name}</h3>
                  <p lang="ta" className="mt-1 font-tamil text-[0.95rem] text-gold-light">
                    {ritual.tamil}
                  </p>
                  <div className="mx-auto my-4 h-px w-12 bg-gold/60" aria-hidden="true" />
                  <p className="text-[1rem] leading-relaxed text-ivory/85">{ritual.description}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
