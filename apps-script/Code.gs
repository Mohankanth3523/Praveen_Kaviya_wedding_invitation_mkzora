/**
 * Praveen & Kaviya — Wedding RSVP backend (Google Apps Script web app).
 *
 * Receives RSVP submissions from the invitation website, validates them,
 * and appends exactly one row per submission to the "RSVP" worksheet of the
 * family's spreadsheet. Runs as the spreadsheet owner; visitors never see the
 * sheet or any credentials.
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me (the spreadsheet owner)
 *   Who has access: Anyone
 * See RSVP_SETUP.md in the website project for the full steps.
 */

var CONFIG = {
  SPREADSHEET_ID: '1dHH5mCgLY8gza08SJGcMIYtGQ7snv5yL_VFCCC9VTEY',
  SHEET_NAME: 'RSVP',
  HEADERS: ['Timestamp', 'Full Name', 'Attendance', 'Number of Guests', 'Food Preference', 'Submission ID'],
  TIME_ZONE: 'Asia/Kolkata',
  NAME_MAX: 80,
  MAX_BODY_CHARS: 2000,
  // Whole-site throttle (Apps Script cannot see visitor IP addresses).
  MAX_SUBMISSIONS_PER_MINUTE: 30,
  LOCK_WAIT_MS: 20000,
};

var ATTENDANCE_LABELS = { yes: 'Yes', no: 'No' };
var FOOD_LABELS = { vegetarian: 'Vegetarian', 'non-vegetarian': 'Non-Vegetarian', 'not-coming': 'Not Coming' };

/* -------------------------------------------------------------------------- */
/* HTTP entry points                                                          */
/* -------------------------------------------------------------------------- */

function doPost(e) {
  try {
    return respond_(handleSubmission_(e));
  } catch (err) {
    // Never reveal internals or guest data in logs or responses.
    console.error('RSVP unexpected error: ' + (err && err.name ? err.name : 'Error'));
    return respond_({ ok: false, error: 'server_error' });
  }
}

/** A friendly GET so the owner can open the URL and confirm the deployment is live. */
function doGet() {
  return respond_({ ok: true, service: 'Praveen & Kaviya RSVP', accepts: 'POST' });
}

function respond_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

/* -------------------------------------------------------------------------- */
/* Core logic (pure functions are unit-tested in the website project)         */
/* -------------------------------------------------------------------------- */

function handleSubmission_(e) {
  var raw = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';
  if (!raw) return { ok: false, error: 'bad_request' };
  if (raw.length > CONFIG.MAX_BODY_CHARS) return { ok: false, error: 'too_large' };

  var payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: 'bad_request' };
  }

  var result = validateRsvp_(normaliseInput_(payload));
  if (!result.ok) return { ok: false, error: 'validation', fields: result.errors };

  if (!withinRateLimit_()) return { ok: false, error: 'rate_limited' };

  var rsvp = result.value;
  // The client-generated ID is stored as the Submission ID; retries reuse it.
  var submissionId = rsvp.requestKey;

  var sheet;
  try {
    sheet = findSheet_(SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID));
  } catch (err) {
    console.error('RSVP cannot open spreadsheet (check deployment "Execute as: Me" and access to the sheet).');
    return { ok: false, error: 'sheet_unavailable' };
  }
  if (!sheet) {
    console.error('RSVP worksheet "' + CONFIG.SHEET_NAME + '" not found.');
    return { ok: false, error: 'sheet_missing' };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) return { ok: false, error: 'busy' };
  try {
    ensureHeaders_(sheet);
    // Retries and double-clicks carry the same request key → same ID → one row.
    var existing = sheet
      .getRange(1, 6, Math.max(sheet.getLastRow(), 1), 1)
      .createTextFinder(submissionId)
      .matchEntireCell(true)
      .findNext();
    if (existing) return success_(submissionId, rsvp, true);

    var row = buildRow_(rsvp, submissionId, new Date());
    var target = sheet.getLastRow() + 1;
    var range = sheet.getRange(target, 1, 1, row.length);
    // Text columns stay text (no date/number/formula interpretation); guests stay numeric.
    range.setNumberFormats([['@', '@', '@', '0', '@', '@']]);
    range.setValues([row]);
    SpreadsheetApp.flush();

    // Read back to confirm the write before reporting success.
    var saved = sheet.getRange(target, 6).getDisplayValue();
    if (saved !== submissionId) return { ok: false, error: 'write_unconfirmed' };
    return success_(submissionId, rsvp, false);
  } finally {
    lock.releaseLock();
  }
}

function success_(submissionId, rsvp, duplicate) {
  return {
    ok: true,
    success: true,
    status: duplicate ? 'duplicate' : 'success',
    duplicate: duplicate,
    submissionId: submissionId,
    attendance: ATTENDANCE_LABELS[rsvp.attendance],
  };
}

var FOOD_KEYS = { vegetarian: 'vegetarian', 'non-vegetarian': 'non-vegetarian', 'not coming': 'not-coming', 'not-coming': 'not-coming' };

/**
 * Accepts the canonical payload
 *   { fullName, attendance: "Yes"|"No", numberOfGuests, foodPreference: "Vegetarian"|"Non-Vegetarian"|"Not Coming", submissionId }
 * and the older aliases (name, guests, food, requestKey, lower-case values).
 */
function normaliseInput_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  var att = typeof input.attendance === 'string' ? input.attendance.trim().toLowerCase() : input.attendance;
  var guests = input.numberOfGuests !== undefined ? input.numberOfGuests : input.guests;
  if (guests === '') guests = null;
  var foodRaw = input.foodPreference !== undefined ? input.foodPreference : input.food;
  var food = typeof foodRaw === 'string' ? FOOD_KEYS[foodRaw.trim().toLowerCase()] || foodRaw : foodRaw;
  return {
    name: input.fullName !== undefined ? input.fullName : input.name,
    attendance: att,
    guests: guests,
    food: food,
    requestKey: input.submissionId !== undefined ? input.submissionId : input.requestKey,
    website: input.website,
  };
}

