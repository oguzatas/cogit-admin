import type {
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
