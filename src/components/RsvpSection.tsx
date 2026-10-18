import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CircleSlash, Drumstick, Leaf, Loader2, MapPin, CalendarDays, Check, X } from 'lucide-react';
import { wedding, RSVP_ENDPOINT } from '../config/wedding';
import { createRsvpSubmitter } from '../utils/rsvpSubmitter';
import {
  ATTENDANCE_LABELS,
  FOOD_LABELS,
  GUEST_OPTIONS,
  RSVP_NAME_MAX,
  type Attendance,
  type Food,
  type GuestCount,
  type RsvpErrors,
} from '../../shared/rsvp.ts';
import { Crest, FramedCorners } from './Ornaments';
import { Reveal } from './Reveal';

type Phase = 'editing' | 'saving' | 'saved';

const FOOD_ICONS: Record<Food, typeof Leaf> = { vegetarian: Leaf, 'non-vegetarian': Drumstick, 'not-coming': CircleSlash };

export const RSVP_MESSAGES = {
  confirmed:
    'Thank you for confirming your presence. Your response has been recorded successfully. We look forward to celebrating with you!',
  declined:
    'Thank you for letting us know. Your response has been recorded successfully. You will be missed, and we are grateful for your blessings.',
  failure: 'We couldn’t save your response right now. Your details have not been confirmed. Please try again.',
  network: 'We couldn’t save your response right now. Your details have not been confirmed. Please check your internet connection and try again.',
} as const;

