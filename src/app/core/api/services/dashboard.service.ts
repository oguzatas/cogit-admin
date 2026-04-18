import { Injectable, inject } from '@angular/core';
import { forkJoin, of, type Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AssignmentService } from '@/app/core/api/services/assignment.service';
import { AuditLogService } from '@/app/core/api/services/audit-log.service';
import { DepartmentService } from '@/app/core/api/services/department.service';
import { TenantService } from '@/app/core/api/services/tenant.service';
import { TestService } from '@/app/core/api/services/test.service';
import type { AssignmentResultListItemDto } from '@/app/core/api/models/assignment.dto';
import type { AuditLogEntryDto } from '@/app/core/api/models/audit-log.dto';
import type { DashboardSnapshotDto } from '@/app/core/api/models/dashboard.dto';
import type { TenantResponseDto } from '@/app/core/api/models/tenant.dto';
import type { TestListItemResponseDto } from '@/app/core/api/models/test.dto';

export interface DashboardLoadContext {
  isSuperAdmin: boolean;
  tenantId: string | null;
}

function isCompletedStatus(status: string): boolean {
  const x = (status ?? '').toLowerCase().replace(/\s+/g, '');
  return x.includes('complete') && !x.includes('incomplete');
}

function statusBucket(status: string): 'completed' | 'in_progress' | 'pending' {
  const x = (status ?? '').toLowerCase().replace(/\s+/g, '');
  if (x.includes('complete') && !x.includes('incomplete')) {
    return 'completed';
  }
  if (x.includes('progress') || x === 'inprogress') {
    return 'in_progress';
  }
  return 'pending';
}

function buildLineChart(assignments: AssignmentResultListItemDto[], days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const isoKeys: string[] = [];
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    isoKeys.push(key);
    buckets.set(key, 0);
  }
  for (const a of assignments) {
    if (!isCompletedStatus(a.status)) {
      continue;
    }
    const raw = a.date;
    if (!raw) {
      continue;
    }
    const day = new Date(raw).toISOString().slice(0, 10);
    if (buckets.has(day)) {
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }
  }
  const data = isoKeys.map((k) => buckets.get(k) ?? 0);
  const labels = isoKeys.map((iso) => {
    const [, m, day] = iso.split('-');
    return `${m}/${day}`;
  });
  return { labels, data };
}

function buildPieChart(assignments: AssignmentResultListItemDto[]) {
  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  for (const a of assignments) {
    const b = statusBucket(a.status);
    if (b === 'completed') {
      completed++;
    } else if (b === 'in_progress') {
      inProgress++;
    } else {
      pending++;
    }
  }
  return {
    labels: ['Completed', 'In progress', 'Pending'],
    data: [completed, inProgress, pending],
    backgroundColor: [
      'rgba(16, 185, 129, 0.88)',
      'rgba(59, 130, 246, 0.88)',
      'rgba(245, 158, 11, 0.88)',
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly tests = inject(TestService);
  private readonly assignmentsApi = inject(AssignmentService);
  private readonly tenantsApi = inject(TenantService);
  private readonly departmentsApi = inject(DepartmentService);
  private readonly auditApi = inject(AuditLogService);

  loadSnapshot$(ctx: DashboardLoadContext): Observable<DashboardSnapshotDto> {
    const tenantParam = ctx.isSuperAdmin ? undefined : ctx.tenantId ?? undefined;
    return forkJoin({
      tests: this.tests.list().pipe(catchError(() => of([] as TestListItemResponseDto[]))),
      assignments: this.loadAllAssignments$(tenantParam).pipe(
        catchError(() => of([] as AssignmentResultListItemDto[])),
      ),
      tenants: ctx.isSuperAdmin
        ? this.tenantsApi.list().pipe(catchError(() => of([] as TenantResponseDto[])))
        : of([] as TenantResponseDto[]),
      departments:
        !ctx.isSuperAdmin && ctx.tenantId
          ? this.departmentsApi.list(ctx.tenantId).pipe(catchError(() => of([])))
          : of([]),
      audit: this.auditApi.listRecent(20),
    }).pipe(
      map(({ tests, assignments, tenants, departments, audit }) =>
        this.compose(tests, assignments, tenants, departments, audit, ctx),
      ),
    );
  }

  private loadAllAssignments$(
    tenantId?: string,
  ): Observable<AssignmentResultListItemDto[]> {
    const pageSize = 150;
    const maxPages = 40;
    const fetchPage = (
      page: number,
      acc: AssignmentResultListItemDto[],
    ): Observable<AssignmentResultListItemDto[]> => {
      return this.assignmentsApi
        .listPaged({ pageNumber: page, pageSize, tenantId })
        .pipe(
          switchMap((res) => {
            const merged = [...acc, ...res.items];
            if (res.hasNextPage && page < maxPages) {
              return fetchPage(page + 1, merged);
            }
            return of(merged);
          }),
        );
    };
    return fetchPage(1, []);
  }

  private compose(
    tests: TestListItemResponseDto[],
    assignments: AssignmentResultListItemDto[],
    tenants: TenantResponseDto[],
    departments: { id: string }[],
    audit: AuditLogEntryDto[],
    ctx: DashboardLoadContext,
  ): DashboardSnapshotDto {
    const activeTests = tests.filter((t) => t.isPublished).length;
    const completedAssessments = assignments.filter((a) => isCompletedStatus(a.status)).length;
    const pendingAssignments = Math.max(0, assignments.length - completedAssessments);

    const fourthValue = ctx.isSuperAdmin
      ? tenants.filter((t) => !t.isDeleted).length
      : departments.length;

    return {
      kpis: {
        activeTests,
        pendingAssignments,
        completedAssessments,
        fourthValue,
        fourthLabel: ctx.isSuperAdmin ? 'active_tenants' : 'departments',
      },
      lineChart: buildLineChart(assignments, 14),
      pieChart: buildPieChart(assignments),
      auditTrail: audit,
    };
  }
}
