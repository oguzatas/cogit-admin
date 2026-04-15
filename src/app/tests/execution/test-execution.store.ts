import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of, type Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import { TestExecutionService } from '@/app/core/api/services/test-execution.service';
import type {
  AssignmentSessionDto,
  GuestTokenResponseDto,
  UpsertAssignmentAnswerCommandDto,
} from '@/app/core/api/models/test-execution.dto';

@Injectable({ providedIn: 'root' })
export class TestExecutionStore {
  private readonly api = inject(TestExecutionService);
  private readonly messages = inject(MessageService);

  readonly guestToken = signal<GuestTokenResponseDto | null>(null);
  readonly session = signal<AssignmentSessionDto | null>(null);

  readonly loadingToken = signal(false);
  readonly loadingSession = signal(false);
  readonly savingAnswer = signal(false);
  readonly submitting = signal(false);

  /** Latest in-progress answers keyed by questionId (UI-friendly). */
  readonly answers = signal<Record<string, UpsertAssignmentAnswerCommandDto>>({});

  readonly isReady = computed(() => !!this.guestToken() && !!this.session());

  clear(): void {
    this.guestToken.set(null);
    this.session.set(null);
    this.answers.set({});
    this.api.setGuestAccessToken(null);
  }

  exchangeAccessKey$(accessKey: string): Observable<GuestTokenResponseDto> {
    this.loadingToken.set(true);
    return this.api.exchangeAccessKey(accessKey).pipe(
      tap((token) => {
        this.guestToken.set(token);
        this.api.setGuestAccessToken(token.accessToken);
      }),
      finalize(() => this.loadingToken.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not open assignment',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  loadSession$(): Observable<void> {
    if (!this.guestToken()?.accessToken) {
      return of(void 0);
    }
    this.loadingSession.set(true);
    return this.api.getSession().pipe(
      tap((s) => {
        this.session.set(s);
      }),
      map(() => void 0),
      finalize(() => this.loadingSession.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not load test session',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  /** Updates local state and persists to backend (safe to call repeatedly). */
  upsertAnswer$(payload: UpsertAssignmentAnswerCommandDto): Observable<void> {
    this.savingAnswer.set(true);
    this.answers.update((cur) => ({ ...cur, [String(payload.questionId)]: payload }));
    return this.api.upsertAnswer(payload).pipe(
      finalize(() => this.savingAnswer.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not save answer',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  submit$(): Observable<string> {
    this.submitting.set(true);
    return this.api.submitAssignment().pipe(
      tap((res) => {
        this.messages.add({
          severity: 'success',
          summary: 'Submitted',
          detail: res.status,
        });
      }),
      map((res) => res.status),
      finalize(() => this.submitting.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not submit',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }
}

