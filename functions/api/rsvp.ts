/**
 * Cloudflare Pages Function: POST /api/rsvp
 * Validates the RSVP on the server and appends it to the private Google Sheet.
 * Secrets come from the Pages project's environment variables, never the browser.
 */
import { handleRsvp, type RsvpEnv } from '../../server/rsvpHandler.ts';

interface PagesContext {
  request: Request;
  env: RsvpEnv;
}

export const onRequest = (context: PagesContext): Promise<Response> => handleRsvp(context.request, context.env);
