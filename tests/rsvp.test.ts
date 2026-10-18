/**
 * RSVP test suite — `npm test` (Node's built-in runner; no extra packages).
 *
 * Covers three layers with mocks only:
 *  A. The form logic the component uses (src/utils/rsvpSubmitter.ts): validation,
 *     repeated-click prevention, stable submission IDs across retries.
 *  B. The network client (src/utils/rsvpClient.ts): request format, Apps Script
 *     CORS behaviour, success only when the backend confirms, failures.
 *  C. The repository's Apps Script (apps-script/Code.gs) running against an
 *     in-memory sheet, fed the exact payload the website sends.
 *
 * None of this proves a live write to the real Google Sheet; see RSVP_SETUP.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { toApiPayload, validateRsvp } from '../shared/rsvp.ts';
import { interpretReply, submitRsvp } from '../src/utils/rsvpClient.ts';
import { createRsvpSubmitter, type RsvpFormValues } from '../src/utils/rsvpSubmitter.ts';
import { freshEnv, loadAppsScript, type FakeEnv } from './fakeAppsScript.ts';

const URL_OK = 'https://script.google.com/macros/s/AKfycbxmkUT_fwdlCewPmxMeNfuEYOIEi097Pqja--Xh4mNKMGgaltHtnlevkdX4FFgztSNP/exec';
const HEADERS = ['Timestamp', 'Full Name', 'Attendance', 'Number of Guests', 'Food Preference', 'Submission ID'];

const attending = (over: Partial<RsvpFormValues> = {}): RsvpFormValues => ({ name: 'Priya Raman', attendance: 'yes', guests: 2, food: 'vegetarian', ...over });
const declining = (over: Partial<RsvpFormValues> = {}): RsvpFormValues => ({ name: 'Meena', attendance: 'no', guests: 0, food: 'not-coming', ...over });

/** A fetch mock that records each request body and answers with `reply`. */
function mockFetch(reply: (body: Record<string, unknown>) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit; body: Record<string, unknown> }[] = [];
  const fn = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    calls.push({ url: String(url), init: init!, body });
    return reply(body);
  }) as typeof fetch;
  return { fn, calls };
}
const okReply = (b: Record<string, unknown>) => Response.json({ ok: true, success: true, status: 'success', submissionId: b.submissionId });

/* ------------------------------ A. form logic ------------------------------- */

test('valid attending RSVP sends the canonical payload and is saved', async () => {
  const m = mockFetch(okReply);
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn });
  const out = await sub.submit(attending({ name: '  Priya   Raman ' }));
  assert.equal(out.kind, 'saved');
  assert.equal(m.calls.length, 1);
  assert.deepEqual(m.calls[0].body, {
    fullName: 'Priya Raman',
    attendance: 'Yes',
    numberOfGuests: 2,
    foodPreference: 'Vegetarian',
    submissionId: sub.submissionId,
  });
  assert.equal(m.calls[0].url, URL_OK);
});

test('valid non-attending RSVP sends 0 guests and Not Coming', async () => {
  const m = mockFetch(okReply);
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn });
  const out = await sub.submit(declining({ guests: null, food: null }));
  assert.equal(out.kind, 'saved');
  assert.deepEqual(
    { a: m.calls[0].body.attendance, g: m.calls[0].body.numberOfGuests, f: m.calls[0].body.foodPreference },
    { a: 'No', g: 0, f: 'Not Coming' },
  );
});

test('missing guest name is rejected before any request', async () => {
  const m = mockFetch(okReply);
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn });
  for (const name of ['', '   ', '​']) {
    const out = await sub.submit(attending({ name }));
    assert.equal(out.kind, 'validation');
    if (out.kind === 'validation') assert.ok(out.fields.name);
  }
  assert.equal(m.calls.length, 0);
});

