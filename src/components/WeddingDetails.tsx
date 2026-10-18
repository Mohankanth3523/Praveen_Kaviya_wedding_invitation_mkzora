import type { ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { wedding } from '../config/wedding';
import { directionsUrl } from '../utils/directions';
import { CalendarDownload } from './CalendarDownload';
import { ShareInvitation } from './ShareInvitation';
import { Divider, FramedCorners } from './Ornaments';
import { Reveal, SectionHeading } from './Reveal';

/** Scene 5 — the ceremony details, exactly as confirmed. */
export function WeddingDetails({ onMessage }: { onMessage: (text: string) => void }) {
  const { ceremony } = wedding;
  return (
    <section id="ceremony" aria-labelledby="ceremony-title" className="ivory-silk scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <Reveal className="mx-auto max-w-3xl">
        <SectionHeading id="ceremony-title" eyebrow="The Sacred Muhurtham" title={ceremony.heading} />
        <Divider className="mx-auto mt-5 h-5 w-60" />
        <div className="paper relative mx-auto mt-10 rounded-sm px-6 py-10 shadow-[0_24px_50px_-30px_rgba(100,21,31,0.55)] ring-1 ring-gold/40 sm:px-12 sm:py-12">
          <FramedCorners />
          <dl className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-x-8 sm:gap-y-7">
            <Row icon={<CalendarDays size={22} aria-hidden="true" />} label="Date">
              <span className="font-display text-[1.6rem] font-semibold leading-tight">{wedding.dateLabel}</span>
            </Row>
            <Row icon={<Clock size={22} aria-hidden="true" />} label={ceremony.timeLabel}>
              <span className="font-display text-[1.6rem] font-semibold leading-tight">{ceremony.timeRange}</span>
            </Row>
            <Row icon={<MapPin size={22} aria-hidden="true" />} label="Venue">
              <address className="not-italic">
                <span className="block font-display text-[1.45rem] font-semibold leading-snug">{ceremony.venue.name}</span>
                {ceremony.venue.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </Row>
          </dl>
          <div className="mt-10 flex flex-wrap items-start justify-center gap-3">
            <a className="btn-primary" href={directionsUrl(ceremony.venue)} target="_blank" rel="noopener noreferrer">
              <Navigation size={16} aria-hidden="true" /> Open Directions
              <span className="sr-only"> to {ceremony.venue.name} (opens Google Maps)</span>
            </a>
            <CalendarDownload onMessage={onMessage} variant="outline" />
            <ShareInvitation onMessage={onMessage} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex items-center gap-3 font-caps text-[0.8rem] uppercase tracking-[0.22em] text-burgundy/80 sm:pt-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 text-gold-dark">{icon}</span>
        {label}
      </dt>
      <dd className="-mt-5 pl-[3.25rem] sm:mt-0 sm:pl-0">{children}</dd>
    </>
  );
}
