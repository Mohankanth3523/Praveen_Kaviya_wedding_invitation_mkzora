/**
 * RSVP rules shared by the browser form and the Cloudflare Pages Function,
 * so the UI, client validation, server validation and the saved row can never
 * disagree. Plain TypeScript, no dependencies.
 */

export const RSVP_NAME_MAX = 80;
export const RSVP_REQUEST_KEY_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

export type Attendance = 'yes' | 'no';
export type Food = 'vegetarian' | 'non-vegetarian' | 'not-coming';
/** 1–8 when attending; 0 ("None") when declining. */
export type GuestCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const GUEST_OPTIONS: readonly GuestCount[] = [1, 2, 3, 4, 5, 6, 7, 8, 0];

export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  yes: 'Yes, I will attend',
  no: 'No, I am unable to attend',
};

export const FOOD_LABELS: Record<Food, string> = {
  vegetarian: 'Vegetarian',
  'non-vegetarian': 'Non-Vegetarian',
  'not-coming': 'Not Coming',
};

/** What the browser sends. Everything is re-validated on the server. */
export interface RsvpPayload {
  name: string;
  attendance: Attendance | null;
  guests: GuestCount | null;
  food: Food | null;
  /** Random key generated once per form fill; makes retries idempotent. */
  requestKey: string;
  /** Honeypot. Real visitors never see or fill it. */
  website?: string;
}

export interface ValidRsvp {
  name: string;
  attendance: Attendance;
  guests: GuestCount;
  food: Food;
  requestKey: string;
}

export type RsvpField = 'name' | 'attendance' | 'guests' | 'food' | 'form';
export type RsvpErrors = Partial<Record<RsvpField, string>>;

/** Trim, collapse runs of whitespace, drop control characters. */
export function normaliseName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F​-‍⁠﻿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const isAttendance = (v: unknown): v is Attendance => v === 'yes' || v === 'no';
const isFood = (v: unknown): v is Food => v === 'vegetarian' || v === 'non-vegetarian' || v === 'not-coming';
const isGuestCount = (v: unknown): v is GuestCount => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 8;

/**
 * Single source of validation rules.
 * - Declining forces guests = 0 and food = "Not Coming".
 * - Attending requires 1–8 guests and Vegetarian or Non-Vegetarian.
 */
export function validateRsvp(input: unknown): { ok: true; value: ValidRsvp } | { ok: false; errors: RsvpErrors } {
  const errors: RsvpErrors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { form: 'The form could not be read. Please try again.' } };
  }
  const body = input as Record<string, unknown>;

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { ok: false, errors: { form: 'Your response could not be accepted.' } };
  }

  const name = normaliseName(body.name);
  if (!name) errors.name = 'Please enter your full name.';
  else if (name.length > RSVP_NAME_MAX) errors.name = `Please keep your name under ${RSVP_NAME_MAX} characters.`;
  else if (!/[\p{L}\p{N}]/u.test(name)) errors.name = 'Please enter your name using letters.';

  const attendance = body.attendance;
  if (!isAttendance(attendance)) errors.attendance = 'Please let us know whether you will attend.';

  let guests: GuestCount | null = null;
  let food: Food | null = null;

  if (attendance === 'no') {
    // A declined invitation is always saved as 0 guests and "Not Coming".
    // Anything else in those fields is an unexpected value and is rejected.
    if (body.guests !== 0 && body.guests !== null && body.guests !== undefined) errors.guests = 'A declined invitation has no guests.';
    if (body.food !== 'not-coming' && body.food !== null && body.food !== undefined) errors.food = 'A declined invitation is saved as “Not Coming”.';
    guests = 0;
    food = 'not-coming';
  } else if (attendance === 'yes') {
    if (!isGuestCount(body.guests) || body.guests === 0) errors.guests = 'Please choose the number of guests (1 to 8).';
    else guests = body.guests;
    if (body.food !== 'vegetarian' && body.food !== 'non-vegetarian') errors.food = 'Please choose Vegetarian or Non-Vegetarian.';
    else food = body.food;
  } else {
    // Attendance missing: still report other invalid values explicitly.
    if (body.guests !== null && body.guests !== undefined && !isGuestCount(body.guests)) errors.guests = 'Please choose the number of guests.';
    if (body.food !== null && body.food !== undefined && !isFood(body.food)) errors.food = 'Please choose a food preference.';
  }

  const requestKey = typeof body.requestKey === 'string' ? body.requestKey : '';
  if (!RSVP_REQUEST_KEY_PATTERN.test(requestKey)) errors.form = 'Please refresh the page and try again.';

  if (Object.keys(errors).length > 0 || !isAttendance(attendance) || guests === null || food === null) {
    return { ok: false, errors };
  }
  return { ok: true, value: { name, attendance, guests, food, requestKey } };
}

