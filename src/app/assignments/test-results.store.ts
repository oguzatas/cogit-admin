import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { AssignmentService } from '@/app/core/api/services/assignment.service';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import type { AssignmentResultListItemDto } from '@/app/core/api/models/assignment.dto';

@Injectable({ providedIn: 'root' })
export class TestResultsStore {
  private readonly api = inject(AssignmentService);
  private readonly messages = inject(MessageService);

  readonly rows = signal<AssignmentResultListItemDto[]>([]);
  readonly loading = signal(false);
  readonly filterTenantId = signal<string | null>(null);

  readonly totalRecords = signal(0);
  readonly pageNumber = signal(1);
  readonly pageSize = signal(20);

  /**
   * Loads one page of assignments from GET `/api/Assignments` (paginated).
   */
  loadPage(pageNumber: number, pageSize?: number): void {
    if (pageSize != null && pageSize > 0) {
      this.pageSize.set(pageSize);
    }
    const size = this.pageSize();
    this.pageNumber.set(pageNumber);
    this.loading.set(true);
    this.api
      .listPaged({
        pageNumber,
        pageSize: size,
        tenantId: this.filterTenantId() ?? undefined,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load test results',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of({
            items: [] as AssignmentResultListItemDto[],
            totalRecords: 0,
            pageNumber: 1,
            pageSize: size,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }),
      )
      .subscribe((res) => {
        this.rows.set(res.items);
        this.totalRecords.set(res.totalRecords);
        if (res.pageSize > 0) {
          this.pageSize.set(res.pageSize);
        }
      });
  }

  /** First page (e.g. after tenant filter change). */
  refresh(): void {
    this.loadPage(1);
  }

  setTenantFilter(tenantId: string | null): void {
    this.filterTenantId.set(tenantId);
    this.loadPage(1);
  }
}
