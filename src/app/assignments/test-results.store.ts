import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { AssignmentService } from '@/app/core/api/services/assignment.service';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import type { AssignmentResultListItemDto } from '@/app/core/api/models/assignment.dto';

@Injectable({ providedIn: 'root' })
export class TestResultsStore {
  private readonly api = inject(AssignmentService);
  private readonly messages = inject(MessageService);
  private readonly claims = inject(AuthClaimsService);

  readonly rows = signal<AssignmentResultListItemDto[]>([]);
  readonly loading = signal(false);
  readonly filterTenantId = signal<string | null>(null);

  readonly totalRecords = signal(0);
  readonly pageNumber = signal(1);
  readonly pageSize = signal(20);

  private mergedAll: AssignmentResultListItemDto[] | null = null;
  private mergedForTenant: string | null = null;

  /** SuperAdmin must pick a tenant — OpenAPI defines no cross-tenant assignment list. */
  readonly needsTenantForResults = computed(
    () => this.claims.isSuperAdmin() && !this.filterTenantId(),
  );

  /**
   * Loads one page of assignments for the effective tenant. Merges employees + assignments
   * once per tenant, then slices client-side for table pages.
   */
  loadPage(pageNumber: number, pageSize?: number): void {
    if (pageSize != null && pageSize > 0) {
      this.pageSize.set(pageSize);
    }
    const size = this.pageSize();
    this.pageNumber.set(pageNumber);

    const tenantId = this.effectiveTenantId();
    if (!tenantId) {
      this.clearMergeCache();
      this.rows.set([]);
      this.totalRecords.set(0);
      this.loading.set(false);
      return;
    }

    if (this.mergedForTenant === tenantId && this.mergedAll) {
      this.applySlice(this.mergedAll, pageNumber, size);
      return;
    }

    this.loading.set(true);
    this.api
      .mergedAssignmentRows$(tenantId)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load test results',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as AssignmentResultListItemDto[]);
        }),
      )
      .subscribe((all) => {
        this.mergedAll = all;
        this.mergedForTenant = tenantId;
        this.applySlice(all, pageNumber, size);
      });
  }

  refresh(): void {
    this.clearMergeCache();
    this.loadPage(this.pageNumber(), this.pageSize());
  }

  setTenantFilter(tenantId: string | null): void {
    this.filterTenantId.set(tenantId);
    this.clearMergeCache();
    this.loadPage(1);
  }

  private effectiveTenantId(): string | null {
    const fromFilter = this.filterTenantId();
    if (fromFilter) {
      return fromFilter;
    }
    if (!this.claims.isSuperAdmin()) {
      return this.claims.tenantId();
    }
    return null;
  }

  private clearMergeCache(): void {
    this.mergedAll = null;
    this.mergedForTenant = null;
  }

  private applySlice(
    all: AssignmentResultListItemDto[],
    pageNumber: number,
    pageSize: number,
  ): void {
    const total = all.length;
    const start = (pageNumber - 1) * pageSize;
    this.rows.set(all.slice(start, start + pageSize));
    this.totalRecords.set(total);
    this.pageNumber.set(pageNumber);
    if (pageSize > 0) {
      this.pageSize.set(pageSize);
    }
  }
}
