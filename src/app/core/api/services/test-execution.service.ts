import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '@/app/core/api/tokens/api-url.token';
import {
  normalizeAssignmentSession,
  normalizeGuestTokenResponse,
  normalizeSubmitResult,
} from '@/app/core/api/mappers/test-execution.mapper';
import type {
  AssignmentSessionDto,
  GuestTokenResponseDto,
  IssueGuestTokenRequestDto,
  SubmitAssignmentResultDto,
  UpsertAssignmentAnswerCommandDto,
} from '@/app/core/api/models/test-execution.dto';

/**
 * Guest/Employee context — taking an assigned test.
 *
 * The Guest JWT must be passed to session/answers/submit endpoints. This service
 * can either:
 * - accept a token per call (preferred for clarity), or
 * - store a token in-memory for the current session.
 *
 * We support both: `setGuestAccessToken` for app flows, and optional `accessToken`
 * parameters for direct usage/testing.
 */
@Injectable({ providedIn: 'root' })
export class TestExecutionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private guestAccessToken: string | null = null;

  setGuestAccessToken(token: string | null): void {
    this.guestAccessToken = token && token.trim() ? token.trim() : null;
  }

  exchangeAccessKey(accessKey: string): Observable<GuestTokenResponseDto> {
    const body: IssueGuestTokenRequestDto = { accessKey };
    return this.http
      .post<unknown>(`${this.apiUrl}/api/Assignments/access`, body)
      .pipe(map((raw) => normalizeGuestTokenResponse(raw)));
  }

  getSession(accessToken?: string): Observable<AssignmentSessionDto> {
    return this.http
      .get<unknown>(
      `${this.apiUrl}/api/Assignments/session`,
      { headers: this.authHeaders(accessToken) },
      )
      .pipe(map((raw) => normalizeAssignmentSession(raw)));
  }

  upsertAnswer(
    payload: UpsertAssignmentAnswerCommandDto,
    accessToken?: string,
  ): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/Assignments/answers`, payload, {
      headers: this.authHeaders(accessToken),
    });
  }

  submitAssignment(accessToken?: string): Observable<SubmitAssignmentResultDto> {
    return this.http
      .post<unknown>(`${this.apiUrl}/api/Assignments/submit`, {}, {
        headers: this.authHeaders(accessToken),
      })
      .pipe(map((raw) => normalizeSubmitResult(raw)));
  }

  private authHeaders(override?: string): HttpHeaders {
    const token = (override ?? this.guestAccessToken ?? '').trim();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}

