/** POST /api/Assignments */
export interface AssignmentCreateRequestDto {
  departmentId: string;
  testId: string;
  /** Required for SuperAdmin; omitted for TenantStaff (tenant from JWT). */
  tenantId?: string;
}

export interface AssignmentCreateResponseDto {
  created: number;
  skipped: number;
}

/** GET /api/Assignments?tenantId= */
export interface AssignmentListItemResponseDto {
  id: string;
  tenantId: string;
  departmentId: string;
  testId: string;
  testTitle?: string | null;
  createdAt?: string | null;
}

/**
 * Rows for the Test Results dashboard (from GET `/api/Assignments` list items).
 */
export interface AssignmentResultListItemDto {
  id: string;
  employeeName: string;
  testName: string;
  /** ISO-8601 instant */
  date?: string | null;
  /** Completed, AwaitingManualGrading, etc. */
  status: string;
}

/** GET `/api/Assignments` with pagination (PageNumber / PageSize). */
export interface PagedAssignmentsResponseDto {
  items: AssignmentResultListItemDto[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Query for paginated assignments list. */
export interface AssignmentsPagedQueryDto {
  pageNumber: number;
  pageSize: number;
  tenantId?: string;
}
