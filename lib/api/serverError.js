import { captureException } from '../logger.js';

/**
 * Message for an unexpected (500) error. The full error always goes to the structured
 * log (and Sentry when configured); the client gets the real text only outside
 * production. Raw messages leak internals — database errors, field and collection
 * names, provider responses.
 */
export const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';

export function serverErrorMessage(err, context = {}) {
  captureException(err instanceof Error ? err : new Error(String(err)), context);
  if (process.env.NODE_ENV !== 'production') return err?.message || GENERIC_SERVER_ERROR;
  return GENERIC_SERVER_ERROR;
}
