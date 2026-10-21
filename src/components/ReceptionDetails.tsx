import { CalendarDays, MapPin, Navigation } from 'lucide-react';
import { wedding } from '../config/wedding';
import { directionsUrl } from '../utils/directions';
import { Picture } from './Picture';
import { Divider, Festoon, FramedCorners } from './Ornaments';
import { Reveal } from './Reveal';

/** Scene 7 — a distinct blush card for the reception (no unconfirmed time is shown). */
export function ReceptionDetails() {
  const { reception } = wedding;
  return (
    <section id="reception" aria-labelledby="reception-title" className="surface-white scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <Reveal className="mx-auto grid max-w-5xl items-stretch overflow-hidden rounded-[14px] shadow-petal-lg ring-1 ring-petal md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative bg-blush">
          <Picture
            photo={wedding.photos.reception}
            sizes="(min-width: 768px) 26rem, 100vw"
            imgClassName="block h-full w-full object-contain md:object-cover md:object-[50%_25%]"
          />
        </div>
        <div className="card-blush relative flex flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
          <FramedCorners inset="inset-4" />
          <Festoon className="h-8 w-56 opacity-90" />
          <p className="eyebrow mt-4 text-gold-dark">Celebrate with us</p>
          <h2 id="reception-title" className="mt-2 font-caps text-[clamp(1.8rem,1.4rem+1.8vw,2.6rem)] uppercase tracking-[0.3em] text-burgundy">
            {reception.heading}
          </h2>
          <Divider className="mx-auto mt-4 h-5 w-56" />
          <p className="mt-6 flex items-center justify-center gap-2 font-caps text-[1.08rem] tracking-[0.08em] text-burgundy">
            <CalendarDays size={18} className="text-gold-dark" aria-hidden="true" />
            {wedding.dateLabel}
          </p>
          {reception.time && <p className="mt-1 text-ink">{reception.time}</p>}
          <div className="mt-6 flex items-start justify-center gap-2">
            <MapPin size={18} className="mt-2 shrink-0 text-gold-dark" aria-hidden="true" />
            <address className="not-italic text-ink">
              <span className="block font-display text-[1.7rem] font-semibold leading-tight text-burgundy">{reception.venue.name}</span>
              {reception.venue.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
          <a className="btn-primary mt-8" href={directionsUrl(reception.venue)} target="_blank" rel="noopener noreferrer">
            <Navigation size={16} aria-hidden="true" /> Open Directions
            <span className="sr-only"> to {reception.venue.name} (opens Google Maps)</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}