/**
 * Guard against spreadsheet formula injection (e.g. a name like "=HYPERLINK(...)").
 * Values are written with valueInputOption=RAW, so Sheets never evaluates them;
 * this extra prefix keeps them inert if the sheet is exported to CSV and opened
 * elsewhere. Ordinary names never start with these characters, so they are untouched.
 */
export function neutraliseCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export interface SheetRowConfig {
  weddingDate: string;
  source: string;
}

/** Column order: Submission ID, Submitted At, Guest Name, Attendance, Number of Persons, Food Preference, Wedding Date, Source, Status. */
export const SHEET_HEADERS = [
  'Submission ID',
  'Submitted At',
  'Guest Name',
  'Attendance',
  'Number of Persons',
  'Food Preference',
  'Wedding Date',
  'Source',
  'Status',
] as const;

export function toSheetRow(rsvp: ValidRsvp, submissionId: string, submittedAt: string, cfg: SheetRowConfig): (string | number)[] {
  return [
    submissionId,
    submittedAt,
    neutraliseCell(rsvp.name),
    rsvp.attendance === 'yes' ? 'Yes' : 'No',
    rsvp.guests,
    FOOD_LABELS[rsvp.food],
    cfg.weddingDate,
    cfg.source,
    rsvp.attendance === 'yes' ? 'Confirmed' : 'Declined',
  ];
}

/** ISO 8601 timestamp shown in India Standard Time, e.g. 2026-11-02T09:15:30+05:30. */
export function isoInKolkata(date: Date): string {
  const ist = new Date(date.getTime() + 5.5 * 3600_000);
  return `${ist.toISOString().slice(0, 19)}+05:30`;
}

/* -------------------------------------------------------------------------- */
/* Wire format of the deployed Google Apps Script backend                     */
/* -------------------------------------------------------------------------- */

/** Canonical request body expected by the Apps Script web app. */
export interface RsvpApiPayload {
  fullName: string;
  attendance: 'Yes' | 'No';
  /** 1–8 when attending, 0 when not attending. */
  numberOfGuests: number;
  foodPreference: 'Vegetarian' | 'Non-Vegetarian' | 'Not Coming';
  /** Client-generated; reused for every retry of the same submission. */
  submissionId: string;
  /** Honeypot (always empty for real guests). */
  website?: string;
}

/** Convert a validated form value into the backend's canonical payload. */
export function toApiPayload(rsvp: ValidRsvp, website = ''): RsvpApiPayload {
  const declined = rsvp.attendance === 'no';
  const body: RsvpApiPayload = {
    fullName: rsvp.name,
    attendance: declined ? 'No' : 'Yes',
    numberOfGuests: declined ? 0 : rsvp.guests,
    foodPreference: declined ? 'Not Coming' : (FOOD_LABELS[rsvp.food] as RsvpApiPayload['foodPreference']),
    submissionId: rsvp.requestKey,
  };
  if (website) body.website = website;
  return body;
}

