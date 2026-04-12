import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  UserLoginRequestDto,
  UserLoginResponseDto,
  UserLogoutRequestDto,
  UserLogoutResponseDto,
  UserRefreshRequestDto,
  UserRefreshResponseDto,
  UserRegisterRequestDto,
  UserRegisterResponseDto,
} from '../models/auth.dto';
import { TokenStorageService } from './token-storage.service';

/** `/api/Users` — authentication & session. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly tokens = inject(TokenStorageService);

  register(body: UserRegisterRequestDto): Observable<UserRegisterResponseDto> {
    const url = `${this.apiUrl}/api/Users/register`;
    return this.http.post<UserRegisterResponseDto>(url, body).pipe(
      tap((res) => {
        if (res.accessToken && res.refreshToken) {
          this.tokens.setTokens(res.accessToken, res.refreshToken);
        }
      }),
    );
  }

  login(body: UserLoginRequestDto): Observable<UserLoginResponseDto> {
    const url = `${this.apiUrl}/api/Users/login`;
    return this.http.post<UserLoginResponseDto>(url, body).pipe(
      tap((res) => this.tokens.setTokens(res.accessToken, res.refreshToken)),
    );
  }

  /**
   * Refresh tokens. Prefer letting {@link authInterceptor} call this flow on 401;
   * exposed for explicit refresh if needed.
   */
  refresh(body: UserRefreshRequestDto): Observable<UserRefreshResponseDto> {
    const url = `${this.apiUrl}/api/Users/refresh`;
    return this.http.post<UserRefreshResponseDto>(url, body).pipe(
      tap((res) => {
        this.tokens.setAccessToken(res.accessToken);
        if (res.refreshToken) {
          this.tokens.setRefreshToken(res.refreshToken);
        }
      }),
    );
  }

  logout(): Observable<UserLogoutResponseDto> {
    const url = `${this.apiUrl}/api/Users/logout`;
    const body: UserLogoutRequestDto = {};
    return this.http.post<UserLogoutResponseDto>(url, body).pipe(
      tap(() => this.tokens.clear()),
    );
  }
}
