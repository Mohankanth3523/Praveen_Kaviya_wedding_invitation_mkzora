import { useEffect, useState } from 'react';
import { wedding } from '../config/wedding';
import { Reveal } from './Reveal';

function remaining(target: number, now: number) {
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

/** Live countdown to the real muhurtham time (4:45 AM IST, 29 Nov 2026). */
export function Countdown() {
  const target = Date.parse(wedding.countdownTarget);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const r = remaining(target, now);
  const units: [string, number][] = [
    ['Days', r.days],
    ['Hours', r.hours],
    ['Minutes', r.minutes],
    ['Seconds', r.seconds],
  ];

  return (
    <section aria-labelledby="countdown-title" className="ivory-silk px-4 py-[clamp(3.5rem,8vw,5.5rem)] text-center">
      <Reveal className="mx-auto max-w-4xl">
        <p className="eyebrow text-burgundy/75">Counting the moments</p>
        <h2 id="countdown-title" className="mt-2 font-caps text-[clamp(1.3rem,1.05rem+1vw,1.9rem)] uppercase tracking-[0.2em] text-burgundy">
          Until the Muhurtham
        </h2>
        <div className="frieze mx-auto mt-5 w-64" aria-hidden="true" />
        {r.done ? (
          <p className="mt-8 font-display text-3xl italic text-burgundy">The blessed day is here.</p>
        ) : (
          <>
            <div className="mx-auto mt-9 grid max-w-2xl grid-cols-4 gap-2 sm:gap-5" aria-hidden="true">
              {units.map(([label, value]) => (
                <div key={label} className="frame-double bg-ivory/70 px-1 py-4 sm:py-6">
                  <div className="numeral gold-foil-dark text-[clamp(2rem,1.4rem+3vw,3.6rem)] font-semibold leading-none">
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="mt-2 font-caps text-[0.6rem] uppercase tracking-[0.2em] text-burgundy/80 sm:text-[0.7rem]">{label}</div>
                </div>
              ))}
            </div>
            <p className="sr-only">
              {r.days} days, {r.hours} hours and {r.minutes} minutes until the muhurtham.
            </p>
          </>
        )}
        <p className="mt-7 font-caps text-[0.95rem] tracking-[0.1em] text-burgundy">
          {wedding.dateLabel} · {wedding.ceremony.timeRange}
        </p>
      </Reveal>
    </section>
  );
}
