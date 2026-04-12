import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { sanitizeReturnUrl } from '@/app/core/auth/sanitize-return-url';
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

  const isPublic = isPublicApiUrl(req.url, apiUrl);
  const access = tokens.getAccessToken();
  const withAuth =
    !isPublic && access
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${access}` },
        })
      : req;

  return next(withAuth).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
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
          const retryReq = req.clone({
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