test('invalid attendance, guest count and food preference are rejected before any request', async () => {
  const m = mockFetch(okReply);
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn });
  const cases: [Partial<RsvpFormValues>, string][] = [
    [{ attendance: null }, 'attendance'],
    [{ attendance: 'maybe' as never }, 'attendance'],
    [{ guests: null }, 'guests'],
    [{ guests: 0 }, 'guests'],
    [{ guests: 9 }, 'guests'],
    [{ guests: 2.5 }, 'guests'],
    [{ food: null }, 'food'],
    [{ food: 'not-coming' }, 'food'],
    [{ food: 'vegan' as never }, 'food'],
  ];
  for (const [over, field] of cases) {
    const out = await sub.submit(attending(over));
    assert.equal(out.kind, 'validation', JSON.stringify(over));
    if (out.kind === 'validation') assert.ok((out.fields as Record<string, string>)[field], `${field} for ${JSON.stringify(over)}`);
  }
  const bad = await sub.submit(declining({ guests: 3 }));
  assert.equal(bad.kind, 'validation');
  assert.equal(m.calls.length, 0);
});

test('repeated clicks while saving send exactly one request', async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const m = mockFetch(async (b) => {
    await gate;
    return okReply(b);
  });
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn });
  const first = sub.submit(attending());
  assert.equal(sub.busy, true, 'loading state is visible while saving');
  const second = await sub.submit(attending());
  const third = await sub.submit(attending());
  assert.equal(second.kind, 'ignored');
  assert.equal(third.kind, 'ignored');
  release();
  assert.equal((await first).kind, 'saved');
  assert.equal(sub.busy, false, 'loading state ends');
  assert.equal(m.calls.length, 1);
});

test('retry after a failure reuses the same submission ID; a new RSVP gets a new one', async () => {
  let attempt = 0;
  const m = mockFetch((b) => {
    attempt++;
    if (attempt === 1) throw new TypeError('Failed to fetch');
    return okReply(b);
  });
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: m.fn, isOnline: () => false });
  const id = sub.submissionId;
  const failed = await sub.submit(attending());
  assert.deepEqual(failed, { kind: 'failed', reason: 'offline', detail: 'TypeError' });
  assert.equal(sub.busy, false, 'button is restored after a failure');
  const retried = await sub.submit(attending());
  assert.equal(retried.kind, 'saved');
  assert.equal(m.calls[0].body.submissionId, id);
  assert.equal(m.calls[1].body.submissionId, id);
  sub.startNew();
  assert.notEqual(sub.submissionId, id);
});

test('a draft restored after refresh keeps its submission ID', () => {
  const id = randomUUID();
  assert.equal(createRsvpSubmitter({ endpoint: URL_OK, initialId: id }).submissionId, id);
  assert.notEqual(createRsvpSubmitter({ endpoint: URL_OK, initialId: 'bad id!' }).submissionId, 'bad id!');
});

/* ----------------------------- B. network client ---------------------------- */

const payload = () => toApiPayload((validateRsvp({ ...attending(), requestKey: randomUUID() }) as { ok: true; value: Parameters<typeof toApiPayload>[0] }).value);

test('uses a CORS-simple text/plain POST that Apps Script can answer (never no-cors)', async () => {
  const m = mockFetch(okReply);
  await submitRsvp(URL_OK, payload(), m.fn);
  const init = m.calls[0].init;
  assert.equal(init.method, 'POST');
  assert.equal((init.headers as Record<string, string>)['content-type'], 'text/plain;charset=utf-8');
  assert.equal(init.redirect, 'follow');
  assert.notEqual(init.mode, 'no-cors');
});

test('success is shown only when the backend explicitly confirms', () => {
  const id = randomUUID();
  assert.equal(interpretReply({ ok: true, submissionId: id }, id).kind, 'saved');
  assert.equal(interpretReply({ success: true }, id).kind, 'saved');
  assert.equal(interpretReply({ status: 'success' }, id).kind, 'saved');
  assert.equal(interpretReply({ result: 'success', submissionId: id }, id).kind, 'saved');
  assert.equal(interpretReply({ result: 'error', message: 'Sheet not found' }, id).kind, 'failed');
  const dup = interpretReply({ ok: true, status: 'duplicate', submissionId: id }, id);
  assert.deepEqual(dup, { kind: 'saved', submissionId: id, duplicate: true });
  // Unconfirmed: nothing says it was saved, or it contradicts itself.
  for (const body of [{}, { message: 'received' }, null, [], 'ok', { ok: true, error: 'x' }, { ok: true, submissionId: 'someone-else-0000' }]) {
    assert.equal(interpretReply(body, id).kind, 'failed', JSON.stringify(body));
  }
});

