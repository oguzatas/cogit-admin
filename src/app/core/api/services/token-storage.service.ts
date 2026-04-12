import { Injectable } from '@angular/core';

const ACCESS_KEY = 'ik_access_token';
const REFRESH_KEY = 'ik_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  setAccessToken(accessToken: string): void {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
  }

  setRefreshToken(refreshToken: string): void {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  clear(): void {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }
}
