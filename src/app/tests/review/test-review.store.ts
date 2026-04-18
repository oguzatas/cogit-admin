import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of, type Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import { TestReviewService } from '@/app/core/api/services/test-review.service';
import type { AssignmentResultViewDto, ManualGradeDto } from '@/app/core/api/models/test-review.dto';

@Injectable({ providedIn: 'root' })
export class TestReviewStore {
  private readonly api = inject(TestReviewService);
  private readonly messages = inject(MessageService);

  readonly assignmentId = signal<string | null>(null);
  readonly results = signal<AssignmentResultViewDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly calculated = computed(() => this.results()?.results ?? []);

  setAssignmentId(id: string | null): void {
    this.assignmentId.set(id);
    if (!id) {
      this.results.set(null);
    }
  }

  loadResults$(assignmentId: string): Observable<void> {
    this.setAssignmentId(assignmentId);
    this.results.set(null);
    this.loading.set(true);
    return this.api.getResults(assignmentId).pipe(
      tap((res) => this.results.set(res)),
      map(() => void 0),
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not load results',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  submitManualGrade$(
    assignmentId: string,
    payload: ManualGradeDto,
  ): Observable<void> {
    if (!assignmentId) {
      return of(void 0);
    }
    this.saving.set(true);
    return this.api.submitManualGrade(assignmentId, payload).pipe(
      tap(() => {
        this.messages.add({
          severity: 'success',
          summary: 'Manual grade saved',
          detail: payload.variableKey ?? payload.questionId ?? 'Question',
        });
      }),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not save grade',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }
}