test('live Version 2 replies (captured 18 Oct 2026) are interpreted correctly', () => {
  const id = 'claude-test-2026-10-18-v2-0001';
  const saved = { success: true, message: 'Your RSVP has been saved successfully.', reference: id };
  const again = { success: true, message: 'Your RSVP has already been received.', reference: id };
  assert.deepEqual(interpretReply(saved, id), { kind: 'saved', submissionId: id, duplicate: false });
  assert.deepEqual(interpretReply(again, id), { kind: 'saved', submissionId: id, duplicate: true });
  // A reference for a different submission is never accepted as ours.
  assert.equal(interpretReply({ ...saved, reference: 'another-guest-submission' }, id).kind, 'failed');
  // The health-check GET reply is not a save confirmation for a POST we did not make.
  assert.equal(interpretReply({ success: true, message: 'Praveen & Kaviya RSVP service is running.', reference: 'x' }, id).kind, 'failed');
});

test('the configured endpoint is the Version 2 deployment', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../src/config/wedding.ts', import.meta.url), 'utf8');
  assert.match(src, /AKfycby4pCKK4i6AHyGIgQPHz2asoKQyiXTi7i2fjvALjM-ldnU7ih2Cqu5DUTVJ9_qDAz9e\/exec/);
  assert.doesNotMatch(src, /AKfycbxmkUT_/, 'old (sign-in protected) deployment must not be used');
});

test('unconfirmed submissions: HTML, sign-in pages and timeouts are never success', async () => {
  const html = mockFetch(() => new Response('<html><body>Error</body></html>', { status: 200 }));
  assert.deepEqual(await submitRsvp(URL_OK, payload(), html.fn), { kind: 'failed', reason: 'unconfirmed', detail: 'HTTP 200' });
  const signin = mockFetch(() => new Response('<html><a href="https://accounts.google.com/ServiceLogin">', { status: 200 }));
  assert.equal(((await submitRsvp(URL_OK, payload(), signin.fn)) as { reason: string }).reason, 'blocked');
  const slow = (async (_u: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_r, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))) as typeof fetch;
  assert.deepEqual(await submitRsvp(URL_OK, payload(), slow, { timeoutMs: 20 }), { kind: 'failed', reason: 'unconfirmed', detail: 'timeout' });
});

test('network failures: offline vs blocked (CORS / not shared with "Anyone")', async () => {
  const boom = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;
  assert.equal(((await submitRsvp(URL_OK, payload(), boom, { isOnline: () => false })) as { reason: string }).reason, 'offline');
  assert.equal(((await submitRsvp(URL_OK, payload(), boom, { isOnline: () => true })) as { reason: string }).reason, 'blocked');
});

test('backend errors are reported, with field errors passed through', async () => {
  const err = mockFetch(() => Response.json({ ok: false, error: 'sheet_unavailable' }));
  assert.deepEqual(await submitRsvp(URL_OK, payload(), err.fn), { kind: 'failed', reason: 'server', detail: 'sheet_unavailable' });
  const busy = mockFetch(() => Response.json({ success: false, error: 'busy' }));
  assert.equal(((await submitRsvp(URL_OK, payload(), busy.fn)) as { reason: string }).reason, 'busy');
  const invalid = mockFetch(() => Response.json({ ok: false, error: 'validation', fields: { name: 'Please enter your full name.' } }));
  assert.deepEqual(await submitRsvp(URL_OK, payload(), invalid.fn), { kind: 'invalid', fields: { name: 'Please enter your full name.' }, message: undefined });
});

test('a missing or wrong endpoint never sends a request', async () => {
  const m = mockFetch(okReply);
  for (const url of ['', 'api/rsvp', 'https://example.com/exec', 'http://script.google.com/macros/s/x/exec']) {
    assert.deepEqual(await submitRsvp(url, payload(), m.fn), { kind: 'failed', reason: 'not_configured' });
  }
  assert.equal(m.calls.length, 0);
});

