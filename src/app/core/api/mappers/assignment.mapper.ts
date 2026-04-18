import type {
  AssignmentResultListItemDto,
  PagedAssignmentsResponseDto,
} from '@/app/core/api/models/assignment.dto';

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

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw != null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const inner =
      obj['$values'] ?? obj['items'] ?? obj['Items'] ?? obj['value'] ?? obj['Value'];
    if (Array.isArray(inner)) {
      return inner;
    }
  }
  return [];
}

/** Maps one assignment row from GET `/api/Assignments` to dashboard columns. */
export function normalizeAssignmentResultListItem(
  raw: unknown,
): AssignmentResultListItemDto {
  const r = raw as Record<string, unknown>;
  return {
    id: str(
      r['id'] ??
        r['Id'] ??
        r['assignmentId'] ??
        r['AssignmentId'],
    ),
    employeeName: str(
      r['employeeName'] ?? r['EmployeeName'] ?? r['employeeFullName'] ?? r['EmployeeFullName'],
    ),
    testName: str(r['testName'] ?? r['TestName'] ?? r['testTitle'] ?? r['TestTitle']),
    date: (r['date'] ??
      r['Date'] ??
      r['completedAt'] ??
      r['CompletedAt'] ??
      r['submittedAt'] ??
      r['SubmittedAt'] ??
      r['createdAt'] ??
      r['CreatedAt'] ??
      null) as string | null,
    status: str(r['status'] ?? r['Status'] ?? ''),
  };
}

/** Normalizes paginated GET `/api/Assignments` (or a bare array). */
export function normalizePagedAssignmentsResponse(
  raw: unknown,
): PagedAssignmentsResponseDto {
  if (Array.isArray(raw)) {
    const items = raw.map(normalizeAssignmentResultListItem);
    return {
      items,
      totalRecords: items.length,
      pageNumber: 1,
      pageSize: items.length || 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
  const r = raw as Record<string, unknown>;
  const itemsRaw =
    r['items'] ?? r['Items'] ?? unwrapArray(r);
  const itemsArr = Array.isArray(itemsRaw) ? itemsRaw : [];
  return {
    items: itemsArr.map(normalizeAssignmentResultListItem),
    totalRecords: num(r['totalRecords'] ?? r['TotalRecords']),
    pageNumber: num(r['pageNumber'] ?? r['PageNumber'], 1),
    pageSize: num(r['pageSize'] ?? r['PageSize'], 10),
    totalPages: num(r['totalPages'] ?? r['TotalPages']),
    hasNextPage: bool(r['hasNextPage'] ?? r['HasNextPage']),
    hasPreviousPage: bool(r['hasPreviousPage'] ?? r['HasPreviousPage']),
  };
}