/** Finds the RSVP tab whether it is named "RSVP", "Rsvp" or "rsvp". */
function findSheet_(spreadsheet) {
  var exact = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (exact) return exact;
  var wanted = CONFIG.SHEET_NAME.toLowerCase();
  var sheets = spreadsheet.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getName()).trim().toLowerCase() === wanted) return sheets[i];
  }
  return null;
}

function validateRsvp_(input) {
  var errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { form: 'The form could not be read.' } };
  }
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { ok: false, errors: { form: 'Your response could not be accepted.' } };
  }

  var name = normaliseName_(input.name);
  if (!name) errors.name = 'Please enter your full name.';
  else if (name.length > CONFIG.NAME_MAX) errors.name = 'Please keep your name under ' + CONFIG.NAME_MAX + ' characters.';
  else if (!/[\p{L}\p{N}]/u.test(name)) errors.name = 'Please enter your name using letters.';

  var attendance = input.attendance;
  var guests = null;
  var food = null;
  if (attendance !== 'yes' && attendance !== 'no') {
    errors.attendance = 'Please let us know whether you will attend.';
  } else if (attendance === 'no') {
    if (input.guests !== 0 && input.guests !== null && input.guests !== undefined) errors.guests = 'A declined invitation has no guests.';
    if (input.food !== 'not-coming' && input.food !== null && input.food !== undefined) errors.food = 'A declined invitation is saved as “Not Coming”.';
    guests = 0;
    food = 'not-coming';
  } else {
    if (typeof input.guests !== 'number' || input.guests % 1 !== 0 || input.guests < 1 || input.guests > 8) {
      errors.guests = 'Please choose the number of guests (1 to 8).';
    } else guests = input.guests;
    if (input.food !== 'vegetarian' && input.food !== 'non-vegetarian') errors.food = 'Please choose Vegetarian or Non-Vegetarian.';
    else food = input.food;
  }

  var requestKey = typeof input.requestKey === 'string' ? input.requestKey : '';
  if (!/^[A-Za-z0-9-]{16,64}$/.test(requestKey)) errors.form = 'Please refresh the page and try again.';

  if (Object.keys(errors).length > 0) return { ok: false, errors: errors };
  return { ok: true, value: { name: name, attendance: attendance, guests: guests, food: food, requestKey: requestKey } };
}

function normaliseName_(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F​-‍⁠﻿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formula-injection guard. A leading apostrophe makes Sheets store the value
 * as plain text (the apostrophe itself is not shown). Ordinary names never
 * start with these characters, so they are untouched.
 */
function neutraliseCell_(value) {
  return /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
}

function buildRow_(rsvp, submissionId, now) {
  return [
    formatTimestamp_(now),
    neutraliseCell_(rsvp.name),
    ATTENDANCE_LABELS[rsvp.attendance],
    rsvp.guests,
    FOOD_LABELS[rsvp.food],
    submissionId,
  ];
}

/** e.g. "2026-11-02 09:15:30" in India Standard Time — readable and sorts correctly. */
function formatTimestamp_(date) {
  return Utilities.formatDate(date, CONFIG.TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

/** Ensures row 1 holds the expected headers without overwriting or deleting any existing row. */
function ensureHeaders_(sheet) {
  var width = CONFIG.HEADERS.length;
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, width).setValues([CONFIG.HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return;
  }
  var first = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  var matches = first.every(function (v, i) {
    return String(v).trim() === CONFIG.HEADERS[i];
  });
  if (matches) return;
  // Row 1 is something else (existing data or a different header). Never
  // overwrite it: insert a fresh header row above so every record is kept.
  sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, width).setValues([CONFIG.HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function withinRateLimit_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'rsvp-rate-' + Math.floor(Date.now() / 60000);
  var count = Number(cache.get(bucket) || '0');
  if (count >= CONFIG.MAX_SUBMISSIONS_PER_MINUTE) return false;
  cache.put(bucket, String(count + 1), 120);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Owner tools — run from the Apps Script editor                              */
/* -------------------------------------------------------------------------- */

/** Run once from the editor: authorises the script and prepares the header row. */
function setupSheet() {
  var sheet = findSheet_(SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID));
  if (!sheet) throw new Error('Worksheet "' + CONFIG.SHEET_NAME + '" was not found. Rename the tab to: ' + CONFIG.SHEET_NAME);
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_WAIT_MS);
  try {
    ensureHeaders_(sheet);
  } finally {
    lock.releaseLock();
  }
  console.log('RSVP sheet is ready. Headers: ' + CONFIG.HEADERS.join(', '));
}

/**
 * Optional end-to-end check from the editor: writes one clearly-marked test
 * row through the same code path as the website, then reports what happened.
 * Delete the "TEST — please delete" row afterwards.
 */
function testSubmission() {
  var key = Utilities.getUuid();
  var result = handleSubmission_({
    postData: {
      contents: JSON.stringify({ fullName: 'TEST — please delete', attendance: 'Yes', numberOfGuests: 1, foodPreference: 'Vegetarian', submissionId: key }),
    },
  });
  console.log(JSON.stringify(result));
  var again = handleSubmission_({
    postData: {
      contents: JSON.stringify({ fullName: 'TEST — please delete', attendance: 'Yes', numberOfGuests: 1, foodPreference: 'Vegetarian', submissionId: key }),
    },
  });
  console.log('Repeat with same key (should be duplicate:true, no new row): ' + JSON.stringify(again));
}
