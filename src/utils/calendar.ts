import type { CalendarEventConfig, Venue } from '../config/wedding';

/** Escape text per RFC 5545 §3.3.11. */
export function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Fold content lines longer than 75 octets (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** "2026-11-29T04:45:00" → "20261129T044500" (local wall-clock time). */
export function toICSLocal(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(iso);
  if (!match) throw new Error(`Invalid local date-time: ${iso}`);
  const [, y, mo, d, h, mi, s = '00'] = match;
  return `${y}${mo}${d}T${h}${mi}${s}`;
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function buildICS(event: CalendarEventConfig, venue: Venue, now = new Date()): string {
  const location = [venue.name, ...venue.addressLines].join(', ').replace(/,\s*,/g, ',').replace(/[,.]\s*$/, '');
  const uid = `wedding-${toICSLocal(event.start)}-praveen-kaviya@invitation`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Praveen & Kaviya//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // India Standard Time has no daylight saving; a single STANDARD block is exact.
    'BEGIN:VTIMEZONE',
    `TZID:${event.timeZone}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART;TZID=${event.timeZone}:${toICSLocal(event.start)}`,
    `DTEND;TZID=${event.timeZone}:${toICSLocal(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Muhurtham for Praveen & Kaviya at 4:45 AM tomorrow',
    'TRIGGER:-PT12H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadICS(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give Safari a moment before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
