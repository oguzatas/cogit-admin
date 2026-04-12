/** Super-admin managed organisation. */
export interface Tenant {
  id: string;
  name: string;
  description: string;
  departments: Department[];
  inviteLinks: InviteLink[];
  testDistributions: TenantTestDistribution[];
}

export interface Department {
  id: string;
  name: string;
  employees: TenantEmployee[];
  /** Active (non-deleted) people; mirrors API `employeeCount`. */
  employeeCount: number;
}

export type ProvisionSource = 'silent' | 'invite';

/** Person (client) working under a tenant department. */
export interface TenantEmployee {
  id: string;
  name: string;
  email: string;
  /** Silent flow: always true on create. Invite flow: true when invite is redeemed (UI-only for now). */
  isActive: boolean;
  provisionSource: ProvisionSource;
  invitedViaLinkId: string | null;
  createdAt: string;
}

/** Self-service invite link scoped to a tenant + default department. */
export interface InviteLink {
  id: string;
  tenantId: string;
  /** Department new members are placed into when they use the link. */
  departmentId: string;
  /** Opaque token shown in admin UI (no backend yet). */
  token: string;
  maxUses: number;
  usedCount: number;
  /** ISO-8601 instant after which the link cannot be used. */
  expiresAt: string;
  createdAt: string;
  isRevoked: boolean;
}

/** Assigns an assessment to one or more departments (grouped from API rows). */
export interface TenantTestDistribution {
  /** Stable UI key — same as {@link testId} when grouped from API. */
  id: string;
  testId: string;
  testTitle: string;
  assignedDepartmentIds: string[];
  /** Backend assignment ids for DELETE when removing this row. */
  assignmentIds: string[];
  createdAt: string;
}
