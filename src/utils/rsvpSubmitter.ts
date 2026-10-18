import { toApiPayload, validateRsvp, type RsvpErrors } from '../../shared/rsvp.ts';
import { submitRsvp, type SubmitOutcome } from './rsvpClient.ts';

export interface RsvpFormValues {
  name: string;
  attendance: 'yes' | 'no' | null;
  guests: number | null;
  food: 'vegetarian' | 'non-vegetarian' | 'not-coming' | null;
  website?: string;
}

export type SubmitResult = SubmitOutcome | { kind: 'validation'; fields: RsvpErrors } | { kind: 'ignored' };

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Array.from({ length: 3 }, () => Math.random().toString(16).slice(2, 10)).join('-')}`;

/**
 * Owns the parts of the RSVP flow that must be exactly right:
 * - one request at a time (extra clicks while saving are ignored);
 * - one submission ID per RSVP, reused for every retry until a save is
 *   confirmed, so the backend can de-duplicate;
 * - frontend validation identical to the backend's rules.
 * The React component only renders what this reports.
 */
export function createRsvpSubmitter(opts: {
  endpoint: string;
  fetchImpl?: typeof fetch;
  newId?: () => string;
  initialId?: string | null;
  isOnline?: () => boolean;
}) {
  const newId = opts.newId ?? makeId;
  let submissionId = opts.initialId && /^[A-Za-z0-9-]{16,64}$/.test(opts.initialId) ? opts.initialId : newId();
  let inFlight: Promise<SubmitResult> | null = null;

  return {
    /** The ID the next (or current) attempt will use. */
    get submissionId() {
      return submissionId;
    },
    get busy() {
      return inFlight !== null;
    },
    async submit(values: RsvpFormValues): Promise<SubmitResult> {
      if (inFlight) return { kind: 'ignored' };
      const check = validateRsvp({ ...values, requestKey: submissionId });
      if (!check.ok) return { kind: 'validation', fields: check.errors };
      const payload = toApiPayload(check.value);
      inFlight = submitRsvp(opts.endpoint, payload, opts.fetchImpl ?? fetch, { isOnline: opts.isOnline });
      try {
        return await inFlight;
      } finally {
        inFlight = null;
      }
    },
    /** Start a brand-new RSVP (only after a confirmed save). */
    startNew() {
      submissionId = newId();
    },
  };
}
