import type { ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { wedding } from '../config/wedding';
import { directionsUrl } from '../utils/directions';
import { CalendarDownload } from './CalendarDownload';
import { ShareInvitation } from './ShareInvitation';
import { motion, useReducedMotion } from 'framer-motion';
import { Divider, FramedCorners } from './Ornaments';
import { Reveal, SectionHeading } from './Reveal';

/** Scene 5 — the ceremony details, exactly as confirmed. */
export function WeddingDetails({ onMessage }: { onMessage: (text: string) => void }) {
  const { ceremony, reception } = wedding;
  const reduced = useReducedMotion();
  /** The day's two events, in order. Only confirmed facts from config; no invented times. */
  const timeline = [
    { label: ceremony.timeLabel, title: ceremony.heading, time: ceremony.timeRange, place: ceremony.venue.name },
    { label: 'Celebration', title: reception.heading, time: reception.time, place: reception.venue.name },
  ];
  return (
    <section id="ceremony" aria-labelledby="ceremony-title" className="surface-ivory toran-top scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <Reveal className="mx-auto max-w-3xl">
        <SectionHeading id="ceremony-title" eyebrow="The Sacred Muhurtham" title={ceremony.heading} />
        <div className="gold-sweep mx-auto mt-5 w-60">
          <Divider className="h-5 w-60" />
        </div>
        <div className="festive-card relative mx-auto mt-10 rounded-[14px] px-6 py-10 shadow-petal-lg sm:px-12 sm:py-12">
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

        {/* The day at a glance: a gold timeline that draws itself as it scrolls in. */}
        <div className="relative mx-auto mt-14 max-w-xl">
          <p className="eyebrow text-center text-gold-dark">{wedding.dateLabel}</p>
          <ol className="relative mt-8 space-y-8 pl-10">
            <motion.span
              aria-hidden="true"
              className="absolute left-[15px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-gold via-gold/70 to-petal"
              initial={reduced ? { opacity: 0 } : { scaleY: 0 }}
              whileInView={reduced ? { opacity: 1 } : { scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduced ? 0.3 : 1.4, ease: [0.65, 0, 0.35, 1] }}
            />
            {timeline.map((event, i) => (
              <motion.li
                key={event.title}
                className="relative"
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.3 : 0.9, delay: reduced ? 0 : 0.3 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-10 top-1 inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-gold/70 bg-panel shadow-petal"
                >
                  <span className="h-2.5 w-2.5 rotate-45 bg-gold" />
                </span>
                <div className="card-petal px-5 py-4">
                  <p className="font-caps text-[0.75rem] uppercase tracking-[0.22em] text-gold-dark">{event.label}</p>
                  <p className="mt-1 font-display text-[1.45rem] font-semibold leading-tight text-burgundy">{event.title}</p>
                  {event.time && <p className="mt-1 font-caps text-[0.95rem] tracking-[0.06em] text-ink">{event.time}</p>}
                  <p className="mt-1 text-ink">{event.place}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex items-center gap-3 font-caps text-[0.8rem] uppercase tracking-[0.22em] text-burgundy sm:pt-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 jewel-chip detail-chip">{icon}</span>
        {label}
      </dt>
      <dd className="-mt-5 pl-[3.25rem] sm:mt-0 sm:pl-0">{children}</dd>
    </>
  );
}