/* ------------------- C. repository Apps Script (Code.gs) -------------------- */

const dataRows = (env: FakeEnv) => env.sheet!.rows.slice(1).filter((r) => r.length > 0);
function setup(rows?: (string | number)[][]) {
  const env = freshEnv(rows);
  return { env, gs: loadAppsScript(env) };
}
/** Pipes the real client into the real Code.gs (in-process). */
const bridge = (gs: ReturnType<typeof loadAppsScript>) =>
  (async (_u: RequestInfo | URL, init?: RequestInit) => Response.json(gs.post(String(init?.body)))) as typeof fetch;

test('Code.gs: website payload (attending, 1 guest and 8 guests) → one row each', async () => {
  const { env, gs } = setup();
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: bridge(gs) });
  assert.equal((await sub.submit(attending({ guests: 1 }))).kind, 'saved');
  const firstId = sub.submissionId;
  sub.startNew();
  assert.equal((await sub.submit(attending({ name: 'Arun Kumar', guests: 8, food: 'non-vegetarian' }))).kind, 'saved');
  assert.deepEqual(env.sheet!.rows[0], HEADERS);
  const rows = dataRows(env);
  assert.equal(rows.length, 2);
  assert.match(String(rows[0][0]), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.deepEqual(rows[0].slice(1), ['Priya Raman', 'Yes', 1, 'Vegetarian', firstId]);
  assert.deepEqual(rows[1].slice(1, 5), ['Arun Kumar', 'Yes', 8, 'Non-Vegetarian']);
});

test('Code.gs: not attending → No | 0 | Not Coming', async () => {
  const { env, gs } = setup();
  const sub = createRsvpSubmitter({ endpoint: URL_OK, fetchImpl: bridge(gs) });
  assert.equal((await sub.submit(declining())).kind, 'saved');
  assert.deepEqual(dataRows(env)[0].slice(1, 5), ['Meena', 'No', 0, 'Not Coming']);
});

test('Code.gs: retry with the same submission ID creates no second row', async () => {
  const { env, gs } = setup();
  const body = { fullName: 'Senthil', attendance: 'Yes', numberOfGuests: 3, foodPreference: 'Vegetarian', submissionId: randomUUID() };
  const a = gs.post(body);
  const b = gs.post(body);
  assert.equal(a.ok, true);
  assert.equal(b.duplicate, true);
  assert.equal(dataRows(env).length, 1);
});

test('Code.gs: accepts documented aliases (name, guests, empty guests when declining)', () => {
  const { env, gs } = setup();
  assert.equal(gs.post({ name: 'Alias Guest', attendance: 'Yes', guests: 2, foodPreference: 'Non-Vegetarian', submissionId: randomUUID() }).ok, true);
  assert.equal(gs.post({ fullName: 'Empty Guests', attendance: 'No', numberOfGuests: '', foodPreference: 'Not Coming', submissionId: randomUUID() }).ok, true);
  assert.deepEqual(dataRows(env).map((r) => r.slice(1, 5)), [
    ['Alias Guest', 'Yes', 2, 'Non-Vegetarian'],
    ['Empty Guests', 'No', 0, 'Not Coming'],
  ]);
});

test('Code.gs: invalid submissions create no rows', () => {
  const { env, gs } = setup();
  const base = { fullName: 'Guest', attendance: 'Yes', numberOfGuests: 2, foodPreference: 'Vegetarian' };
  const bad = [
    { ...base, fullName: '   ' },
    { ...base, attendance: 'Maybe' },
    { ...base, numberOfGuests: 0 },
    { ...base, numberOfGuests: 9 },
    { ...base, foodPreference: 'Not Coming' },
    { ...base, foodPreference: 'Vegan' },
    { ...base, attendance: 'No', numberOfGuests: 4, foodPreference: 'Not Coming' },
    { ...base, attendance: 'No', numberOfGuests: 0, foodPreference: 'Vegetarian' },
    { ...base, submissionId: 'x' },
  ];
  for (const b of bad) assert.equal(gs.post({ submissionId: randomUUID(), ...b }).ok, false, JSON.stringify(b));
  assert.equal(gs.post('{not json').ok, false);
  assert.equal(gs.post({ fullName: 'x'.repeat(2500) }).error, 'too_large');
  assert.equal(env.sheet!.rows.length, 0);
});

