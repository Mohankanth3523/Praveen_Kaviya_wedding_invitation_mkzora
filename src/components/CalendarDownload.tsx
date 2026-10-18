import { CalendarPlus } from 'lucide-react';
import { wedding } from '../config/wedding';
import { buildICS, downloadICS } from '../utils/calendar';

/** Downloads a valid .ics for the muhurtham in Asia/Kolkata time. */
export function CalendarDownload({
  onMessage,
  variant = 'primary',
}: {
  onMessage: (text: string) => void;
  variant?: 'primary' | 'outline' | 'dark';
}) {
  const handle = () => {
    try {
      const ics = buildICS(wedding.ceremony.calendar, wedding.ceremony.venue);
      downloadICS('praveen-kaviya-wedding.ics', ics);
      onMessage('Calendar event downloaded — open it to add the muhurtham to your calendar.');
    } catch {
      onMessage('Sorry, the calendar file could not be created on this device.');
    }
  };
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'dark' ? 'btn-ghost-dark' : 'btn-outline';
  return (
    <button type="button" onClick={handle} className={cls}>
      <CalendarPlus size={16} aria-hidden="true" /> Add to Calendar
    </button>
  );
}
