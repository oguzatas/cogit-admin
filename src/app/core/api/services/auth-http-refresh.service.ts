import {
  HttpBackend,
  HttpEventType,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  catchError,
  filter,
  finalize,
  map,
  Observable,
  shareReplay,
  take,
  tap,
  throwError,
} from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type { UserRefreshResponseDto } from '../models/auth.dto';
import { TokenStorageService } from './token-storage.service';

/**
 * Calls `/api/Users/refresh` via `HttpBackend` (bypasses interceptors).
 * Refresh token is expected as an **HttpOnly cookie** on the API origin; sends
 * `withCredentials: true` and an empty JSON body.
 */
@Injectable({ providedIn: 'root' })
export class AuthHttpRefreshService {
  private readonly backend = inject(HttpBackend);
  private readonly apiUrl = inject(API_URL);
  private readonly tokens = inject(TokenStorageService);

  private inFlight: Observable<UserRefreshResponseDto> | null = null;

  refreshTokens(): Observable<UserRefreshResponseDto> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const url = `${this.apiUrl}/api/Users/refresh`;
    const req = new HttpRequest<Record<string, never>>(
      'POST',
      url,
      {},
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        withCredentials: true,
      },
    );
    this.inFlight = this.backend.handle(req).pipe(
      filter((e) => e.type === HttpEventType.Response),
      take(1),
      map((e) => {
        const res = e as HttpResponse<UserRefreshResponseDto>;
        const body = res.body;
        if (!body?.accessToken) {
          throw new Error('Invalid refresh response');
        }
        return body;
      }),
      tap((body) => {
        this.tokens.applyAccessFromAuthResponse(
          body.accessToken,
          body.expiresIn ?? 900,
          { clearStoredRefreshToken: true },
        );
      }),
      catchError((err) => {
        this.tokens.clear();
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => {
        this.inFlight = null;
      }),
    );
    return this.inFlight;
  }
}
