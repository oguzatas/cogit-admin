import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { sanitizeReturnUrl } from '@/app/core/auth/sanitize-return-url';
import { isApiOriginRequest } from '../utils/api-request.util';
import { API_URL } from '../tokens/api-url.token';
import { AuthHttpRefreshService } from '../services/auth-http-refresh.service';
import { TokenStorageService } from '../services/token-storage.service';

const PUBLIC_PATHS = new Set([
  '/api/Users/register',
  '/api/Users/login',
  '/api/Users/refresh',
  '/api/InviteCodes/redeem',
]);

function normalizePath(url: string, apiBase: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new URL(url).pathname;
  }
  try {
    return new URL(url, `${apiBase}/`).pathname;
  } catch {
    const q = url.indexOf('?');
    return q === -1 ? url : url.slice(0, q);
  }
}

function isPublicApiUrl(url: string, apiBase: string): boolean {
  const path = normalizePath(url, apiBase).replace(/\/$/, '') || '/';
  return PUBLIC_PATHS.has(path);
}

const AUTH_RETRY_HEADER = 'X-Auth-Retry';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = inject(API_URL);
  const tokens = inject(TokenStorageService);
  const refresh = inject(AuthHttpRefreshService);
  const router = inject(Router);

  const navigateToLogin = (): void => {
    const path = router.url.split('?')[0] ?? '/';
    if (path === '/login' || path.startsWith('/login/')) {
      return;
    }
    const returnUrl = sanitizeReturnUrl(router.url);
    void router.navigate(['/login'], {
      queryParams: returnUrl ? { returnUrl } : {},
      replaceUrl: true,
    });
  };

  const useCreds = isApiOriginRequest(req.url, apiUrl);
  const prepared = useCreds ? req.clone({ withCredentials: true }) : req;

  const isPublic = isPublicApiUrl(req.url, apiUrl);
  const access = tokens.getAccessToken();
  // If the request already has Authorization (e.g. Guest JWT flow), do not overwrite it.
  const hasAuthHeader = prepared.headers.has('Authorization');
  const withAuth =
    !isPublic && access && !hasAuthHeader
      ? prepared.clone({
          setHeaders: { Authorization: `Bearer ${access}` },
        })
      : prepared;

  return next(withAuth).pipe(
    catchError((err: unknown) => {
      // Some backends use 403 for expired/invalid bearer; treat 401/403 the same
      // for refresh+retry so the UI doesn't degrade into "network error" states.
      const status =
        err instanceof HttpErrorResponse ? err.status : null;
      if (!(err instanceof HttpErrorResponse) || (status !== 401 && status !== 403)) {
        return throwError(() => err);
      }
      if (isPublic) {
        return throwError(() => err);
      }
      if (req.headers.get(AUTH_RETRY_HEADER) === '1') {
        tokens.clear();
        navigateToLogin();
        return throwError(() => err);
      }
      return refresh.refreshTokens().pipe(
        switchMap(() => {
          const nextAccess = tokens.getAccessToken();
          if (!nextAccess) {
            navigateToLogin();
            return throwError(() => err);
          }
          const retryReq = withAuth.clone({
            setHeaders: {
              Authorization: `Bearer ${nextAccess}`,
              [AUTH_RETRY_HEADER]: '1',
            },
          });
          return next(retryReq);
        }),
        catchError((e) => {
          navigateToLogin();
          return throwError(() => e);
        }),
      );
    }),
  );
};
