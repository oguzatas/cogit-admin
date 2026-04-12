export interface DepartmentResponseDto {
  id: string;
  tenantId: string;
  name: string;
  /** Active (non-deleted) employees; from list and get-by-id responses. */
  employeeCount: number;
  /** ISO-8601 instant when present on the API. */
  created?: string;
}

export interface DepartmentCreateRequestDto {
  tenantId: string;
  name: string;
}

export interface DepartmentUpdateRequestDto {
  name: string;
}
