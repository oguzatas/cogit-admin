import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) {
      return String(body.message);
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

/**
 * Guest magic-link exchange (`POST /api/Assignments/access`) may return 400 when the assignment
 * was already submitted — detect by status and typical API message wording.
 */
/** ASP.NET validation: `{ "errors": { "AccessKey": ["msg"] } }` */
function collectErrorsDictionary(o: Record<string, unknown>): string[] {
  const dict = (o['errors'] ?? o['Errors']) as Record<string, unknown> | undefined;
  if (dict == null || typeof dict !== 'object' || Array.isArray(dict)) {
    return [];
  }
  const out: string[] = [];
  for (const v of Object.values(dict)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item != null && String(item).trim()) {
          out.push(String(item));
        }
      }
    } else if (v != null && String(v).trim()) {
      out.push(String(v));
    }
  }
  return out;
}

function httpErrorBodyText(err: HttpErrorResponse): string {
  const e = err.error;
  if (e == null) {
    return '';
  }
  if (typeof e === 'string') {
    return e;
  }
  if (typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parts = [
      o['message'],
      o['Message'],
      o['title'],
      o['Title'],
      o['detail'],
      o['Detail'],
      ...collectErrorsDictionary(o),
    ]
      .filter((x) => x != null && String(x).trim())
      .map((x) => String(x));
    return parts.join(' ');
  }
  return '';
}

export function isAssignmentAlreadySubmittedAccessError(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
    return false;
  }
  const raw = (httpErrorBodyText(err) || apiErrorMessage(err, ''))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) {
    return false;
  }
  if (raw.includes('already') && (raw.includes('submit') || raw.includes('completed'))) {
    return true;
  }
  if (raw.includes('previously submitted')) {
    return true;
  }
  if (raw.includes('no longer available') && raw.includes('completed')) {
    return true;
  }
  if (raw.includes('cannot be reopened')) {
    return true;
  }
  return false;
}