/* Small, failure-tolerant browser storage helpers (private mode can throw). */
const DRAFT_KEY = 'pk-rsvp-draft';
const DONE_KEY = 'pk-rsvp-done';
interface Draft {
  name: string;
  attendance: Attendance | null;
  guests: GuestCount | null;
  food: Food | null;
  requestKey: string;
}
function readJSON<T>(store: 'local' | 'session', key: string): T | null {
  try {
    const raw = (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(store: 'local' | 'session', key: string, value: unknown) {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the form still works, it just won't survive a refresh */
  }
}

/** Premium RSVP: saves to the family's Google Sheet through the Apps Script web app. */
export function RsvpSection() {
  const reduced = useReducedMotion();
  // Restore an unsent draft (same request key → a retry after refresh can't duplicate).
  const [draft] = useState<Draft | null>(() => readJSON<Draft>('session', DRAFT_KEY));
  const [name, setName] = useState(draft?.name ?? '');
  const [attendance, setAttendance] = useState<Attendance | null>(draft?.attendance ?? null);
  const [guests, setGuests] = useState<GuestCount | null>(draft?.guests ?? null);
  const [food, setFood] = useState<Food | null>(draft?.food ?? null);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<RsvpErrors>({});
  // A confirmed response survives a refresh, so guests don't submit twice by accident.
  const [result, setResult] = useState<{ status: 'Confirmed' | 'Declined'; id: string } | null>(() =>
    readJSON<{ status: 'Confirmed' | 'Declined'; id: string }>('local', DONE_KEY),
  );
  const [phase, setPhase] = useState<Phase>(() => (result ? 'saved' : 'editing'));
  // One submitter per page: owns the submission ID (reused for every retry) and
  // ignores extra clicks while a request is in flight.
  const submitter = useRef<ReturnType<typeof createRsvpSubmitter> | null>(null);
  if (!submitter.current) {
    submitter.current = createRsvpSubmitter({ endpoint: RSVP_ENDPOINT, initialId: draft?.requestKey ?? null });
  }
  const formRef = useRef<HTMLFormElement>(null);
  const ids = useId();

  const declined = attendance === 'no';

  useEffect(() => {
    if (phase === 'saved') return;
    writeJSON('session', DRAFT_KEY, { name, attendance, guests, food, requestKey: submitter.current!.submissionId } satisfies Draft);
  }, [name, attendance, guests, food, phase]);

  const chooseAttendance = (value: Attendance) => {
    setAttendance(value);
    if (value === 'no') {
      setGuests(0);
      setFood('not-coming');
    } else {
      // Clear the forced "None / Not Coming" values when switching back.
      setGuests((g) => (g === 0 ? null : g));
      setFood((f) => (f === 'not-coming' ? null : f));
    }
    setErrors((e) => ({ ...e, attendance: undefined, guests: undefined, food: undefined, form: undefined }));
  };

  const focusFirstError = (errs: RsvpErrors) => {
    const order: (keyof RsvpErrors)[] = ['name', 'attendance', 'guests', 'food'];
    const first = order.find((k) => errs[k]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"] input:not([disabled])`);
    el?.focus();
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const sub = submitter.current!;
    if (sub.busy) return; // repeated clicks while saving are ignored
    setErrors({});
    setPhase('saving');
    const outcome = await sub.submit({ name, attendance, guests, food, website });
    if (outcome.kind === 'ignored') return;
    if (outcome.kind === 'saved') {
      const saved = { status: (attendance === 'no' ? 'Declined' : 'Confirmed') as 'Confirmed' | 'Declined', id: outcome.submissionId };
      writeJSON('local', DONE_KEY, saved);
      writeJSON('session', DRAFT_KEY, null);
      setResult(saved);
      setPhase('saved');
      return;
    }
    setPhase('editing');
    if (outcome.kind === 'validation' || outcome.kind === 'invalid') {
      const fields = outcome.fields;
      setErrors(Object.keys(fields).length ? fields : { form: RSVP_MESSAGES.failure });
      focusFirstError(fields);
      return;
    }
    // Diagnostic for the site owner (never contains guest details).
    console.error(
      outcome.reason === 'not_configured'
        ? '[rsvp] No valid Apps Script URL. Set RSVP_APPS_SCRIPT_URL in src/config/wedding.ts — see RSVP_SETUP.md.'
        : outcome.reason === 'blocked'
          ? '[rsvp] Request blocked before reaching the script. Most likely the Apps Script deployment is not set to "Who has access: Anyone", so Google redirects guests to sign-in. Run `npm run check:rsvp` to confirm — see RSVP_SETUP.md.'
          : `[rsvp] Save not confirmed: ${outcome.reason}${outcome.detail ? ` (${outcome.detail})` : ''}`,
    );
    setErrors({ form: outcome.reason === 'offline' ? RSVP_MESSAGES.network : RSVP_MESSAGES.failure });
  };

  const reset = () => {
    submitter.current!.startNew();
    writeJSON('local', DONE_KEY, null);
    setName('');
    setAttendance(null);
    setGuests(null);
    setFood(null);
    setErrors({});
    setResult(null);
    setPhase('editing');
  };

  const saving = phase === 'saving';

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="ivory-silk scroll-mt-16 px-4 py-[clamp(4rem,10vw,7rem)]">
      <Reveal className="mx-auto max-w-3xl">
        <div className="frame-double relative bg-[#FFF9F0]/90 px-5 pb-10 pt-12 shadow-[0_30px_70px_-40px_rgba(61,16,32,0.55)] sm:px-12 sm:pb-12">
          <FramedCorners inset="inset-3" />

          {/* Header */}
          <header className="text-center">
            <Crest className="mx-auto h-11 w-16" />
            <p className="mt-4 font-caps text-[clamp(1.05rem,0.9rem+0.8vw,1.4rem)] uppercase tracking-[0.3em] text-burgundy">
              {wedding.couple.short}
            </p>
            <p className="mt-1 font-display text-[1.2rem] italic text-[#A98442]">Wedding Celebration</p>
            <h2 id="rsvp-title" className="gold-foil-dark mt-4 pb-1 font-display text-[clamp(2rem,1.5rem+2.4vw,3rem)] font-semibold leading-tight">
              Kindly Confirm Your Presence
            </h2>
            <p className="mx-auto mt-3 max-w-md font-display text-[1.15rem] italic leading-relaxed text-[#35251F]/85">
              “Your presence will make our special day even more memorable.”
            </p>
            <div className="frieze mx-auto mt-6 w-60" aria-hidden="true" />
            <div className="mx-auto mt-6 grid max-w-xl gap-4 text-left font-rsvp text-[0.95rem] text-[#35251F] sm:grid-cols-2">
              <p className="flex items-start gap-2">
                <CalendarDays size={18} className="mt-0.5 shrink-0 text-[#A98442]" aria-hidden="true" />
                <span>{wedding.dateLabel}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 shrink-0 text-[#A98442]" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Reception · {wedding.reception.venue.name}</span>
                  <br />
                  {wedding.reception.venue.addressLines.join(' ').replace(/,\s*Tamil Nadu, India\.?$/, '')}
                </span>
              </p>
            </div>
          </header>

          <div className="mt-10 min-h-[30rem]">
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'saved' && result ? (
                <motion.div
                  key="done"
                  className="flex min-h-[30rem] flex-col items-center justify-center text-center"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                  role="status"
                  aria-live="polite"
                >
                  <motion.span
                    className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#D6B36A] bg-[#FFF9F0] text-[#A98442] shadow-[0_0_0_6px_rgba(214,179,106,0.15)]"
                    initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 14 }}
                  >
                    <Check size={36} strokeWidth={1.5} aria-hidden="true" />
                  </motion.span>
                  {result.status === 'Confirmed' ? (
                    <>
                      <h3 className="gold-foil-dark mt-6 pb-1 font-display text-[2.6rem] font-semibold">Thank You!</h3>
                      <p className="mt-2 max-w-md font-display text-[1.25rem] italic leading-relaxed text-[#35251F]">
                        {RSVP_MESSAGES.confirmed}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="gold-foil-dark mt-6 pb-1 font-display text-[2.6rem] font-semibold">Thank You</h3>
                      <p className="mt-2 max-w-md font-display text-[1.25rem] italic leading-relaxed text-[#35251F]">
                        {RSVP_MESSAGES.declined}
                      </p>
                    </>
                  )}
                  <p className="mt-5 font-rsvp text-[0.8rem] tracking-wide text-[#35251F]/60">Reference {result.id}</p>
                  <button type="button" onClick={reset} className="mt-6 font-rsvp text-[0.9rem] text-burgundy underline decoration-[#D6B36A] underline-offset-4 hover:text-[#3D1020]">
                    Respond for another guest
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  ref={formRef}
                  noValidate
                  onSubmit={submit}
                  className="space-y-9 font-rsvp text-[#35251F]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-busy={saving}
                >
                  {/* Honeypot: hidden from people and assistive tech. */}
                  <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                    <label>
                      Website
                      <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </label>
                  </div>

                  {/* 1. Name */}
                  <div data-field="name">
                    <label htmlFor={`${ids}-name`} className="rsvp-label">
                      Full Name <Required />
                    </label>
                    <input
                      id={`${ids}-name`}
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={RSVP_NAME_MAX + 20}
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                      }}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? `${ids}-name-error` : undefined}
                      disabled={saving}
                      className={`rsvp-input ${errors.name ? 'rsvp-invalid' : ''}`}
                    />
                    <FieldError id={`${ids}-name-error`} message={errors.name} />
                  </div>

                  {/* 2. Attendance */}
                  <fieldset data-field="attendance" aria-describedby={errors.attendance ? `${ids}-att-error` : undefined}>
                    <legend className="rsvp-label">
                      Will you be attending the wedding celebration? <Required />
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(['yes', 'no'] as Attendance[]).map((value) => (
                        <OptionCard
                          key={value}
                          name="attendance"
                          checked={attendance === value}
                          disabled={saving}
                          invalid={Boolean(errors.attendance)}
                          onChange={() => chooseAttendance(value)}
                          icon={value === 'yes' ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
                        >
                          {ATTENDANCE_LABELS[value]}
                        </OptionCard>
                      ))}
                    </div>
                    <FieldError id={`${ids}-att-error`} message={errors.attendance} />
                  </fieldset>

                  {/* 3. Guests */}
                  <fieldset data-field="guests" aria-describedby={`${ids}-guests-note${errors.guests ? ` ${ids}-guests-error` : ''}`}>
                    <legend className="rsvp-label">
                      Total Number of Guests <Required />
                    </legend>
                    <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-9">
                      {GUEST_OPTIONS.map((n) => {
                        const isNone = n === 0;
                        const disabled = saving || declined || (attendance === 'yes' && isNone);
                        const checked = guests === n;
                        return (
                          <label
                            key={n}
                            className={`rsvp-chip ${checked ? 'rsvp-selected' : ''} ${disabled ? 'rsvp-disabled' : ''} ${errors.guests ? 'rsvp-invalid' : ''} ${isNone ? 'col-span-2 sm:col-span-1' : ''}`}
                          >
                            <input
                              type="radio"
                              name="guests"
                              value={n}
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                setGuests(n);
                                setErrors((e) => ({ ...e, guests: undefined }));
                              }}
                              className="sr-only"
                            />
                            {isNone ? 'None' : n}
                          </label>
                        );
                      })}
                    </div>
                    <p id={`${ids}-guests-note`} className="mt-2 text-[0.85rem] text-[#35251F]/70">
                      {declined
                        ? 'Set to “None” automatically, because you are unable to attend.'
                        : 'Include yourself. “None” is only used when you are unable to attend.'}
                    </p>
                    <FieldError id={`${ids}-guests-error`} message={errors.guests} />
                  </fieldset>

                  {/* 4. Food */}
                  <fieldset data-field="food" aria-describedby={`${ids}-food-note${errors.food ? ` ${ids}-food-error` : ''}`}>
                    <legend className="rsvp-label">
                      Food Preference <Required />
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {(Object.keys(FOOD_LABELS) as Food[]).map((value) => {
                        const Icon = FOOD_ICONS[value];
                        const disabled = saving || (declined ? value !== 'not-coming' : value === 'not-coming');
                        return (
                          <OptionCard
                            key={value}
                            name="food"
                            checked={food === value}
                            disabled={disabled}
                            invalid={Boolean(errors.food)}
                            onChange={() => {
                              setFood(value);
                              setErrors((e) => ({ ...e, food: undefined }));
                            }}
                            icon={<Icon size={18} aria-hidden="true" />}
                          >
                            {FOOD_LABELS[value]}
                          </OptionCard>
                        );
                      })}
                    </div>
                    <p id={`${ids}-food-note`} className="mt-2 text-[0.85rem] text-[#35251F]/70">
                      {declined ? 'Set to “Not Coming” automatically, because you are unable to attend.' : 'Choose Vegetarian or Non-Vegetarian.'}
                    </p>
                    <FieldError id={`${ids}-food-error`} message={errors.food} />
                  </fieldset>

                  <div aria-live="assertive" className="min-h-[1px]">
                    {errors.form && (
                      <div className="flex flex-col items-start gap-3 rounded-sm border border-burgundy/30 bg-burgundy/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
                        <p className="text-[0.95rem] text-burgundy">{errors.form}</p>
                        {(errors.form === RSVP_MESSAGES.failure || errors.form === RSVP_MESSAGES.network) && (
                          <button
                            type="button"
                            onClick={() => void submit()}
                            disabled={saving}
                            className="shrink-0 rounded-full border border-burgundy/50 px-4 py-2 text-[0.85rem] font-semibold text-burgundy transition-colors hover:bg-burgundy/5"
                          >
                            Try again
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rsvp-submit"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                          Saving your response…
                        </>
                      ) : declined ? (
                        'Send My Response'
                      ) : (
                        'Confirm My Presence'
                      )}
                    </button>
                  </div>
                  <p className="text-center text-[0.8rem] text-[#35251F]/60">
                    Your name and reply are shared only with the family.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Required() {
  return (
    <span className="text-burgundy" aria-hidden="true">
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} className={`mt-2 min-h-[1.25rem] text-[0.88rem] text-[#9B1C2E] ${message ? '' : 'invisible'}`} aria-live="polite">
      {message}
    </p>
  );
}

function OptionCard({
  name,
  checked,
  disabled,
  invalid,
  onChange,
  icon,
  children,
}: {
  name: string;
  checked: boolean;
  disabled: boolean;
  invalid: boolean;
  onChange: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className={`rsvp-card ${checked ? 'rsvp-selected' : ''} ${disabled ? 'rsvp-disabled' : ''} ${invalid ? 'rsvp-invalid' : ''}`}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      <span className="rsvp-dot" aria-hidden="true" />
      <span className="text-[#A98442]">{icon}</span>
      <span className="flex-1">{children}</span>
    </label>
  );
}
