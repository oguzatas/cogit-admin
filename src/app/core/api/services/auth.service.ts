import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserLogoutRequestDto,
  UserLogoutResponseDto,
  UserRefreshResponseDto,
  UserRegisterRequestDto,
  UserRegisterResponseDto,
} from '../models/auth.dto';
import { AuthIdentityService } from './auth-identity.service';
import { TokenStorageService } from './token-storage.service';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';

/** `/api/Users` — authentication & session. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly tokens = inject(TokenStorageService);
  private readonly identity = inject(AuthIdentityService);
  private readonly claims = inject(AuthClaimsService);

  register(body: UserRegisterRequestDto): Observable<UserRegisterResponseDto> {
    const url = `${this.apiUrl}/api/Users/register`;
    return this.http.post<UserRegisterResponseDto>(url, body).pipe(
      tap((res) => {
        if (res.accessToken) {
          this.tokens.applyAccessFromAuthResponse(
            res.accessToken,
            res.expiresIn,
            { clearStoredRefreshToken: !res.refreshToken },
          );
          if (res.refreshToken) {
            this.tokens.setRefreshToken(res.refreshToken);
          }
          this.identity.recordLogin(body.email);
          this.claims.syncFromAccessToken();
        }
      }),
    );
  }

  login(body: UserLoginRequestDto): Observable<UserLoginResponseDto> {
    const url = `${this.apiUrl}/api/Users/login`;
    return this.http.post<UserLoginResponseDto>(url, body).pipe(
      tap((res) => {
        this.tokens.applyAccessFromAuthResponse(
          res.accessToken,
          res.expiresIn,
          { clearStoredRefreshToken: true },
        );
        this.identity.recordLogin(body.email);
        this.claims.syncFromAccessToken();
      }),
    );
  }

  /**
   * Refresh access token; prefer the HTTP `authInterceptor` flow on 401.
   * Uses cookie-based refresh when the server sets `refresh_token` HttpOnly.
   */
  refresh(): Observable<UserRefreshResponseDto> {
    const url = `${this.apiUrl}/api/Users/refresh`;
    return this.http.post<UserRefreshResponseDto>(url, {}).pipe(
      tap((res) => {
        this.tokens.applyAccessFromAuthResponse(
          res.accessToken,
          res.expiresIn ?? 900,
          { clearStoredRefreshToken: true },
        );
        this.claims.syncFromAccessToken();
      }),
    );
  }

  logout(): Observable<UserLogoutResponseDto> {
    const url = `${this.apiUrl}/api/Users/logout`;
    const body: UserLogoutRequestDto = {};
    return this.http.post<UserLogoutResponseDto>(url, body).pipe(
      tap(() => {
        this.identity.clear();
        this.claims.clear();
      }),
    );
  }
}
