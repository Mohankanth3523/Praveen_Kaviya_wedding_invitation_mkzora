/**
 * Loads apps-script/Code.gs into a sandbox with in-memory stand-ins for the
 * Apps Script services it uses (SpreadsheetApp, LockService, CacheService,
 * ContentService, Utilities). Lets the real backend code run under `npm test`.
 */
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export type Cell = string | number;

export interface FakeSheet {
  name: string;
  rows: Cell[][];
  formats: string[][];
  frozen: number;
}

export interface FakeEnv {
  sheet: FakeSheet | null;
  /** Simulate "Execute as" / sharing problems. */
  openFails: boolean;
  lockBusy: boolean;
  lockHeld: boolean;
  lockReleases: number;
  /** Make the read-back after writing return something else. */
  corruptWrite: boolean;
  logs: string[];
  cache: Map<string, string>;
}

function displayOf(v: Cell | undefined): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return s.startsWith("'") ? s.slice(1) : s;
}

function makeRange(env: FakeEnv, sheet: FakeSheet, row: number, col: number, numRows = 1, numCols = 1) {
  const range = {
    setValues(values: Cell[][]) {
      values.forEach((r, i) =>
        r.forEach((v, j) => {
          const rr = row - 1 + i;
          while (sheet.rows.length <= rr) sheet.rows.push([]);
          if (typeof v === 'string' && v.startsWith('=')) throw new Error('Test guard: a formula would have been written');
          sheet.rows[rr][col - 1 + j] = env.corruptWrite && col - 1 + j === 5 ? 'WRONG' : v;
        }),
      );
      return range;
    },
    setNumberFormats(formats: string[][]) {
      formats.forEach((r, i) => {
        sheet.formats[row - 1 + i] = r;
      });
      return range;
    },
    setFontWeight() {
      return range;
    },
    getDisplayValues(): string[][] {
      return Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => displayOf(sheet.rows[row - 1 + i]?.[col - 1 + j])));
    },
    getDisplayValue(): string {
      return displayOf(sheet.rows[row - 1]?.[col - 1]);
    },
    createTextFinder(text: string) {
      let whole = false;
      const finder = {
        matchEntireCell(v: boolean) {
          whole = v;
          return finder;
        },
        findNext() {
          for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
              const v = displayOf(sheet.rows[row - 1 + i]?.[col - 1 + j]);
              if (whole ? v === text : v.includes(text)) return { row: row + i };
            }
          }
          return null;
        },
      };
      return finder;
    },
  };
  return range;
}

export function loadAppsScript(env: FakeEnv) {
  const sheetApi = () => {
    const sheet = env.sheet!;
    return {
      getLastRow: () => {
        for (let i = sheet.rows.length - 1; i >= 0; i--) if ((sheet.rows[i] ?? []).some((v) => v !== undefined && v !== '')) return i + 1;
        return 0;
      },
      getRange: (r: number, c: number, nr?: number, nc?: number) => makeRange(env, sheet, r, c, nr, nc),
      insertRowBefore: (r: number) => {
        sheet.rows.splice(r - 1, 0, []);
        sheet.formats.splice(r - 1, 0, []);
      },
      setFrozenRows: (n: number) => {
        sheet.frozen = n;
      },
    };
  };

  const sandbox: Record<string, unknown> = {
    console: { log: (m: string) => env.logs.push(String(m)), error: (m: string) => env.logs.push(String(m)) },
    SpreadsheetApp: {
      openById: (id: string) => {
        if (env.openFails) throw new Error('You do not have permission to access the requested document.');
        if (id !== '1dHH5mCgLY8gza08SJGcMIYtGQ7snv5yL_VFCCC9VTEY') throw new Error('Wrong spreadsheet');
        return {
          // Like Apps Script, exact-name lookup; the script falls back to getSheets().
          getSheetByName: (name: string) => (env.sheet && env.sheet.name === name ? sheetApi() : null),
          getSheets: () => (env.sheet ? [{ ...sheetApi(), getName: () => env.sheet!.name }] : []),
        };
      },
      flush: () => undefined,
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (env.lockBusy || env.lockHeld) return false;
          env.lockHeld = true;
          return true;
        },
        waitLock: () => {
          if (env.lockBusy) throw new Error('Lock timeout');
          env.lockHeld = true;
        },
        releaseLock: () => {
          env.lockHeld = false;
          env.lockReleases++;
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => env.cache.get(k) ?? null,
        put: (k: string, v: string) => void env.cache.set(k, v),
      }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text: string) => ({ setMimeType: () => ({ text }) }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_alg: string, value: string) => Array.from(createHash('sha256').update(value, 'utf8').digest()).map((b) => (b > 127 ? b - 256 : b)),
      formatDate: (date: Date, tz: string, _fmt: string) => {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(date);
        const g = (t: string) => parts.find((p) => p.type === t)?.value;
        return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
      },
      getUuid: () => randomUUID(),
    },
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    isNaN,
  };
  vm.createContext(sandbox);
  const file = fileURLToPath(new URL('../apps-script/Code.gs', import.meta.url));
  vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: 'Code.gs' });

  const post = (body: unknown) => {
    const out = (sandbox.doPost as (e: unknown) => { text: string })({
      postData: { contents: typeof body === 'string' ? body : JSON.stringify(body), type: 'text/plain' },
    });
    return JSON.parse(out.text) as Record<string, unknown> & { ok: boolean };
  };
  return {
    post,
    validate: sandbox.validateRsvp_ as (v: unknown) => { ok: boolean; errors?: Record<string, string>; value?: unknown },
    setupSheet: sandbox.setupSheet as () => void,
    formatTimestamp: sandbox.formatTimestamp_ as (d: Date) => string,
    doGet: () => JSON.parse((sandbox.doGet as () => { text: string })().text),
  };
}

export function freshEnv(rows: Cell[][] = []): FakeEnv {
  return {
    sheet: { name: 'RSVP', rows: rows.map((r) => [...r]), formats: [], frozen: 0 },
    openFails: false,
    lockBusy: false,
    lockHeld: false,
    lockReleases: 0,
    corruptWrite: false,
    logs: [],
    cache: new Map(),
  };
}
