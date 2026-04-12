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
