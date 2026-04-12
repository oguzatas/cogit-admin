export interface DepartmentResponseDto {
  id: string;
  tenantId: string;
  name: string;
}

export interface DepartmentCreateRequestDto {
  tenantId: string;
  name: string;
}

export interface DepartmentUpdateRequestDto {
  name: string;
}
