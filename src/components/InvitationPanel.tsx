import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { wedding } from '../config/wedding';
import { Crest, Divider } from './Ornaments';
import { CalendarDownload } from './CalendarDownload';
import { directionsUrl } from '../utils/directions';

/**
 * "View Full Invitation": the complete invitation as plain, readable text in a
 * native modal <dialog> (focus trapping, Esc to close and inert background
 * come from the browser).
 */
export function InvitationPanel({ open, onClose, onMessage }: { open: boolean; onClose: () => void; onMessage: (t: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.classList.add('is-locked');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.body.classList.remove('is-locked');
      onClose();
      lastFocus.current?.focus?.();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const { ceremony, reception, family } = wedding;

  return (
    <dialog
      ref={ref}
      aria-labelledby="full-invitation-title"
      className="m-auto w-[min(40rem,calc(100vw-1.5rem))] max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-sm bg-transparent p-0 text-burgundy backdrop:bg-[#49333D]/45 backdrop:backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="paper gold-frame relative px-6 py-10 text-center sm:px-12">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-burgundy transition-colors hover:bg-blush"
          aria-label="Close invitation"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <Crest className="mx-auto h-12 w-20" />
        <p className="eyebrow mt-3">{wedding.invitation.blessing}</p>
        <h2 id="full-invitation-title" className="display-names mt-3 text-[clamp(2.4rem,1.9rem+3vw,3.6rem)]">
          {wedding.couple.short}
        </h2>
        <p className="mx-auto mt-3 max-w-md italic">{wedding.invitation.request}</p>

        <Divider className="mx-auto my-6 h-5 w-60" />

        <section aria-labelledby="fi-ceremony">
          <h3 id="fi-ceremony" className="eyebrow">
            {ceremony.heading}
          </h3>
          <p className="mt-2 font-caps tracking-[0.06em]">{wedding.dateLabel}</p>
          <p>
            {ceremony.timeLabel}: {ceremony.timeRange}
          </p>
          <address className="mt-2 not-italic">
            <span className="font-display text-xl font-semibold">{ceremony.venue.name}</span>
            {ceremony.venue.addressLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a className="btn-outline" href={directionsUrl(ceremony.venue)} target="_blank" rel="noopener noreferrer">
              Open Directions
            </a>
            <CalendarDownload onMessage={onMessage} variant="outline" />
          </div>
        </section>

        <Divider className="mx-auto my-6 h-5 w-60" />

        <section aria-labelledby="fi-reception">
          <h3 id="fi-reception" className="eyebrow">
            {reception.heading}
          </h3>
          <p className="mt-2 font-caps tracking-[0.06em]">{wedding.dateLabel}</p>
          {reception.time && <p>{reception.time}</p>}
          <address className="mt-2 not-italic">
            <span className="font-display text-xl font-semibold">{reception.venue.name}</span>
            {reception.venue.addressLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </address>
          <div className="mt-4 flex justify-center">
            <a className="btn-outline" href={directionsUrl(reception.venue)} target="_blank" rel="noopener noreferrer">
              Open Directions
            </a>
          </div>
        </section>

        <Divider className="mx-auto my-6 h-5 w-60" />

        <section aria-labelledby="fi-family">
          <h3 id="fi-family" className="eyebrow">
            {family.heading}
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {[family.groom, family.bride].map((person) => (
              <div key={person.name}>
                <p className="font-caps text-[0.78rem] uppercase tracking-[0.2em] text-gold-dark">{person.role}</p>
                <p className="font-display text-xl font-semibold">{person.name}</p>
                {person.qualifications && <p>{person.qualifications}</p>}
                {person.parents.map((line) => (
                  <p key={line} className="mt-1 text-[0.95rem] italic">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>

        <Divider className="mx-auto my-6 h-5 w-60" />
        <p className="eyebrow leading-relaxed">{wedding.closing.line}</p>
        <p className="display-names mt-3 text-2xl">{wedding.closing.signature}</p>
      </div>
    </dialog>
  );
}
