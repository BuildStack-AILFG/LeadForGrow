import { NextResponse } from 'next/server';
import { ApiError } from './errors.js';
import { logger } from '../logger.js';
import { serverErrorMessage } from './serverError.js';

/**
 * Unified API response envelope.
 * { success, data?, error?, code?, meta?, requestId? }
 */
export function apiSuccess(data, meta = {}, status = 200, requestId = null) {
  const body = { success: true, data };
  if (Object.keys(meta).length) body.meta = meta;
  if (requestId) body.requestId = requestId;

  const res = NextResponse.json(body, { status });
  if (requestId) res.headers.set('x-request-id', requestId);
  return res;
}

export function apiError(error, requestId = null) {
  const status = error instanceof ApiError ? error.status : 500;
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  // Typed errors are written for the client; anything else is unexpected and stays in the log.
  const message = error instanceof ApiError
    ? error.message
    : serverErrorMessage(error, { code, requestId });

  if (error instanceof ApiError && status >= 500) {
    logger.error(message, { code, requestId, stack: error.stack });
  }

  const body = { success: false, error: message, code };
  if (error instanceof ApiError && error.details) body.details = error.details;
  if (requestId) body.requestId = requestId;

  const res = NextResponse.json(body, { status });
  if (requestId) res.headers.set('x-request-id', requestId);
  return res;
}

export function apiPaginated(items, pagination, requestId = null) {
  return apiSuccess(items, { pagination }, 200, requestId);
}
