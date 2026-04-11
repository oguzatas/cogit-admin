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

/** Assigns an assessment (by title placeholder) to one or more departments. */
export interface TenantTestDistribution {
  id: string;
  testTitle: string;
  assignedDepartmentIds: string[];
  createdAt: string;
}
