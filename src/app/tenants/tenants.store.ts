import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EMPTY, forkJoin, of, type Observable } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { AssignmentService } from '@/app/core/api/services/assignment.service';
import { DepartmentService } from '@/app/core/api/services/department.service';
import { InviteCodeService } from '@/app/core/api/services/invite-code.service';
import { TenantEmployeeService } from '@/app/core/api/services/tenant-employee.service';
import { TenantService } from '@/app/core/api/services/tenant.service';
import type { InviteCodeListItemResponseDto } from '@/app/core/api/models/invite-code.dto';
import type { DepartmentResponseDto } from '@/app/core/api/models/department.dto';
import {
  buildTenantFromParts,
  groupAssignmentsToDistributions,
  mapDepartmentShell,
  mapInviteDto,
  normalizeTenantResponseDto,
} from './tenants.dto-mapper';
import type { Department, InviteLink, Tenant } from './tenants.models';

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
export class TenantsStore {
  private readonly tenantsApi = inject(TenantService);
  private readonly departmentsApi = inject(DepartmentService);
  private readonly inviteCodesApi = inject(InviteCodeService);
  private readonly employeesApi = inject(TenantEmployeeService);
  private readonly assignmentsApi = inject(AssignmentService);
  private readonly messages = inject(MessageService);

  readonly tenants = signal<Tenant[]>([]);
  readonly selectedTenantId = signal<string | null>(null);
  readonly listLoading = signal(false);
  readonly detailLoading = signal(false);

  /**
   * Bumped after silent provisioning so the people directory can refetch from
   * {@link TenantEmployeeService.listPaged} without coupling the store to that UI.
   */
  readonly tenantPeopleDirectoryRevision = signal(0);

  readonly selectedTenant = computed(() => {
    const id = this.selectedTenantId();
    if (!id) {
      return null;
    }
    return (
      this.tenants().find((t) => String(t.id) === String(id)) ?? null
    );
  });

  readonly tenantCount = computed(() => this.tenants().length);

  selectTenant(tenantId: string | null): void {
    this.selectedTenantId.set(tenantId);
  }

  private upsertTenant(tenant: Tenant): void {
    this.tenants.update((list) => {
      const i = list.findIndex((t) => String(t.id) === String(tenant.id));
      if (i === -1) {
        return [...list, tenant];
      }
      const next = [...list];
      next[i] = tenant;
      return next;
    });
  }

  private removeTenantLocal(id: string): void {
    this.tenants.update((list) =>
      list.filter((t) => String(t.id) !== String(id)),
    );
    this.selectedTenantId.update((cur) =>
      cur != null && String(cur) === String(id) ? null : cur,
    );
  }

