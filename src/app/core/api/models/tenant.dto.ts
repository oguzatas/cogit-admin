export interface TenantResponseDto {
  id: string;
  name: string;
  description?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface TenantCreateRequestDto {
  name: string;
  description?: string;
}

export interface TenantUpdateRequestDto {
  name: string;
  description?: string;
}
