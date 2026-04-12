/**
 * Client-side JWT payload inspection for session gating only.
 * Authorization decisions are always enforced by the API.
 */

function decodeJwtPayloadSegment(segment: string): Record<string, unknown> | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function coerceExp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * `true` when the access token is a well-formed JWT whose `exp` is in the future
 * (with clock skew). Tokens without `exp` are rejected so they cannot bypass refresh.
 */
export function isAccessJwtValid(accessToken: string, clockSkewSec = 60): boolean {
  const parts = accessToken.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return false;
  }
  const payload = decodeJwtPayloadSegment(parts[1]);
  if (!payload) {
    return false;
  }
  const exp = coerceExp(payload['exp']);
  if (exp == null) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return exp > now + clockSkewSec;
}

/** Minimal structural check after a successful refresh when `exp` is absent or odd. */
export function looksLikeJwt(accessToken: string): boolean {
  const parts = accessToken.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}
