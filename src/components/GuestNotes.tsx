import { CalendarHeart, MapPinned, Sunrise } from 'lucide-react';
import { wedding } from '../config/wedding';
import { directionsUrl } from '../utils/directions';
import { CalendarDownload } from './CalendarDownload';
import { Reveal, SectionHeading } from './Reveal';

const ICONS = [Sunrise, CalendarHeart, MapPinned];

/** Practical notes for guests; only facts already confirmed elsewhere. */
export function GuestNotes({ onMessage }: { onMessage: (text: string) => void }) {
  const { guestNotes, ceremony, reception } = wedding;
  return (
    <section id="guests" aria-labelledby="guests-title" className="ivory-silk scroll-mt-16 px-4 py-[clamp(4rem,10vw,6.5rem)]">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading id="guests-title" eyebrow="With warm regards" title={guestNotes.heading} />
          <div className="frieze mx-auto mt-5 w-64" aria-hidden="true" />
        </Reveal>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {guestNotes.notes.map((note, i) => {
            const Icon = ICONS[i] ?? Sunrise;
            return (
              <li key={note.title}>
                <Reveal delay={i * 0.1} className="h-full">
                  <div className="frame-double flex h-full flex-col items-center bg-ivory/80 px-6 py-8 text-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 text-gold-dark">
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-caps text-[1rem] uppercase tracking-[0.16em] text-burgundy">{note.title}</h3>
                    <p className="mt-3 flex-1 leading-relaxed text-burgundy/90">{note.text}</p>
                    {i === 1 && (
                      <div className="mt-5">
                        <CalendarDownload onMessage={onMessage} variant="outline" />
                      </div>
                    )}
                    {i === 2 && (
                      <div className="mt-5 flex flex-col gap-2">
                        <a className="btn-outline" href={directionsUrl(ceremony.venue)} target="_blank" rel="noopener noreferrer">
                          Temple
                        </a>
                        <a className="btn-outline" href={directionsUrl(reception.venue)} target="_blank" rel="noopener noreferrer">
                          Reception
                        </a>
                      </div>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
