/** POST /api/TenantEmployees — Flow A (SuperAdmin). */
export interface TenantEmployeeCreateRequestDto {
  tenantId: string;
  departmentId: string;
  fullName: string;
  email: string;
}

/** Response contract for created employee (extend when backend schema is known). */
export interface TenantEmployeeResponseDto {
  id: string;
  tenantId: string;
  departmentId: string;
  fullName: string;
  email: string;
  provisionSource?: 'silent' | 'invite';
  isActive?: boolean;
  invitedViaInviteCodeId?: string | null;
  createdAt?: string | null;
}

/** Single row from GET `/api/TenantEmployees` (paginated list). */
export interface TenantEmployeeListItemDto {
  id: string;
  tenantId: string;
  departmentId: string;
  departmentName: string;
  fullName: string;
  email: string;
  /** ISO-8601 instant from API (`created`). */
  created: string;
}

/** Paged envelope for GET `/api/TenantEmployees`. */
export interface PagedTenantEmployeesResponseDto {
  items: TenantEmployeeListItemDto[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Client-side query for {@link TenantEmployeeService.listPaged} (mapped to `PageNumber` / `PageSize` / `departmentId` on the wire). */
export interface TenantEmployeesListQueryDto {
  pageNumber: number;
  pageSize: number;
  /** When set, sent as query `departmentId`. */
  departmentId?: string;
}
