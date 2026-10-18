import { wedding } from '../config/wedding';
import { Crest } from './Ornaments';
import { Reveal } from './Reveal';

/** A Thirukkural couplet on married life, in Tamil with its English meaning. */
export function BlessingVerse() {
  const { verse } = wedding;
  return (
    <section aria-labelledby="verse-title" className="maroon-damask on-dark px-4 py-[clamp(4rem,9vw,6.5rem)] text-center">
      <Reveal className="mx-auto max-w-3xl">
        <Crest className="mx-auto h-12 w-20" />
        <h2 id="verse-title" className="eyebrow mt-4 text-gold-light">
          {verse.source}
        </h2>
        <blockquote className="mt-6">
          <p lang="ta" className="font-tamil text-[clamp(1.25rem,1rem+1.3vw,1.9rem)] leading-[1.9] text-ivory">
            {verse.tamilLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="frieze mx-auto my-7 w-56 opacity-80" aria-hidden="true" />
          <p className="mx-auto max-w-xl font-display text-[clamp(1.3rem,1.1rem+0.9vw,1.75rem)] italic leading-snug text-ivory/90">
            “{verse.meaning}”
          </p>
        </blockquote>
      </Reveal>
    </section>
  );
}
