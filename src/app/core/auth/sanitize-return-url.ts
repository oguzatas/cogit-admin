/**
 * Prevents open redirects: only same-origin relative paths are allowed.
 * Returns `undefined` when the value should be ignored (fall back to `/`).
 */
export function sanitizeReturnUrl(raw: string | null | undefined): string | undefined {
  if (raw == null) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '/') {
    return undefined;
  }
  if (trimmed.startsWith('//') || trimmed.includes('://') || trimmed.includes('\\')) {
    return undefined;
  }
  if (!trimmed.startsWith('/')) {
    return undefined;
  }
  if (trimmed.startsWith('/login')) {
    return undefined;
  }
  return trimmed;
}