  /** Load directory list with department shells (no invites / employees / assignments). */
  refreshTenantList(): void {
    this.listLoading.set(true);
    this.tenantsApi
      .list()
      .pipe(
        switchMap((rows) =>
          rows.length === 0
            ? of([] as Tenant[])
            : forkJoin(
                rows.map((raw) => {
                  const dto = normalizeTenantResponseDto(raw);
                  return this.departmentsApi.list(dto.id).pipe(
                    catchError(() => of([] as DepartmentResponseDto[])),
                    map((depts) =>
                      buildTenantFromParts(
                        dto,
                        depts.map(mapDepartmentShell),
                        [],
                        [],
                      ),
                    ),
                  );
                }),
              ),
        ),
        finalize(() => this.listLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load tenants',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as Tenant[]);
        }),
      )
      .subscribe((list) => this.tenants.set(list));
  }

  /** Full workspace for one tenant (departments, people, invites, assignments). */
  hydrateTenant$(tenantId: string): Observable<void> {
    this.detailLoading.set(true);
    return forkJoin({
      tenant: this.tenantsApi.getById(tenantId),
      departments: this.departmentsApi.list(tenantId).pipe(
        catchError(() => of([] as DepartmentResponseDto[])),
      ),
      assignments: this.assignmentsApi.listByTenant(tenantId).pipe(
        catchError(() => of([])),
      ),
    }).pipe(
      switchMap(({ tenant, departments, assignments }) => {
        const tenantDto = normalizeTenantResponseDto(tenant);
        const apiTenantId = tenantDto.id;
        const shells = departments.map(mapDepartmentShell);
        if (shells.length === 0) {
          return of(
            buildTenantFromParts(
              tenantDto,
              [],
              [],
              groupAssignmentsToDistributions(assignments),
            ),
          );
        }
        return forkJoin({
          inviteChunks: forkJoin(
            shells.map((d) =>
              this.inviteCodesApi.list(apiTenantId, d.id).pipe(
                catchError(() => of([] as InviteCodeListItemResponseDto[])),
                map((invites) => ({
                  departmentId: d.id,
                  invites: invites.map((i) => mapInviteDto(i, apiTenantId)),
                })),
              ),
            ),
          ),
        }).pipe(
          map(({ inviteChunks }) => {
            const inviteLinks: InviteLink[] = inviteChunks.flatMap(
              (c) => c.invites,
            );
            return buildTenantFromParts(
              tenantDto,
              shells,
              inviteLinks,
              groupAssignmentsToDistributions(assignments),
            );
          }),
        );
      }),
      tap((built) => this.upsertTenant(built)),
      map(() => void 0),
      finalize(() => this.detailLoading.set(false)),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not load tenant',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        return EMPTY;
      }),
    );
  }

  createTenant$(payload: {
    name: string;
    description?: string;
  }): Observable<string> {
    return this.tenantsApi
      .create({
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
      })
      .pipe(
        tap((raw) => {
          const dto = normalizeTenantResponseDto(raw);
          this.upsertTenant(
            buildTenantFromParts(dto, [], [], []),
          );
          this.messages.add({
            severity: 'success',
            summary: 'Tenant created',
            detail: dto.name,
          });
        }),
        map((raw) => normalizeTenantResponseDto(raw).id),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Create failed',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      );
  }

  updateTenant$(tenantId: string, patch: { name: string; description?: string }): Observable<void> {
    return this.tenantsApi
      .update(tenantId, {
        name: patch.name.trim(),
        description: patch.description?.trim() || undefined,
      })
      .pipe(
        tap((raw) => {
          const dto = normalizeTenantResponseDto(raw);
          const cur = this.tenants().find((t) => String(t.id) === String(tenantId));
          this.upsertTenant(
            buildTenantFromParts(
              dto,
              cur?.departments ?? [],
              cur?.inviteLinks ?? [],
              cur?.testDistributions ?? [],
            ),
          );
          this.messages.add({
            severity: 'success',
            summary: 'Tenant updated',
            detail: dto.name,
          });
        }),
        map(() => void 0),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      );
  }

  deleteTenant$(tenantId: string): Observable<void> {
    return this.tenantsApi.delete(tenantId).pipe(
      tap(() => {
        this.removeTenantLocal(tenantId);
        this.messages.add({
          severity: 'success',
          summary: 'Tenant deleted',
        });
      }),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  addDepartment$(tenantId: string, name: string): Observable<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return of(void 0);
    }
    return this.departmentsApi
      .create({ tenantId, name: trimmed })
      .pipe(
        switchMap(() => this.hydrateTenant$(tenantId)),
        tap(() =>
          this.messages.add({
            severity: 'success',
            summary: 'Department created',
            detail: trimmed,
          }),
        ),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not create department',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      );
  }

  updateDepartment$(tenantId: string, departmentId: string, name: string): Observable<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      return of(void 0);
    }
    return this.departmentsApi.update(departmentId, { name: trimmed }).pipe(
      switchMap(() => this.hydrateTenant$(tenantId)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Department updated',
          detail: trimmed,
        }),
      ),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not update department',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  deleteDepartment$(tenantId: string, departmentId: string): Observable<void> {
    return this.departmentsApi.delete(departmentId).pipe(
      switchMap(() => this.hydrateTenant$(tenantId)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Department deleted',
        }),
      ),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not delete department',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  provisionEmployeeSilent$(
    tenantId: string,
    departmentId: string,
    fullName: string,
    email: string,
  ): Observable<void> {
    return this.employeesApi
      .create({
        tenantId,
        departmentId,
        fullName: fullName.trim(),
        email: email.trim(),
      })
      .pipe(
        switchMap(() => this.hydrateTenant$(tenantId)),
        tap(() => {
          this.messages.add({
            severity: 'success',
            summary: 'Person added',
            detail: email.trim(),
          });
          this.tenantPeopleDirectoryRevision.update((n) => n + 1);
        }),
        map(() => void 0),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not add person',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      );
  }

  createInviteLink$(
    tenantId: string,
    departmentId: string,
    maxUses: number,
    validForHours: number,
  ): Observable<void> {
    const expiresAt = new Date(
      Date.now() + validForHours * 3_600_000,
    ).toISOString();
    return this.inviteCodesApi
      .create({
        tenantId,
        departmentId,
        maxUses,
        expiresAt,
      })
      .pipe(
        switchMap(() => this.hydrateTenant$(tenantId)),
        tap(() =>
          this.messages.add({
            severity: 'success',
            summary: 'Invite link created',
          }),
        ),
        map(() => void 0),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not create invite',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      );
  }

  revokeInviteLink$(tenantId: string, inviteId: string): Observable<void> {
    return this.inviteCodesApi.revoke(inviteId).pipe(
      switchMap(() => this.hydrateTenant$(tenantId)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Invite revoked',
        }),
      ),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not revoke invite',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  distributeTest$(
    tenantId: string,
    testId: string,
    departmentIds: string[],
  ): Observable<void> {
    const unique = [...new Set(departmentIds)];
    if (unique.length === 0) {
      return of(void 0);
    }
    return forkJoin(
      unique.map((departmentId) =>
        this.assignmentsApi.create({
          tenantId,
          departmentId,
          testId,
        }),
      ),
    ).pipe(
      switchMap(() => this.hydrateTenant$(tenantId)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Test assigned',
          detail: `${unique.length} department(s)`,
        }),
      ),
      map(() => void 0),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Assignment failed',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  removeTestDistribution$(tenantId: string, row: {
    assignmentIds: string[];
  }): Observable<void> {
    const ids = row.assignmentIds ?? [];
    if (ids.length === 0) {
      return of(void 0);
    }
    return forkJoin(ids.map((id) => this.assignmentsApi.delete(id))).pipe(
      switchMap(() => this.hydrateTenant$(tenantId)),
      tap(() =>
        this.messages.add({
          severity: 'success',
          summary: 'Assignment removed',
        }),
      ),
      map(() => void 0),
      catchError((err) => {
        this.messages.add({
          severity: 'error',
          summary: 'Could not remove assignment',
          detail: apiErrorMessage(err, 'Request failed'),
        });
        throw err;
      }),
    );
  }

  inviteLinkIsExpired(link: InviteLink): boolean {
    return Date.parse(link.expiresAt) <= Date.now();
  }

  inviteLinkIsExhausted(link: InviteLink): boolean {
    return link.usedCount >= link.maxUses;
  }

  inviteLinkIsActive(link: InviteLink): boolean {
    return (
      !link.isRevoked &&
      !this.inviteLinkIsExpired(link) &&
      !this.inviteLinkIsExhausted(link)
    );
  }
}
