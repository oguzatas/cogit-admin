import { inject } from '@angular/core';
import {
  type CanActivateFn,
  type RouterStateSnapshot,
  Router,
} from '@angular/router';
import { map } from 'rxjs';
import { AuthSessionService } from './auth-session.service';
import { sanitizeReturnUrl } from './sanitize-return-url';

function loginUrlTree(router: Router, state: RouterStateSnapshot) {
  const returnUrl = sanitizeReturnUrl(state.url);
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl ? { returnUrl } : {},
  });
}

/** Blocks the shell and all child routes until a session exists or refresh succeeds. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  return session.ensureSession().pipe(
    map((ok) => (ok ? true : loginUrlTree(router, state))),
  );
};

/**
 * Sends authenticated users away from `/login`.
 * Uses the same refresh path as the app shell so a stale access token still recovers.
 */
export const guestGuard: CanActivateFn = (route) => {
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const returnUrl = sanitizeReturnUrl(route.queryParamMap.get('returnUrl'));

  if (session.hasValidAccessToken()) {
    return router.parseUrl(returnUrl ?? '/');
  }

  return session.ensureSession().pipe(
    map((ok) => (ok ? router.parseUrl(returnUrl ?? '/') : true)),
  );
};
