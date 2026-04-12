import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import type {
  PagedTenantEmployeesResponseDto,
  TenantEmployeeListItemDto,
} from '@/app/core/api/models/tenant-employee.dto';
import { TenantEmployeeService } from '@/app/core/api/services/tenant-employee.service';

const EMPTY_PAGE: PagedTenantEmployeesResponseDto = {
  items: [],
  totalRecords: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function listErrorDetail(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) {
      return String(body.message);
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return err.message || 'Request failed';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Request failed';
}

@Component({
  selector: 'app-tenant-people-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, SelectModule],
  templateUrl: './tenant-people-table.component.html',
})
export class TenantPeopleTableComponent {
  private readonly employeesApi = inject(TenantEmployeeService);
  private readonly messages = inject(MessageService);

  /** Tenant whose directory is loaded (`tenantId` query on GET `/api/TenantEmployees`). */
  tenantId = input.required<string>();

  /** Department names for the filter (structure only; rows come from the API). */
  departments = input<{ id: string; name: string }[]>([]);

  /** Incremented in the store after silent provisioning so this table refetches. */
  directoryRevision = input<number>(0);

  readonly departmentFilter = signal<string>('');
  readonly pageFirst = signal(0);
  readonly pageRows = signal(10);
  readonly loading = signal(false);
  readonly items = signal<TenantEmployeeListItemDto[]>([]);
  readonly totalRecords = signal(0);

  private priorTenantId: string | null = null;

  readonly departmentFilterOptions = computed(() => [
    { label: 'All departments', value: '' },
    ...this.departments().map((d) => ({
      label: d.name,
      value: String(d.id),
    })),
  ]);

  private readonly loadParams = computed(() => ({
    tenantId: this.tenantId(),
    first: this.pageFirst(),
    rows: this.pageRows(),
    departmentId: this.departmentFilter(),
    revision: this.directoryRevision(),
  }));

  private readonly loadParams$ = toObservable(this.loadParams);

  constructor() {
    effect(() => {
      const id = this.tenantId();
      if (id === this.priorTenantId) {
        return;
      }
      this.priorTenantId = id;
      untracked(() => {
        this.pageFirst.set(0);
        this.pageRows.set(10);
        this.departmentFilter.set('');
      });
    });

    effect(() => {
      this.directoryRevision();
      untracked(() => this.pageFirst.set(0));
    });

    this.loadParams$
      .pipe(
        switchMap((p) => {
          if (!p.tenantId) {
            return of(EMPTY_PAGE);
          }
          this.loading.set(true);
          const page = Math.floor(p.first / p.rows) + 1;
          return this.employeesApi
            .listPaged(p.tenantId, {
              pageNumber: page,
              pageSize: p.rows,
              departmentId: p.departmentId || undefined,
            })
            .pipe(
              catchError((err) => {
                this.messages.add({
                  severity: 'error',
                  summary: 'Could not load people',
                  detail: listErrorDetail(err),
                });
                return of(EMPTY_PAGE);
              }),
              finalize(() => this.loading.set(false)),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.items.set(page.items);
        this.totalRecords.set(page.totalRecords);
      });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? 10;
    const first = event.first ?? 0;
    this.pageRows.set(rows);
    this.pageFirst.set(first);
  }

  onDepartmentFilterChange(value: unknown): void {
    const next = value == null ? '' : `${value}`;
    this.departmentFilter.set(next);
    this.pageFirst.set(0);
  }
}
