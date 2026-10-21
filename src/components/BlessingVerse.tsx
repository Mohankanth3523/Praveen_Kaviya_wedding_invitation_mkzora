import { wedding } from '../config/wedding';
import { Crest, FloralCorners } from './Ornaments';
import { PetalField } from './PetalField';
import { Reveal } from './Reveal';

/**
 * A Thirukkural couplet on married life, in Tamil with its English meaning.
 * The verse text, source and translation come unchanged from config.
 * Peacock-teal feature section: kolam line-art, warm light rays, drifting petals and gold particles
 * (all decorative, aria-hidden, and disabled for reduced-motion visitors).
 */
export function BlessingVerse() {
  const { verse } = wedding;
  return (
    <section aria-labelledby="verse-title" className="surface-peacock px-4 py-[clamp(4.5rem,10vw,7.5rem)] text-center">
            <div className="light-rays" aria-hidden="true" />
      <PetalField />
      <FloralCorners />

      <Reveal className="relative mx-auto max-w-3xl">
        <Crest className="mx-auto h-12 w-20" />
        <h2 id="verse-title" className="eyebrow mt-4 text-[#F6D98E]">
          {verse.source}
        </h2>
        <blockquote className="mt-6">
          <p lang="ta" className="font-tamil text-[clamp(1.25rem,1rem+1.3vw,1.9rem)] leading-[1.95] text-[#FFF6E8]">
            {verse.tamilLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="frieze gold-sweep mx-auto my-7 w-56" aria-hidden="true" />
          <p className="mx-auto max-w-xl font-display text-[clamp(1.3rem,1.1rem+0.9vw,1.75rem)] italic leading-snug text-[#F6D98E]">
            “{verse.meaning}”
          </p>
        </blockquote>
      </Reveal>
    </section>
  );
}
