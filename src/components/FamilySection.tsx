import { wedding, type Person } from '../config/wedding';
import { Crest, Divider } from './Ornaments';
import { Reveal, SectionHeading } from './Reveal';
import { ShareInvitation } from './ShareInvitation';

/** Scene 8 — only confirmed family details, then the closing blessing. */
export function FamilySection({ onMessage }: { onMessage: (text: string) => void }) {
  const { family } = wedding;
  return (
    <section id="family" aria-labelledby="family-title" className="surface-sunset toran-top relative scroll-mt-16 border-t border-petal px-4 pb-[clamp(4rem,10vw,6rem)] pt-[clamp(4rem,10vw,7rem)]">
      <div className="kolam-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading id="family-title" eyebrow="Seeking your blessings" title={family.heading} />
          <Divider className="mx-auto mt-5 h-5 w-60" />
        </Reveal>
        <div className="mt-10 grid items-start gap-10 text-center sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
          <Reveal>
            <PersonCard person={family.groom} />
          </Reveal>
          <div className="flex items-center justify-center sm:h-full" aria-hidden="true">
            <span className="display-names text-5xl text-gold-dark">&amp;</span>
          </div>
          <Reveal delay={0.12}>
            <PersonCard person={family.bride} />
          </Reveal>
        </div>

        <Reveal className="mt-16 text-center">
          <Crest className="mx-auto h-12 w-20" />
          <p className="eyebrow mx-auto mt-5 max-w-xl leading-loose text-burgundy">{wedding.closing.line}</p>
          <p className="display-names gold-foil-dark mt-5 pb-1 text-[clamp(2.2rem,1.7rem+2.4vw,3.4rem)]">{wedding.closing.signature}</p>
          <div className="mt-8 flex justify-center">
            <ShareInvitation onMessage={onMessage} label="Share This Invitation" variant="primary" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PersonCard({ person }: { person: Person }) {
  return (
    <div className="px-2">
      <p className="font-caps text-[0.78rem] uppercase tracking-[0.26em] text-gold-dark">{person.role}</p>
      <p className="mt-2 font-display text-[clamp(1.7rem,1.4rem+1.2vw,2.2rem)] font-semibold leading-tight text-burgundy">{person.name}</p>
      {person.qualifications && <p className="mt-1 font-caps tracking-[0.08em] text-burgundy">{person.qualifications}</p>}
      {person.parents.length > 0 && <div className="mx-auto my-3 h-px w-16 bg-gold/60" aria-hidden="true" />}
      {person.parents.map((line) => (
        <p key={line} className="italic text-ink">
          {line}
        </p>
      ))}
    </div>
  );
}