test('Code.gs: authorization failure, missing tab, busy lock → error, never success', () => {
  const { env, gs } = setup();
  const body = () => ({ fullName: 'Divya', attendance: 'Yes', numberOfGuests: 2, foodPreference: 'Vegetarian', submissionId: randomUUID() });
  env.openFails = true;
  assert.deepEqual([gs.post(body()).ok, gs.post(body()).error], [false, 'sheet_unavailable']);
  env.openFails = false;
  env.sheet!.name = 'Responses';
  assert.equal(gs.post(body()).error, 'sheet_missing');
  env.sheet!.name = 'Rsvp';
  env.lockBusy = true;
  assert.equal(gs.post(body()).error, 'busy');
  env.lockBusy = false;
  assert.equal(env.sheet!.rows.length, 0);
  assert.ok(env.logs.every((l) => !l.includes('Divya')), 'guest names are never logged');
});

test('Code.gs: two submissions in a row get separate rows; existing data and headers kept', () => {
  const earlier = ['2026-10-20 10:00:00', 'Earlier Guest', 'Yes', 2, 'Vegetarian', 'earlier-submission-0001'];
  const { env, gs } = setup([HEADERS, earlier]);
  env.sheet!.name = 'Rsvp';
  const one = gs.post({ fullName: 'Guest One', attendance: 'Yes', numberOfGuests: 2, foodPreference: 'Vegetarian', submissionId: randomUUID() });
  const two = gs.post({ fullName: 'Guest Two', attendance: 'No', numberOfGuests: 0, foodPreference: 'Not Coming', submissionId: randomUUID() });
  assert.ok(one.ok && two.ok);
  assert.deepEqual(dataRows(env).map((r) => r[1]), ['Earlier Guest', 'Guest One', 'Guest Two']);
  assert.equal(env.lockHeld, false);
});

test('Code.gs: headers inserted above existing data, never over it', () => {
  const existing = ['2026-10-19 09:00:00', 'Old Response', 'Yes', 1, 'Vegetarian', 'old-submission-00001'];
  const { env, gs } = setup([existing]);
  gs.setupSheet();
  gs.setupSheet();
  assert.deepEqual(env.sheet!.rows[0], HEADERS);
  assert.deepEqual(env.sheet!.rows[1], existing);
  assert.equal(env.sheet!.rows.length, 2);
});

test('Code.gs: formula injection neutralised; Tamil names kept; IST timestamps', () => {
  const { env, gs } = setup();
  gs.post({ fullName: '=HYPERLINK("http://evil","x")', attendance: 'No', numberOfGuests: 0, foodPreference: 'Not Coming', submissionId: randomUUID() });
  gs.post({ fullName: 'ச. பிரவீன்', attendance: 'No', numberOfGuests: 0, foodPreference: 'Not Coming', submissionId: randomUUID() });
  assert.equal(dataRows(env)[0][1], `'=HYPERLINK("http://evil","x")`);
  assert.equal(dataRows(env)[1][1], 'ச. பிரவீன்');
  assert.equal(gs.formatTimestamp(new Date('2026-11-28T23:15:00Z')), '2026-11-29 04:45:00');
  assert.equal(gs.doGet().ok, true);
});

test('browser and Code.gs validators agree on every case', () => {
  const { gs } = setup();
  const cases: RsvpFormValues[] = [
    attending(),
    attending({ guests: 8, food: 'non-vegetarian' }),
    declining(),
    declining({ guests: null, food: null }),
    attending({ name: '' }),
    attending({ attendance: null }),
    attending({ guests: 0 }),
    attending({ food: 'not-coming' }),
    declining({ guests: 2 }),
    attending({ name: '!!!' }),
    attending({ name: 'x'.repeat(81) }),
    declining({ name: 'கவியா' }),
  ];
  for (const c of cases) {
    const withKey = { ...c, requestKey: randomUUID() };
    assert.equal(gs.validate(withKey).ok, validateRsvp(withKey).ok, JSON.stringify(c));
  }
});
