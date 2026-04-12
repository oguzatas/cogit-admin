/** GET /api/InviteCodes?tenantId=&departmentId= */
export interface InviteCodeListItemResponseDto {
  id: string;
  tenantId: string;
  departmentId: string;
  code: string;
  maxUses?: number | null;
  expiresAt?: string | null;
  usedCount?: number;
  isRevoked?: boolean;
}

/** POST /api/InviteCodes */
export interface InviteCodeCreateRequestDto {
  tenantId: string;
  departmentId: string;
  maxUses?: number;
  expiresAt?: string;
}

/** POST /api/InviteCodes/redeem — Public */
export interface InviteCodeRedeemRequestDto {
  code: string;
  fullName: string;
  email: string;
}

/** Response after redeem (align with backend employee payload). */
export interface InviteCodeRedeemResponseDto {
  tenantEmployeeId: string;
  email: string;
  fullName?: string;
}
