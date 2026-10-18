# RSVP → Google Sheets (Google Apps Script)

```
RSVP form ──POST text/plain JSON──▶ Apps Script web app (runs as the sheet owner) ──▶ "Rsvp" tab
          ◀── { ok / success: true, submissionId } ── only then does the form say "Thank you…"
```

| Setting | Value |
| --- | --- |
| Web-app URL (configured once) | `src/config/wedding.ts` → `RSVP_APPS_SCRIPT_URL` |
| Current deployment | `https://script.google.com/macros/s/AKfycby4pCKK4i6AHyGIgQPHz2asoKQyiXTi7i2fjvALjM-ldnU7ih2Cqu5DUTVJ9_qDAz9e/exec` |
| Spreadsheet | `1dHH5mCgLY8gza08SJGcMIYtGQ7snv5yL_VFCCC9VTEY`, tab **Rsvp** |
| Columns | Timestamp · Full Name · Attendance · Number of Guests · Food Preference · Submission ID |

## Status (checked 18 Oct 2026, Version 2 deployment)

- An anonymous GET of the URL above returns `{"success":true,"message":"Praveen & Kaviya RSVP service is running."}`.
- A POST from the website's origin (`http://localhost:5173`) is readable cross-origin, so CORS is not an
  issue with this deployment.
- A labelled test POST replied `{"success":true,"message":"Your RSVP has been saved successfully.","reference":"…"}`.
  Resending the same `submissionId` replied `"Your RSVP has already been received."`, so duplicates are
  prevented.
- The earlier deployment (`AKfycbxmkUT…`) still redirects guests to Google sign-in. Don't use it.

**If you deploy again:** use **Deploy → Manage deployments → ✏️ Edit → Version: New version**. That
keeps the same URL. **Deploy → New deployment** creates a *new* URL, which must then be pasted into
`RSVP_APPS_SCRIPT_URL` in `src/config/wedding.ts`. A new URL that wasn't pasted in is exactly what
caused the failure on 18 Oct. Keep **Execute as: Me** and **Who has access: Anyone**.

---

## Request the website sends

```json
{
  "fullName": "Guest Name",
  "attendance": "Yes",
  "numberOfGuests": 2,
  "foodPreference": "Vegetarian",
  "submissionId": "3f1c9e2a-6b1d-4c55-9a7e-0d6b8f2e41aa"
}
```

- `attendance` is `Yes` or `No`. When it's `No`, the site always sends `numberOfGuests: 0` and
  `foodPreference: "Not Coming"`.
- `numberOfGuests` is 1–8 when attending. `foodPreference` is `Vegetarian` or `Non-Vegetarian` when
  attending.
- `submissionId` is a random ID created once per RSVP. It's reused for every retry of that RSVP, even
  after a page refresh, so your backend's de-duplication prevents duplicate rows. A new ID is only
  created after a confirmed save, when someone chooses "Respond for another guest".

### Cross-origin strategy (why `text/plain`)

Apps Script can't answer CORS pre-flight (`OPTIONS`) requests, so the site sends a "simple" request:
`POST` with `Content-Type: text/plain;charset=utf-8` and the JSON as the body (read it in Apps Script
with `JSON.parse(e.postData.contents)`). Google answers with a redirect to
`script.googleusercontent.com`, which allows any origin to read the reply. The site then checks that
reply. **`no-cors` is never used**, because its opaque response couldn't prove anything was saved.

### Replies the website accepts as "saved"

The website treats the RSVP as saved only if the reply is JSON containing one of `"ok": true`,
`"success": true`, `"status": "success"` or `"result": "success"`, and no error. If the reply echoes an
ID (`reference`, `submissionId` or `id`), it must match the `submissionId` that was sent. Anything else counts as not confirmed: an HTML page, a
sign-in page, an empty reply, `"ok": false`, `"status": "error"`, or a timeout after 25 seconds. The
guest then sees *"We couldn't save your response right now. Your details have not been confirmed.
Please try again."* with a **Try again** button, and their answers stay filled in.

If your deployed script replies in a different format, either make it return
`{ "ok": true, "submissionId": "<the id it received>" }` on success, or tell us its exact reply.

---

## Reference backend in this project (optional)

`apps-script/Code.gs` is a complete backend that implements this contract. It validates, locks the sheet
while writing, de-duplicates by `submissionId`, neutralises formulas, and reads each row back before
replying `{ ok: true, success: true, submissionId }`. It's the code `npm test` runs against.
**You don't need it if your deployed script already works.** Use it only if you decide to replace your
script: paste it over your script, run `setupSheet` once, then **Manage deployments → edit → New
version** so the URL stays the same.

## How it stays correct and safe

The website side applies to any backend. The "script" rows describe the reference `Code.gs`.

