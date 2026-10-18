/**
 * Minimal Google Sheets client for Cloudflare Workers / Pages Functions.
 * Authenticates as a service account by signing a JWT with WebCrypto, so no
 * Node-only SDK is needed and the private key never leaves the server.
 */

export interface SheetsConfig {
  clientEmail: string;
  privateKeyPem: string;
  spreadsheetId: string;
  tab: string;
}

export type SheetsErrorKind = 'auth' | 'rate_limited' | 'api' | 'network';

export class SheetsError extends Error {
  readonly status: number;
  readonly kind: SheetsErrorKind;
  constructor(message: string, status: number, kind: SheetsErrorKind) {
    super(message);
    this.name = 'SheetsError';
    this.status = status;
    this.kind = kind;
  }
}

type Fetch = typeof fetch;

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedToken: { token: string; expiresAt: number; email: string } | null = null;

/** For tests. */
export function resetTokenCache() {
  cachedToken = null;
}

function base64url(input: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  if (!body) throw new SheetsError('Private key is empty', 500, 'auth');
  const binary = atob(body);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

async function signJwt(cfg: SheetsConfig, nowSeconds: number): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({ iss: cfg.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey('pkcs8', pemToDer(cfg.privateKeyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  } catch {
    throw new SheetsError('Private key could not be read (expecting a PKCS#8 PEM)', 500, 'auth');
  }
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  return `${header}.${claims}.${base64url(signature)}`;
}

async function accessToken(cfg: SheetsConfig, fetchImpl: Fetch, now: number): Promise<string> {
  if (cachedToken && cachedToken.email === cfg.clientEmail && cachedToken.expiresAt - 60_000 > now) return cachedToken.token;
  const assertion = await signJwt(cfg, Math.floor(now / 1000));
  let res: Response;
  try {
    res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
    });
  } catch {
    throw new SheetsError('Could not reach Google', 502, 'network');
  }
  if (!res.ok) throw new SheetsError(`Google token request failed (${res.status})`, res.status, 'auth');
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new SheetsError('Google returned no access token', 502, 'auth');
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000, email: cfg.clientEmail };
  return data.access_token;
}

function rangeUrl(cfg: SheetsConfig, range: string, suffix = '') {
  const a1 = `'${cfg.tab.replace(/'/g, "''")}'!${range}`;
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.spreadsheetId)}/values/${encodeURIComponent(a1)}${suffix}`;
}

async function sheetsFetch(url: string, init: RequestInit, token: string, fetchImpl: Fetch): Promise<Response> {
  let res: Response;
  try {
    res = await fetchImpl(url, { ...init, headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` } });
  } catch {
    throw new SheetsError('Could not reach Google Sheets', 502, 'network');
  }
  if (res.status === 429) throw new SheetsError('Google Sheets rate limit', 429, 'rate_limited');
  if (!res.ok) throw new SheetsError(`Google Sheets request failed (${res.status})`, res.status, 'api');
  return res;
}

/** True when a row with this Submission ID already exists (column A). */
export async function submissionExists(cfg: SheetsConfig, submissionId: string, fetchImpl: Fetch, now: number): Promise<boolean> {
  const token = await accessToken(cfg, fetchImpl, now);
  const res = await sheetsFetch(rangeUrl(cfg, 'A:A', '?majorDimension=COLUMNS'), { method: 'GET' }, token, fetchImpl);
  const data = (await res.json()) as { values?: string[][] };
  return (data.values?.[0] ?? []).includes(submissionId);
}

/** Append exactly one row; resolves only when Google confirms the write. */
export async function appendRow(cfg: SheetsConfig, row: (string | number)[], fetchImpl: Fetch, now: number): Promise<void> {
  const token = await accessToken(cfg, fetchImpl, now);
  const res = await sheetsFetch(
    rangeUrl(cfg, 'A:I', ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=false'),
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ values: [row] }) },
    token,
    fetchImpl,
  );
  const data = (await res.json()) as { updates?: { updatedRows?: number } };
  if (data.updates?.updatedRows !== 1) throw new SheetsError('Google Sheets did not confirm the new row', 502, 'api');
}
