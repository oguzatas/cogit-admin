import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EMPTY, of, type Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import type {
  TestCreateRequestDto,
  TestListItemResponseDto,
  TestResponseDto,
  TestUpdateRequestDto,
} from '@/app/core/api/models/test.dto';
import { TestService } from '@/app/core/api/services/test.service';

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) {
      return String(body.message);
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class TestsStore {
  private readonly api = inject(TestService);
  private readonly messages = inject(MessageService);

  readonly listLoading = signal(false);
  readonly tests = signal<TestListItemResponseDto[]>([]);

  readonly publishedCount = computed(
    () => this.tests().filter((t) => t.isPublished).length,
  );

  refresh(): void {
    this.listLoading.set(true);
    this.api
      .list()
      .pipe(
        finalize(() => this.listLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load tests',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as TestListItemResponseDto[]);
        }),
      )
      .subscribe((rows) => this.tests.set(rows));
  }

  getById$(id: string): Observable<TestResponseDto> {
    return this.api.getById(id).pipe(
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not load test',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        return EMPTY;
      }),
    );
  }

  create$(body: TestCreateRequestDto): Observable<TestResponseDto> {
    return this.api.create(body).pipe(
      tap((created) => {
        this.messages.add({
          severity: 'success',
          summary: 'Test created',
          detail: created.name,
        });
      }),
      tap(() => this.refresh()),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not create test',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  update$(
    id: string,
    body: TestUpdateRequestDto,
    options?: { successSummary?: string },
  ): Observable<TestResponseDto> {
    return this.api.update(id, body).pipe(
      tap((updated) => {
        this.messages.add({
          severity: 'success',
          summary: options?.successSummary ?? 'Test updated',
          detail: updated.name,
        });
      }),
      tap(() => this.refresh()),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not update test',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  delete$(id: string): Observable<void> {
    return this.api.delete(id).pipe(
      tap(() => {
        this.messages.add({
          severity: 'success',
          summary: 'Test deleted',
        });
      }),
      tap(() => this.refresh()),
      map(() => void 0),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete test',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }
}

