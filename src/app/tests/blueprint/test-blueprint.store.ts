import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { forkJoin, of, type Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import { TestBlueprintService } from '@/app/core/api/services/test-blueprint.service';
import type {
  BlueprintQuestion,
  ScoringMetric,
  TestVariable,
} from '@/app/core/api/models/test-blueprint.models';
import type {
  CreateQuestionCommand,
  CreateScoringScaleCommand,
  CreateTestVariableCommand,
  SyncTestBlueprintCommand,
  UpdateQuestionCommand,
  UpdateScoringScaleCommand,
  UpdateTestVariableCommand,
} from '@/app/core/api/models/test-blueprint.dto';

@Injectable({ providedIn: 'root' })
export class TestBlueprintStore {
  private readonly api = inject(TestBlueprintService);
  private readonly messages = inject(MessageService);

  readonly testId = signal<string | null>(null);

  readonly variables = signal<TestVariable[]>([]);
  readonly metrics = signal<ScoringMetric[]>([]);
  readonly questions = signal<BlueprintQuestion[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);

  /**
   * Set to true by TestBuilderComponent when there is a new question draft
   * that has not yet been POSTed. Used by the page to gate back-navigation.
   */
  readonly hasUnsavedQuestion = signal(false);

  readonly selectedQuestionId = signal<string | null>(null);
  readonly selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    if (!id) {
      return null;
    }
    return this.questions().find((q) => String(q.id) === String(id)) ?? null;
  });

  setTestId(testId: string | null): void {
    this.testId.set(testId);
    if (!testId) {
      this.variables.set([]);
      this.metrics.set([]);
      this.questions.set([]);
      this.selectedQuestionId.set(null);
    }
  }

  /** Loads variables + metrics + questions in parallel. */
  hydrate$(testId: string): Observable<void> {
    this.setTestId(testId);
    this.loading.set(true);
    return forkJoin({
      variables: this.api.getVariables(testId).pipe(catchError(() => of([]))),
      metrics: this.api.getMetrics(testId).pipe(catchError(() => of([]))),
      questions: this.api.getQuestions(testId).pipe(catchError(() => of([]))),
    }).pipe(
      tap(({ variables, metrics, questions }) => {
        this.variables.set(variables);
        this.metrics.set(metrics);
        const sorted = questions
          .slice()
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        this.questions.set(sorted);
        this.selectedQuestionId.set(sorted[0]?.id ?? null);
      }),
      map(() => void 0),
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not load test blueprint',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  refreshVariables$(): Observable<void> {
    const id = this.testId();
    if (!id) {
      return of(void 0);
    }
    return this.api.getVariables(id).pipe(
      tap((rows) => this.variables.set(rows)),
      map(() => void 0),
    );
  }

  refreshMetrics$(): Observable<void> {
    const id = this.testId();
    if (!id) {
      return of(void 0);
    }
    return this.api.getMetrics(id).pipe(
      tap((rows) => this.metrics.set(rows)),
      map(() => void 0),
    );
  }

  refreshQuestions$(): Observable<void> {
    const id = this.testId();
    if (!id) {
      return of(void 0);
    }
    return this.api.getQuestions(id).pipe(
      tap((rows) =>
        this.questions.set(
          rows.slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        ),
      ),
      tap(() => {
        const cur = this.selectedQuestionId();
        if (cur && !this.questions().some((q) => String(q.id) === String(cur))) {
          this.selectedQuestionId.set(this.questions()[0]?.id ?? null);
        }
      }),
      map(() => void 0),
    );
  }

  createVariable$(payload: CreateTestVariableCommand): Observable<TestVariable> {
    const tid = this.testId();
    if (!tid) {
      throw new Error('testId is required');
    }
    this.saving.set(true);
    return this.api.createVariable(tid, payload).pipe(
      tap((created) => {
        this.variables.update((list) => [...list, created].sort((a, b) => a.key.localeCompare(b.key)));
        this.messages.add({
          severity: 'success',
          summary: 'Variable created',
          detail: created.key,
        });
      }),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not create variable',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  updateVariable$(id: string, payload: UpdateTestVariableCommand): Observable<void> {
    this.saving.set(true);
    return this.api.updateVariable(id, payload).pipe(
      switchMap(() => this.refreshVariables$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Variable updated',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not update variable',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  deleteVariable$(id: string): Observable<void> {
    this.saving.set(true);
    return this.api.deleteVariable(id).pipe(
      switchMap(() => this.refreshVariables$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Variable deleted',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete variable',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  createMetric$(payload: CreateScoringScaleCommand): Observable<ScoringMetric> {
    const tid = this.testId();
    if (!tid) {
      throw new Error('testId is required');
    }
    this.saving.set(true);
    return this.api.createMetric(tid, payload).pipe(
      tap((created) => {
        this.metrics.update((list) => [...list, created]);
        this.messages.add({
          severity: 'success',
          summary: 'Metric created',
          detail: created.name,
        });
      }),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not create metric',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  updateMetric$(id: string, payload: UpdateScoringScaleCommand): Observable<void> {
    this.saving.set(true);
    return this.api.updateMetric(id, payload).pipe(
      switchMap(() => this.refreshMetrics$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Metric updated',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not update metric',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  deleteMetric$(id: string): Observable<void> {
    this.saving.set(true);
    return this.api.deleteMetric(id).pipe(
      switchMap(() => this.refreshMetrics$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Metric deleted',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete metric',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  createQuestion$(payload: CreateQuestionCommand): Observable<BlueprintQuestion> {
    const tid = this.testId();
    if (!tid) {
      throw new Error('testId is required');
    }
    this.saving.set(true);
    return this.api.createQuestion(tid, payload).pipe(
      tap((created) => {
        this.questions.update((list) =>
          [...list, created].slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
        this.selectedQuestionId.set(created.id);
        this.messages.add({
          severity: 'success',
          summary: 'Question created',
        });
      }),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not create question',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  updateQuestion$(id: string, payload: UpdateQuestionCommand): Observable<void> {
    this.saving.set(true);
    return this.api.updateQuestion(id, payload).pipe(
      switchMap(() => this.refreshQuestions$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Question updated',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not update question',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  deleteQuestion$(id: string): Observable<void> {
    this.saving.set(true);
    return this.api.deleteQuestion(id).pipe(
      switchMap(() => this.refreshQuestions$()),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Question deleted',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete question',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  /**
   * Sends the full blueprint payload to `PUT /api/Tests/{id}/blueprint-sync`,
   * then re-hydrates all signals so the visual builder reflects the new state.
   */
  syncBlueprint$(payload: SyncTestBlueprintCommand): Observable<void> {
    const tid = this.testId();
    if (!tid) {
      throw new Error('testId is required');
    }
    this.saving.set(true);
    return this.api.syncBlueprint(tid, payload).pipe(
      switchMap(() => this.hydrate$(tid)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Blueprint synced',
          detail: 'All changes have been applied and the builder has been refreshed.',
        }),
      ),
      finalize(() => this.saving.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Sync failed',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }
}

