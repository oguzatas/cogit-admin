import { Injectable } from '@angular/core';

const ACCESS_KEY = 'ik_access_token';
const REFRESH_KEY = 'ik_refresh_token';
const SESSION_EMAIL_KEY = 'ik_session_email';
/** Epoch ms when the current access token should be treated as expired for routing (server `expiresIn`). */
const ACCESS_EXPIRES_AT_KEY = 'ik_access_expires_at';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  }

  /** Legacy body refresh token; prefer HttpOnly cookie for `/api/Users/refresh`. */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  getSessionEmail(): string | null {
    return sessionStorage.getItem(SESSION_EMAIL_KEY);
  }

  /** Wall-clock expiry from server `expiresIn`; `null` if unknown. */
  getAccessExpiresAtMs(): number | null {
    const raw = sessionStorage.getItem(ACCESS_EXPIRES_AT_KEY);
    if (raw == null) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  setAccessToken(accessToken: string): void {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
  }

  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  setSessionEmail(email: string): void {
    sessionStorage.setItem(SESSION_EMAIL_KEY, email);
  }

  /**
   * Records when the access token should be considered expired for client routing.
   * Omit or pass non-positive `expiresInSeconds` to clear (JWT-only `exp` gating).
   */
  setAccessExpiryFromTtlSeconds(expiresInSeconds?: number | null): void {
    if (
      expiresInSeconds != null &&
      Number.isFinite(expiresInSeconds) &&
      expiresInSeconds > 0
    ) {
      sessionStorage.setItem(
        ACCESS_EXPIRES_AT_KEY,
        String(Date.now() + expiresInSeconds * 1000),
      );
    } else {
      sessionStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
    }
  }

  /**
   * Stores access + optional TTL from login/refresh; clears JS-held refresh token
   * when using HttpOnly cookie refresh.
   */
  applyAccessFromAuthResponse(
    accessToken: string,
    expiresInSeconds?: number | null,
    options?: { clearStoredRefreshToken?: boolean },
  ): void {
    this.setAccessToken(accessToken);
    this.setAccessExpiryFromTtlSeconds(expiresInSeconds);
    if (options?.clearStoredRefreshToken !== false) {
      sessionStorage.removeItem(REFRESH_KEY);
    }
  }

  clear(): void {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_EXPIRES_AT_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
  }
}
