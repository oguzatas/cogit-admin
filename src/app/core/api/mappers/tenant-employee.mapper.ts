import type {
  EmployeeAssignmentDto,
  PagedTenantEmployeesResponseDto,
  TenantEmployeeListItemDto,
} from '@/app/core/api/models/tenant-employee.dto';

function str(v: unknown): string {
  if (v == null) {
    return '';
  }
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return Boolean(v);
}

/** Normalizes one list item (camelCase / PascalCase, numeric ids). */
export function normalizeTenantEmployeeListItem(
  raw: unknown,
): TenantEmployeeListItemDto {
  const r = raw as Record<string, unknown>;
  return {
    id: str(r['id'] ?? r['Id']),
    tenantId: str(r['tenantId'] ?? r['TenantId']),
    departmentId: str(r['departmentId'] ?? r['DepartmentId']),
    departmentName: str(r['departmentName'] ?? r['DepartmentName']),
    fullName: str(r['fullName'] ?? r['FullName']),
    email: str(r['email'] ?? r['Email']),
    created: str(r['created'] ?? r['Created']),
  };
}

/** Normalizes paginated GET response. */
/** GET `/api/TenantEmployees/{id}/assignments` item (OpenAPI: `TenantEmployeeAssignmentDto`). */
export function normalizeEmployeeAssignmentDto(raw: unknown): EmployeeAssignmentDto {
  const r = raw as Record<string, unknown>;
  const created = str(r['created'] ?? r['Created']);
  return {
    id: str(r['id'] ?? r['Id']),
    testId: str(r['testId'] ?? r['TestId']),
    testName: str(r['testName'] ?? r['TestName']),
    status: str(r['status'] ?? r['Status']),
    accessKey: str(r['accessKey'] ?? r['AccessKey']),
    assignedAt: created || null,
    completedAt:
      str(r['completedAt'] ?? r['CompletedAt'] ?? r['lastModified'] ?? r['LastModified'] ?? '') ||
      null,
  };
}

export function normalizePagedTenantEmployeesResponse(
  raw: unknown,
): PagedTenantEmployeesResponseDto {
  const r = raw as Record<string, unknown>;
  const itemsRaw = r['items'] ?? r['Items'];
  const items: unknown[] = Array.isArray(itemsRaw) ? itemsRaw : [];
  return {
    items: items.map(normalizeTenantEmployeeListItem),
    totalRecords: num(r['totalRecords'] ?? r['TotalRecords']),
    pageNumber: num(r['pageNumber'] ?? r['PageNumber'], 1),
    pageSize: num(r['pageSize'] ?? r['PageSize'], 10),
    totalPages: num(r['totalPages'] ?? r['TotalPages']),
    hasNextPage: bool(r['hasNextPage'] ?? r['HasNextPage']),
    hasPreviousPage: bool(r['hasPreviousPage'] ?? r['HasPreviousPage']),
  };
}
