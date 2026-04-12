import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthHttpRefreshService } from '@/app/core/api/services/auth-http-refresh.service';
import { TokenStorageService } from '@/app/core/api/services/token-storage.service';
import { isAccessJwtValid, looksLikeJwt } from './access-token';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokens = inject(TokenStorageService);
  private readonly refreshHttp = inject(AuthHttpRefreshService);

  /** Synchronous: valid JWT access not past `exp` (with skew). */
  hasValidAccessToken(): boolean {
    const access = this.tokens.getAccessToken();
    return access != null && isAccessJwtValid(access);
  }

  /**
   * Whether the user may enter the app: valid access, or refresh can establish one.
   */
  ensureSession(): Observable<boolean> {
    if (this.hasValidAccessToken()) {
      return of(true);
    }
    const refresh = this.tokens.getRefreshToken();
    if (!refresh) {
      return of(false);
    }
    return this.refreshHttp.refreshTokens().pipe(
      map(() => {
        const access = this.tokens.getAccessToken();
        if (!access) {
          return false;
        }
        if (isAccessJwtValid(access)) {
          return true;
        }
        return looksLikeJwt(access);
      }),
      catchError(() => of(false)),
    );
  }
}