| Concern | What happens |
| --- | --- |
| Validation (website + script) | Name is required (trimmed, up to 80 characters). Attendance must be Yes or No. Yes requires 1–8 guests and Vegetarian or Non-Vegetarian. No is always stored as 0 guests and "Not Coming". Anything else is rejected and no row is written. The website applies the same rules, and a test checks that both decide identically. |
| Concurrent guests | A script lock (`LockService`) is held while the row is appended, so two guests can't write to the same row. |
| Duplicates | The website ignores extra clicks while saving and reuses one `submissionId` for every retry of an RSVP, including after a refresh. The backend uses that ID to skip duplicates. After a confirmed save, the site remembers it on that device, so refreshing shows the thank-you instead of an empty form. |
| False success | The site shows success only on an explicit confirmation (see above). Network errors, sign-in pages, HTML pages and timeouts count as failures, and the guest's answers stay on screen with a **Try again** button. The reference script also reads the row back before confirming. |
| Formula injection | Cells are formatted as text, and names starting with `=`, `+`, `-` or `@` are stored with a leading apostrophe, so they always stay plain text. |
| Abuse | Requests over 2,000 characters are rejected, a hidden honeypot field catches simple bots, and there's a site-wide limit of 30 submissions per minute. |
| Privacy | Only name, attendance, guest count and food preference are stored. Logs never contain guest names. The sheet stays private. |
| Timestamps | India Standard Time, as `2026-11-02 09:15:30`, so they're readable and sort correctly. |

### Apps Script limitations

- Apps Script can't see visitors' IP addresses, so the rate limit is site-wide, not per visitor. A
  determined spammer could still submit fake names. You can delete such rows, or redeploy with a new URL.
- Each request takes about 1–3 seconds. The free quota (about 20,000 calls per day) is far beyond what a
  wedding needs.
- The first request after a quiet period can take a few extra seconds while Google starts the script.

---

## Useful formulas (add a "Summary" tab)

| What | Formula |
| --- | --- |
| Replies received | `=COUNTA(Rsvp!F2:F)` |
| Attending replies | `=COUNTIF(Rsvp!C2:C,"Yes")` |
| Declined replies | `=COUNTIF(Rsvp!C2:C,"No")` |
| **Expected guests (people)** | `=SUMIF(Rsvp!C2:C,"Yes",Rsvp!D2:D)` |
| Vegetarian guests | `=SUMIFS(Rsvp!D2:D,Rsvp!E2:E,"Vegetarian")` |
| Non-vegetarian guests | `=SUMIFS(Rsvp!D2:D,Rsvp!E2:E,"Non-Vegetarian")` |

(If you rename the tab to `RSVP`, change `Rsvp!` to `RSVP!` in these formulas.)

---

## Production checklist

- [ ] Row 1 of the **Rsvp** tab shows the six headers
- [ ] Deployment set to **Execute as: Me** and **Who has access: Anyone** (redeployed as a new version)
- [ ] The `/exec` URL opened in an incognito window shows the script's reply, not a sign-in page
- [x] URL set in `RSVP_APPS_SCRIPT_URL` in `src/config/wedding.ts` (already done)
- [ ] A real "Yes" submission from the site appears as one row
- [ ] A real "No" submission appears as `No | 0 | Not Coming`
- [ ] Clicking submit several times quickly still creates only one row
- [ ] Tested on a phone (mobile data, not Wi-Fi)
- [ ] Test rows deleted from the sheet
- [ ] `npm run build` succeeds, and the built site is deployed

## Troubleshooting

Open the Apps Script project → **Executions** to see each request.

| What you see | Cause and fix |
| --- | --- |
| Form says it couldn't save, console shows `[rsvp] The request was blocked` | **Who has access** isn't **Anyone**, so Google sends guests to a sign-in page. See the Required section at the top. |
| Console shows `Save not confirmed: unconfirmed` | The script replied, but not with a recognised success reply. Make it return `{ "ok": true, "submissionId": … }`. |
| Console shows `not_configured` | `RSVP_APPS_SCRIPT_URL` (or `VITE_RSVP_ENDPOINT` in `.env.local`) isn't a valid `https://script.google.com/macros/s/…/exec` URL. Restart `npm run dev` after changing it. |
| `sheet_unavailable` | The deployment isn't "Execute as: Me", or the deploying account has no edit access to the sheet. |
| `sheet_missing` | The tab was renamed to something other than RSVP or Rsvp. |
| Browser shows a Google sign-in page or CORS error | **Who has access** isn't set to **Anyone**. Edit the deployment and choose Anyone. |
| Changes to `Code.gs` don't take effect | Deploy a **new version** of the existing deployment (see above). |
