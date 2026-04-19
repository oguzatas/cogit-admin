import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, reduce, switchMap } from 'rxjs/operators';
import { TenantEmployeeService } from '@/app/core/api/services/tenant-employee.service';
import { API_URL } from '../tokens/api-url.token';
import type {
  AssignmentCreateRequestDto,
  AssignmentCreateResponseDto,
  AssignmentListItemResponseDto,
  AssignmentsPagedQueryDto,
  AssignmentResultListItemDto,
  PagedAssignmentsResponseDto,
} from '../models/assignment.dto';
import type {
  EmployeeAssignmentDto,
  TenantEmployeeListItemDto,
} from '../models/tenant-employee.dto';

/**
 * OpenAPI: `POST /api/Assignments` only on the collection path — there is no list endpoint.
 * Admin views build assignment rows from `GET /api/TenantEmployees` + `GET .../assignments` per employee.
 */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly tenantEmployees = inject(TenantEmployeeService);

  /** Full merged rows (one tenant scan) — for dashboards and store-side caching. */
  mergedAssignmentRows$(tenantId: string): Observable<AssignmentResultListItemDto[]> {
    const tid = tenantId.trim();
    if (!tid) {
      return of([]);
    }
    return this.collectForTenant(tid).pipe(map((b) => b.resultItems));
  }

  /** Page employees (max 100/page per API) then merge all assignment rows for the tenant. */
  listByTenant(tenantId: string): Observable<AssignmentListItemResponseDto[]> {
    return this.collectForTenant(tenantId).pipe(map((b) => b.listItems));
  }

  /**
   * Client-side paging over merged assignment rows. Requires `tenantId` (no global list in OpenAPI).
   */
  listPaged(query: AssignmentsPagedQueryDto): Observable<PagedAssignmentsResponseDto> {
    const tid = query.tenantId?.trim();
    if (!tid) {
      return of(this.emptyPage(query));
    }
    const size = query.pageSize > 0 ? query.pageSize : 10;
    return this.collectForTenant(tid).pipe(
      map((bundle) => this.sliceResults(bundle.resultItems, query.pageNumber, size)),
      catchError(() => of(this.emptyPage({ ...query, pageSize: size }))),
    );
  }

  create(body: AssignmentCreateRequestDto): Observable<AssignmentCreateResponseDto> {
    return this.http.post<AssignmentCreateResponseDto>(
      `${this.apiUrl}/api/Assignments`,
      body,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Assignments/${encodeURIComponent(id)}`,
    );
  }

  private emptyPage(query: AssignmentsPagedQueryDto): PagedAssignmentsResponseDto {
    const size = query.pageSize > 0 ? query.pageSize : 10;
    return {
      items: [],
      totalRecords: 0,
      pageNumber: query.pageNumber,
      pageSize: size,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  private sliceResults(
    items: AssignmentResultListItemDto[],
    pageNumber: number,
    pageSize: number,
  ): PagedAssignmentsResponseDto {
    const total = items.length;
    const start = (pageNumber - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
    return {
      items: slice,
      totalRecords: total,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage: start + pageSize < total,
      hasPreviousPage: pageNumber > 1,
    };
  }

  private collectForTenant(tenantId: string): Observable<{
    listItems: AssignmentListItemResponseDto[];
    resultItems: AssignmentResultListItemDto[];
  }> {
    return this.fetchAllEmployees(tenantId).pipe(
      switchMap((employees) => {
        if (employees.length === 0) {
          return of({ listItems: [], resultItems: [] });
        }
        return from(employees).pipe(
          mergeMap(
            (employee) =>
              this.tenantEmployees.getAssignments(employee.id).pipe(
                map((assignments) => ({ employee, assignments })),
                catchError(() =>
                  of({ employee, assignments: [] as EmployeeAssignmentDto[] }),
                ),
              ),
            8,
          ),
          reduce(
            (acc, { employee, assignments }) => {
              for (const a of assignments) {
                acc.listItems.push(this.toListItem(employee, a, tenantId));
                acc.resultItems.push(this.toResultItem(employee, a));
              }
              return acc;
            },
            {
              listItems: [] as AssignmentListItemResponseDto[],
              resultItems: [] as AssignmentResultListItemDto[],
            },
          ),
          map((acc) => {
            acc.resultItems.sort(
              (x, y) => isoMillis(y.date) - isoMillis(x.date),
            );
            return acc;
          }),
        );
      }),
    );
  }

  private fetchAllEmployees(tenantId: string): Observable<TenantEmployeeListItemDto[]> {
    const pageSize = 100;
    const next = (
      page: number,
      acc: TenantEmployeeListItemDto[],
    ): Observable<TenantEmployeeListItemDto[]> => {
      return this.tenantEmployees.listPaged(tenantId, { pageNumber: page, pageSize }).pipe(
        switchMap((res) => {
          const merged = [...acc, ...res.items];
          if (res.hasNextPage && page < 500) {
            return next(page + 1, merged);
          }
          return of(merged);
        }),
      );
    };
    return next(1, []);
  }

  private toListItem(
    e: TenantEmployeeListItemDto,
    a: EmployeeAssignmentDto,
    tenantId: string,
  ): AssignmentListItemResponseDto {
    return {
      id: String(a.id),
      tenantId,
      departmentId: String(e.departmentId),
      testId: String(a.testId),
      testTitle: a.testName || null,
      createdAt: a.assignedAt ?? null,
    };
  }

  private toResultItem(
    e: TenantEmployeeListItemDto,
    a: EmployeeAssignmentDto,
  ): AssignmentResultListItemDto {
    return {
      id: String(a.id),
      employeeName: e.fullName,
      testName: a.testName,
      date: a.completedAt || a.assignedAt || null,
      status: a.status,
    };
  }
}

function isoMillis(d: string | null | undefined): number {
  if (!d) {
    return 0;
  }
  const n = Date.parse(d);
  return Number.isFinite(n) ? n : 0;
}
