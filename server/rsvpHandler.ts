import { isoInKolkata, toSheetRow, validateRsvp, type RsvpErrors } from '../shared/rsvp.ts';
import { appendRow, SheetsError, submissionExists, type SheetsConfig } from './googleSheets.ts';

/** Server-side secrets and settings (Cloudflare Pages → Settings → Variables and Secrets). */
export interface RsvpEnv {
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_SHEET_TAB?: string;
}

export interface RsvpDeps {
  fetch: typeof fetch;
  now: () => number;
}

/** Trusted values; never taken from the browser. */
export const RSVP_SERVER_CONFIG = {
  weddingDate: '2026-11-29',
  source: 'Wedding Website',
  defaultTab: 'RSVP Responses',
  maxBodyBytes: 2048,
  rateLimit: { max: 8, windowMs: 10 * 60_000 },
} as const;

export type RsvpResponseBody =
  | { ok: true; submissionId: string; status: 'Confirmed' | 'Declined'; duplicate?: boolean }
  | { ok: false; error: 'validation'; fields: RsvpErrors }
  | { ok: false; error: 'method_not_allowed' | 'unsupported_media' | 'forbidden' | 'too_large' | 'rate_limited' | 'bad_json' | 'not_configured' | 'sheets_unavailable' | 'sheets_failed'; message: string };

const json = (body: RsvpResponseBody, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra },
  });

/*
 * Best-effort abuse controls. Memory is per Worker isolate, so this slows down
 * casual abuse but is not a global limit; add a Cloudflare WAF rate-limiting
 * rule on /api/rsvp for a hard limit (see RSVP_SETUP.md).
 */
const hits = new Map<string, number[]>();
const inFlight = new Map<string, Promise<Response>>();

export function resetRateLimits() {
  hits.clear();
  inFlight.clear();
}

function rateLimited(ip: string, now: number): number {
  const { max, windowMs } = RSVP_SERVER_CONFIG.rateLimit;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return Math.ceil((windowMs - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return 0;
}

async function submissionIdFor(requestKey: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`pk-rsvp:${requestKey}`));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `RSVP-${hex.slice(0, 8)}-${hex.slice(8, 16)}`;
}

function readConfig(env: RsvpEnv): SheetsConfig | null {
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyPem = env.GOOGLE_PRIVATE_KEY?.trim();
  const spreadsheetId = env.GOOGLE_SHEET_ID?.trim();
  if (!clientEmail || !privateKeyPem || !spreadsheetId) return null;
  return { clientEmail, privateKeyPem, spreadsheetId, tab: env.GOOGLE_SHEET_TAB?.trim() || RSVP_SERVER_CONFIG.defaultTab };
}

export async function handleRsvp(request: Request, env: RsvpEnv, deps: RsvpDeps = { fetch, now: Date.now }): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed', message: 'Use POST.' }, 405, { allow: 'POST' });
  }
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return json({ ok: false, error: 'unsupported_media', message: 'Expected JSON.' }, 415);
  }
  // Same-origin only: browsers always send Origin on cross-site POSTs.
  const origin = request.headers.get('origin');
  if (origin) {
    let same = false;
    try {
      same = new URL(origin).host === new URL(request.url).host;
    } catch {
      same = false;
    }
    if (!same) return json({ ok: false, error: 'forbidden', message: 'Cross-site requests are not accepted.' }, 403);
  }
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > RSVP_SERVER_CONFIG.maxBodyBytes) {
    return json({ ok: false, error: 'too_large', message: 'Request too large.' }, 413);
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > RSVP_SERVER_CONFIG.maxBodyBytes) {
    return json({ ok: false, error: 'too_large', message: 'Request too large.' }, 413);
  }

  const now = deps.now();
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const retryAfter = rateLimited(ip, now);
  if (retryAfter > 0) {
    return json({ ok: false, error: 'rate_limited', message: 'Too many attempts. Please wait a few minutes and try again.' }, 429, {
      'retry-after': String(retryAfter),
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'bad_json', message: 'The form could not be read.' }, 400);
  }

  const result = validateRsvp(payload);
  if (!result.ok) return json({ ok: false, error: 'validation', fields: result.errors }, 400);

  const cfg = readConfig(env);
  if (!cfg) {
    console.error('[rsvp] Google Sheets is not configured (missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY or GOOGLE_SHEET_ID).');
    return json({ ok: false, error: 'not_configured', message: 'RSVP saving is not set up yet. Please contact the family.' }, 500);
  }

  const rsvp = result.value;
  // Repeated clicks or retries carry the same request key → same submission ID.
  const existing = inFlight.get(rsvp.requestKey);
  if (existing) return (await existing).clone();

  const work = (async (): Promise<Response> => {
    const submissionId = await submissionIdFor(rsvp.requestKey);
    const status = rsvp.attendance === 'yes' ? 'Confirmed' : 'Declined';
    try {
      if (await submissionExists(cfg, submissionId, deps.fetch, now)) {
        return json({ ok: true, submissionId, status, duplicate: true }, 200);
      }
      const row = toSheetRow(rsvp, submissionId, isoInKolkata(new Date(now)), RSVP_SERVER_CONFIG);
      await appendRow(cfg, row, deps.fetch, now);
      return json({ ok: true, submissionId, status }, 201);
    } catch (error) {
      const e = error instanceof SheetsError ? error : new SheetsError('Unexpected error', 500, 'api');
      // Log the failure class only; never the guest's details.
      console.error(`[rsvp] Save failed: ${e.kind} ${e.status} ${e.message}`);
      if (e.kind === 'rate_limited' || e.kind === 'network') {
        return json({ ok: false, error: 'sheets_unavailable', message: 'We could not save your response just now. Please try again in a moment.' }, 503, { 'retry-after': '30' });
      }
      return json({ ok: false, error: 'sheets_failed', message: 'We could not save your response. Please try again.' }, 502);
    }
  })();
  inFlight.set(rsvp.requestKey, work);
  try {
    return (await work).clone();
  } finally {
    inFlight.delete(rsvp.requestKey);
  }
}
