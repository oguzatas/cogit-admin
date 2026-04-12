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
}
