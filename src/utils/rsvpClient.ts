import type { RsvpApiPayload, RsvpErrors } from '../../shared/rsvp.ts';

export type SubmitOutcome =
  | { kind: 'saved'; submissionId: string; duplicate: boolean }
  | { kind: 'invalid'; fields: RsvpErrors; message?: string }
  | {
      kind: 'failed';
      /**
       * not_configured – no valid Apps Script URL
       * offline        – the device reports no connection
       * blocked        – request failed while online (CORS / sign-in redirect / DNS)
       * unconfirmed    – a reply arrived but did not confirm the save
       * server         – the backend reported an error
       * busy           – backend locked or rate-limited
       */
      reason: 'not_configured' | 'offline' | 'blocked' | 'unconfirmed' | 'server' | 'busy';
      detail?: string;
    };

const APPS_SCRIPT_URL = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

export function isAppsScriptUrl(url: string): boolean {
  return APPS_SCRIPT_URL.test(url);
}

const truthyStatus = (v: unknown) => typeof v === 'string' && ['success', 'ok', 'saved', 'created', 'duplicate'].includes(v.toLowerCase());

/**
 * Interprets the Apps Script reply. A save counts as confirmed only when the
 * backend explicitly says so ({ ok: true } / { success: true } /
 * { status: "success" }) and does not contradict the submission ID we sent.
 * Anything else — HTML, empty body, unknown JSON — is "unconfirmed".
 */
export function interpretReply(body: unknown, sentId: string): SubmitOutcome {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'failed', reason: 'unconfirmed' };
  const b = body as Record<string, unknown>;
  const flagless = b.ok === undefined && b.success === undefined && b.error === undefined;
  const success = b.ok === true || b.success === true || (flagless && (truthyStatus(b.status) || truthyStatus(b.result)));
  const isErr = (v: unknown) => typeof v === 'string' && ['error', 'fail', 'failed', 'failure'].includes(v.toLowerCase());
  const failure = b.ok === false || b.success === false || isErr(b.status) || isErr(b.result) || typeof b.error === 'string';

  if (success && !failure) {
    // The deployed script echoes the ID as "reference"; older versions used submissionId / id.
    const echoedRaw = [b.submissionId, b.reference, b.id].find((v) => typeof v === 'string');
    const echoed = typeof echoedRaw === 'string' ? echoedRaw : null;
    if (echoed && echoed !== sentId && !/^RSVP-/.test(echoed)) {
      return { kind: 'failed', reason: 'unconfirmed', detail: 'submission ID mismatch' };
    }
    const duplicate =
      b.duplicate === true ||
      (typeof b.status === 'string' && b.status.toLowerCase() === 'duplicate') ||
      (typeof b.message === 'string' && /already been received/i.test(b.message));
    return { kind: 'saved', submissionId: echoed ?? sentId, duplicate };
  }
  if (failure) {
    const error = typeof b.error === 'string' ? b.error : typeof b.code === 'string' ? b.code : undefined;
    const fields = b.fields && typeof b.fields === 'object' ? (b.fields as RsvpErrors) : null;
    if (fields || error === 'validation' || error === 'invalid' || error === 'validation_error') {
      return { kind: 'invalid', fields: fields ?? {}, message: typeof b.message === 'string' ? b.message : undefined };
    }
    if (error && /busy|lock|rate/i.test(error)) return { kind: 'failed', reason: 'busy', detail: error };
    return { kind: 'failed', reason: 'server', detail: error ?? (typeof b.message === 'string' ? b.message : undefined) };
  }
  return { kind: 'failed', reason: 'unconfirmed' };
}

/**
 * Sends one RSVP to the Google Apps Script web app.
 *
 * Cross-origin strategy: a POST with Content-Type text/plain is a CORS "simple
 * request", so the browser sends no OPTIONS pre-flight (Apps Script cannot
 * answer one). Apps Script replies with a 302 to script.googleusercontent.com,
 * which serves the JSON with Access-Control-Allow-Origin: *, so the reply can be
 * read and checked. This only works when the deployment's "Who has access" is
 * "Anyone"; otherwise Google redirects to a sign-in page, the browser blocks
 * the response, and this returns { reason: 'blocked' }. Never uses no-cors,
 * because an opaque response could not prove the row was saved.
 */
export async function submitRsvp(
  endpoint: string,
  payload: RsvpApiPayload,
  fetchImpl: typeof fetch = fetch,
  options: { timeoutMs?: number; isOnline?: () => boolean } = {},
): Promise<SubmitOutcome> {
  if (!isAppsScriptUrl(endpoint)) return { kind: 'failed', reason: 'not_configured' };
  const isOnline = options.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), options.timeoutMs ?? 25000) : null;

  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller?.signal,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'Error';
    if (name === 'AbortError') return { kind: 'failed', reason: 'unconfirmed', detail: 'timeout' };
    return { kind: 'failed', reason: isOnline() ? 'blocked' : 'offline', detail: name };
  } finally {
    if (timer) clearTimeout(timer);
  }

  let text = '';
  try {
    text = await res.text();
  } catch {
    return { kind: 'failed', reason: 'unconfirmed', detail: `HTTP ${res.status}` };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    // e.g. a Google sign-in or error page: never treated as saved.
    return { kind: 'failed', reason: /accounts\.google\.com|ServiceLogin/i.test(text) ? 'blocked' : 'unconfirmed', detail: `HTTP ${res.status}` };
  }
  return interpretReply(body, payload.submissionId);
}
