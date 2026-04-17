import { computed, Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';
import { AssignmentService } from '@/app/core/api/services/assignment.service';
import { DepartmentService } from '@/app/core/api/services/department.service';
import { TenantService } from '@/app/core/api/services/tenant.service';
import { TenantEmployeeService } from '@/app/core/api/services/tenant-employee.service';
import { TestService } from '@/app/core/api/services/test.service';
import { apiErrorMessage } from '@/app/core/api/utils/api-error-message';
import type { AssignmentCreateRequestDto } from '@/app/core/api/models/assignment.dto';
import type { DepartmentResponseDto } from '@/app/core/api/models/department.dto';
import type { TenantResponseDto } from '@/app/core/api/models/tenant.dto';
import type { TestListItemResponseDto } from '@/app/core/api/models/test.dto';
import type {
  EmployeeAssignmentDto,
  TenantEmployeeListItemDto,
} from '@/app/core/api/models/tenant-employee.dto';

export type AssignmentStatusSeverity =
  | 'success'
  | 'info'
  | 'secondary'
  | 'warn'
  | 'danger'
  | 'contrast'
  | null;

@Injectable({ providedIn: 'root' })
export class AssignmentsStore {
  private readonly assignmentSvc = inject(AssignmentService);
  private readonly departmentSvc = inject(DepartmentService);
  private readonly tenantSvc = inject(TenantService);
  private readonly employeeSvc = inject(TenantEmployeeService);
  private readonly testSvc = inject(TestService);
  private readonly messages = inject(MessageService);

  // ── Shared dropdown options ───────────────────────────────────────────────
  readonly tenants = signal<TenantResponseDto[]>([]);
  readonly tests = signal<TestListItemResponseDto[]>([]);
  readonly tenantsLoading = signal(false);
  readonly testsLoading = signal(false);

  // ── "Assign Test" form state ──────────────────────────────────────────────
  readonly assignTenantId = signal<string | null>(null);
  readonly assignDepartments = signal<DepartmentResponseDto[]>([]);
  readonly assignDepartmentsLoading = signal(false);
  readonly assignDepartmentId = signal<string | null>(null);
  readonly assignTestId = signal<string | null>(null);
  readonly assigning = signal(false);

  readonly canAssign = computed(
    () => !!this.assignDepartmentId() && !!this.assignTestId(),
  );

  // ── Employee table filter state ───────────────────────────────────────────
  readonly filterTenantId = signal<string | null>(null);
  readonly filterDepartments = signal<DepartmentResponseDto[]>([]);
  readonly filterDepartmentId = signal<string | null>(null);

  // ── Employee table data ───────────────────────────────────────────────────
  readonly employees = signal<TenantEmployeeListItemDto[]>([]);
  readonly employeesLoading = signal(false);
  readonly employeesTotalRecords = signal(0);
  readonly employeePage = signal(1);
  readonly employeePageSize = signal(20);

  // ── Assignment dialog state ───────────────────────────────────────────────
  readonly dialogEmployee = signal<TenantEmployeeListItemDto | null>(null);
  readonly dialogAssignments = signal<EmployeeAssignmentDto[]>([]);
  readonly dialogLoading = signal(false);
  readonly dialogVisible = signal(false);

  // ── Init loaders ─────────────────────────────────────────────────────────

  loadTenants(): void {
    this.tenantsLoading.set(true);
    this.tenantSvc
      .list()
      .pipe(
        finalize(() => this.tenantsLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load tenants',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as TenantResponseDto[]);
        }),
      )
      .subscribe((rows) => this.tenants.set(rows));
  }

  loadTests(): void {
    this.testsLoading.set(true);
    this.testSvc
      .list()
      .pipe(
        finalize(() => this.testsLoading.set(false)),
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

  // ── "Assign" form logic ───────────────────────────────────────────────────

  selectAssignTenant(tenantId: string | null): void {
    this.assignTenantId.set(tenantId);
    this.assignDepartmentId.set(null);
    this.assignDepartments.set([]);
    if (!tenantId) {
      return;
    }
    this.assignDepartmentsLoading.set(true);
    this.departmentSvc
      .list(tenantId)
      .pipe(
        finalize(() => this.assignDepartmentsLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load departments',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as DepartmentResponseDto[]);
        }),
      )
      .subscribe((rows) => this.assignDepartments.set(rows));
  }

  assign(): void {
    const departmentId = this.assignDepartmentId();
    const testId = this.assignTestId();
    if (!departmentId || !testId) {
      return;
    }
    const payload: AssignmentCreateRequestDto = { departmentId, testId };
    const tenantId = this.assignTenantId();
    if (tenantId) {
      payload.tenantId = tenantId;
    }
    this.assigning.set(true);
    this.assignmentSvc
      .create(payload)
      .pipe(
        finalize(() => this.assigning.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Assignment failed',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          throw err;
        }),
      )
      .subscribe((res) => {
        this.messages.add({
          severity: 'success',
          summary: 'Test assigned!',
          detail: `${res.created} employee(s) newly assigned · ${res.skipped} already had this test.`,
        });
        this.assignDepartmentId.set(null);
        this.assignTestId.set(null);
        // Refresh the employee table if we're looking at the same tenant.
        if (tenantId && this.filterTenantId() === tenantId) {
          this.loadEmployees(1);
        }
      });
  }

  // ── Employee filter logic ─────────────────────────────────────────────────

  selectFilterTenant(tenantId: string | null): void {
    this.filterTenantId.set(tenantId);
    this.filterDepartmentId.set(null);
    this.filterDepartments.set([]);
    this.employees.set([]);
    this.employeesTotalRecords.set(0);
    if (!tenantId) {
      return;
    }
    this.departmentSvc
      .list(tenantId)
      .pipe(catchError(() => of([] as DepartmentResponseDto[])))
      .subscribe((rows) => this.filterDepartments.set(rows));
    this.loadEmployees(1);
  }

  selectFilterDepartment(departmentId: string | null): void {
    this.filterDepartmentId.set(departmentId);
    if (this.filterTenantId()) {
      this.loadEmployees(1);
    }
  }

  loadEmployees(page: number): void {
    const tenantId = this.filterTenantId();
    if (!tenantId) {
      return;
    }
    this.employeePage.set(page);
    this.employeesLoading.set(true);
    this.employeeSvc
      .listPaged(tenantId, {
        pageNumber: page,
        pageSize: this.employeePageSize(),
        departmentId: this.filterDepartmentId() ?? undefined,
      })
      .pipe(
        finalize(() => this.employeesLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load employees',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of({
            items: [] as TenantEmployeeListItemDto[],
            totalRecords: 0,
            pageNumber: page,
            pageSize: this.employeePageSize(),
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }),
      )
      .subscribe((res) => {
        this.employees.set(res.items);
        this.employeesTotalRecords.set(res.totalRecords);
      });
  }

  // ── Assignment dialog ─────────────────────────────────────────────────────

  openAssignmentDialog(employee: TenantEmployeeListItemDto): void {
    this.dialogEmployee.set(employee);
    this.dialogAssignments.set([]);
    this.dialogVisible.set(true);
    this.dialogLoading.set(true);
    this.employeeSvc
      .getAssignments(employee.id)
      .pipe(
        finalize(() => this.dialogLoading.set(false)),
        catchError((err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Could not load assignments',
            detail: apiErrorMessage(err, 'Request failed'),
          });
          return of([] as EmployeeAssignmentDto[]);
        }),
      )
      .subscribe((rows) => this.dialogAssignments.set(rows));
  }

  closeAssignmentDialog(): void {
    this.dialogVisible.set(false);
    this.dialogEmployee.set(null);
    this.dialogAssignments.set([]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  magicLink(accessKey: string): string {
    return `${window.location.origin}/assessment/invite/${accessKey}`;
  }

  statusSeverity(status: string): AssignmentStatusSeverity {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
        return 'success';
      case 'inprogress':
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  statusLabel(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'inprogress':
      case 'in_progress':
        return 'In progress';
      case 'pending':
        return 'Pending';
      default:
        return status ?? '—';
    }
  }
}
