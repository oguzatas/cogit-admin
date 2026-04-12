import { Injectable, inject, signal } from '@angular/core';
import { TokenStorageService } from './token-storage.service';

/** In-memory view of session email for UI; persisted in {@link TokenStorageService}. */
@Injectable({ providedIn: 'root' })
export class AuthIdentityService {
  private readonly tokens = inject(TokenStorageService);

  readonly email = signal<string | null>(null);

  /** Call on app shell init (e.g. topbar) after a full page load. */
  syncFromStorage(): void {
    this.email.set(this.tokens.getSessionEmail());
  }

  recordLogin(email: string): void {
    const trimmed = email.trim();
    this.tokens.setSessionEmail(trimmed);
    this.email.set(trimmed || null);
  }

  clear(): void {
    this.tokens.clear();
    this.email.set(null);
  }
}
