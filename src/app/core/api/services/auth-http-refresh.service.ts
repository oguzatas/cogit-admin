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
import type {
  UserRefreshRequestDto,
  UserRefreshResponseDto,
} from '../models/auth.dto';
import { TokenStorageService } from './token-storage.service';

/**
 * Performs refresh using {@link HttpBackend} so the auth interceptor is not re-entered.
 * De-duplicates concurrent refresh calls.
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
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    const url = `${this.apiUrl}/api/Users/refresh`;
    const req = new HttpRequest<UserRefreshRequestDto>(
      'POST',
      url,
      { refreshToken },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
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
        this.tokens.setAccessToken(body.accessToken);
        if (body.refreshToken) {
          this.tokens.setRefreshToken(body.refreshToken);
        }
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
