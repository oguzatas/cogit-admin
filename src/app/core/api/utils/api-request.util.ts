/** Whether the request targets our API origin (for `withCredentials` / cookies). */
export function isApiOriginRequest(requestUrl: string, apiBaseUrl: string): boolean {
  const base = apiBaseUrl.replace(/\/$/, '');
  if (!base) {
    return false;
  }
  if (requestUrl.startsWith(base)) {
    return true;
  }
  try {
    return new URL(requestUrl).origin === new URL(base).origin;
  } catch {
    return false;
  }
}
