import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthHttpRefreshService } from '@/app/core/api/services/auth-http-refresh.service';
import { TokenStorageService } from '@/app/core/api/services/token-storage.service';
import { isAccessTokenValidForShell } from './access-token';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokens = inject(TokenStorageService);
  private readonly refreshHttp = inject(AuthHttpRefreshService);

  /** Synchronous: JWT `exp` valid, or opaque token inside `expiresIn` window. */
  hasValidAccessToken(): boolean {
    return isAccessTokenValidForShell(
      this.tokens.getAccessToken(),
      this.tokens.getAccessExpiresAtMs(),
    );
  }

  /**
   * Whether the user may enter the app: valid access JWT, or refresh cookie
   * yields a new access token.
   */
  ensureSession(): Observable<boolean> {
    if (this.hasValidAccessToken()) {
      return of(true);
    }
    return this.refreshHttp.refreshTokens().pipe(
      map(() =>
        isAccessTokenValidForShell(
          this.tokens.getAccessToken(),
          this.tokens.getAccessExpiresAtMs(),
        ),
      ),
      catchError(() => of(false)),
    );
  }
}
