#!/usr/bin/env node
/**
 * RSVP backend health check — run on your own computer:
 *
 *   npm run check:rsvp            # read-only: is the web app reachable by guests?
 *   npm run check:rsvp -- --post  # also submits ONE clearly-labelled test RSVP
 *                                 # ("TEST — please delete") and shows the reply
 *
 * It reads the URL from src/config/wedding.ts (or VITE_RSVP_ENDPOINT).
 */
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../src/config/wedding.ts', import.meta.url), 'utf8');
const url = (process.env.VITE_RSVP_ENDPOINT || (config.match(/RSVP_APPS_SCRIPT_URL\s*=\s*'([^']*)'/) || [])[1] || '').trim();

const say = (icon, msg) => console.log(`${icon} ${msg}`);

if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  say('✖', `No valid Apps Script URL found (got "${url}"). Set RSVP_APPS_SCRIPT_URL in src/config/wedding.ts.`);
  process.exit(1);
}
say('•', `Web app: ${url}`);

// 1. What does an anonymous guest get? (no cookies, don't follow redirects)
const first = await fetch(url, { redirect: 'manual' });
const location = first.headers.get('location') || '';
if (first.status >= 300 && first.status < 400 && /accounts\.google\.com/.test(location)) {
  say('✖', 'Guests are sent to the Google SIGN-IN page. The deployment is not open to "Anyone".');
  say(' ', 'Fix: Apps Script → Deploy → Manage deployments → ✏️ Edit →');
  say(' ', '     Execute as: Me   |   Who has access: Anyone   → Version: New version → Deploy');
  process.exit(2);
}
if (first.status >= 300 && first.status < 400 && /googleusercontent\.com/.test(location)) {
  const echo = await fetch(location);
  say('✔', `Reachable by guests. GET reply (${echo.status}): ${(await echo.text()).slice(0, 200)}`);
} else {
  say('?', `Unexpected first reply: HTTP ${first.status} ${location ? `→ ${location}` : ''}`);
}

// 2. Optional: one labelled test submission, exactly like the website sends.
if (process.argv.includes('--post')) {
  const body = {
    fullName: 'TEST — please delete',
    attendance: 'No',
    numberOfGuests: 0,
    foodPreference: 'Not Coming',
    submissionId: `check-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  const text = await res.text();
  say('•', `POST reply (HTTP ${res.status}): ${text.slice(0, 300)}`);
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  const ok = json && (json.ok === true || json.success === true || json.status === 'success' || json.result === 'success');
  if (ok) say('✔', `The script reports the test row was saved (submissionId ${body.submissionId}). Check the Rsvp tab, then delete that row.`);
  else say('✖', 'The script did not confirm the save. The reply above shows why; the website will treat this as a failure.');
  process.exit(ok ? 0 : 3);
}
