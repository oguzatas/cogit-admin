import { computed, Injectable, signal } from '@angular/core';
import {
  Department,
  InviteLink,
  Tenant,
  TenantEmployee,
  TenantTestDistribution,
} from './tenants.models';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function randomInviteToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 10; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return s;
}

function mapTenant(
  tenants: Tenant[],
  tenantId: string,
  mapFn: (t: Tenant) => Tenant,
): Tenant[] {
  return tenants.map((t) => (t.id === tenantId ? mapFn(t) : t));
}

@Injectable({ providedIn: 'root' })
export class TenantsStore {
  readonly tenants = signal<Tenant[]>([]);
  readonly selectedTenantId = signal<string | null>(null);

  readonly selectedTenant = computed(() => {
    const id = this.selectedTenantId();
    if (!id) {
      return null;
    }
    return this.tenants().find((t) => t.id === id) ?? null;
  });

  readonly tenantCount = computed(() => this.tenants().length);

  selectTenant(tenantId: string | null): void {
    this.selectedTenantId.set(tenantId);
  }

  createTenant(payload: { name: string; description?: string }): string {
    const id = createId();
    const tenant: Tenant = {
      id,
      name: payload.name.trim(),
      description: (payload.description ?? '').trim(),
      departments: [],
      inviteLinks: [],
      testDistributions: [],
    };
    this.tenants.update((list) => [...list, tenant]);
    return id;
  }

  updateTenant(
    tenantId: string,
    patch: { name?: string; description?: string },
  ): void {
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        name: patch.name !== undefined ? patch.name.trim() : t.name,
        description:
          patch.description !== undefined
            ? patch.description.trim()
            : t.description,
      })),
    );
  }

  deleteTenant(tenantId: string): void {
    this.tenants.update((list) => list.filter((t) => t.id !== tenantId));
    this.selectedTenantId.update((cur) => (cur === tenantId ? null : cur));
  }

  addDepartment(tenantId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const dept: Department = {
      id: createId(),
      name: trimmed,
      employees: [],
    };
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        departments: [...t.departments, dept],
      })),
    );
  }

  updateDepartment(
    tenantId: string,
    departmentId: string,
    name: string,
  ): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        departments: t.departments.map((d) =>
          d.id === departmentId ? { ...d, name: trimmed } : d,
        ),
      })),
    );
  }

  deleteDepartment(tenantId: string, departmentId: string): void {
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        departments: t.departments.filter((d) => d.id !== departmentId),
        inviteLinks: t.inviteLinks.filter(
          (inv) => inv.departmentId !== departmentId,
        ),
        testDistributions: t.testDistributions.map((dist) => ({
          ...dist,
          assignedDepartmentIds: dist.assignedDepartmentIds.filter(
            (id) => id !== departmentId,
          ),
        })),
      })),
    );
  }

  /**
   * Flow A — silent provisioning: create an active employee with no email workflow.
   */
  provisionEmployeeSilent(
    tenantId: string,
    departmentId: string,
    name: string,
    email: string,
  ): void {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e) {
      return;
    }
    const employee: TenantEmployee = {
      id: createId(),
      name: n,
      email: e,
      isActive: true,
      provisionSource: 'silent',
      invitedViaLinkId: null,
      createdAt: isoNow(),
    };
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        departments: t.departments.map((d) =>
          d.id === departmentId
            ? { ...d, employees: [...d.employees, employee] }
            : d,
        ),
      })),
    );
  }

  /**
   * Flow B — create a capped, time-limited invite link (UI state only).
   */
  createInviteLink(
    tenantId: string,
    departmentId: string,
    maxUses: number,
    validForHours: number,
  ): void {
    if (maxUses < 1 || validForHours <= 0) {
      return;
    }
    const tenant = this.tenants().find((x) => x.id === tenantId);
    if (!tenant?.departments.some((d) => d.id === departmentId)) {
      return;
    }
    const link: InviteLink = {
      id: createId(),
      tenantId,
      departmentId,
      token: randomInviteToken(),
      maxUses,
      usedCount: 0,
      expiresAt: new Date(
        Date.now() + validForHours * 3_600_000,
      ).toISOString(),
      createdAt: isoNow(),
      isRevoked: false,
    };
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        inviteLinks: [...t.inviteLinks, link],
      })),
    );
  }

  revokeInviteLink(tenantId: string, linkId: string): void {
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        inviteLinks: t.inviteLinks.map((l) =>
          l.id === linkId ? { ...l, isRevoked: true } : l,
        ),
      })),
    );
  }

  addTestDistribution(
    tenantId: string,
    payload: { testTitle: string; departmentIds: string[] },
  ): void {
    const title = payload.testTitle.trim();
    const ids = [...new Set(payload.departmentIds)];
    if (!title || ids.length === 0) {
      return;
    }
    const tenant = this.tenants().find((x) => x.id === tenantId);
    if (!tenant) {
      return;
    }
    const validIds = ids.filter((id) =>
      tenant.departments.some((d) => d.id === id),
    );
    if (validIds.length === 0) {
      return;
    }
    const row: TenantTestDistribution = {
      id: createId(),
      testTitle: title,
      assignedDepartmentIds: validIds,
      createdAt: isoNow(),
    };
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        testDistributions: [...t.testDistributions, row],
      })),
    );
  }

  removeTestDistribution(tenantId: string, distributionId: string): void {
    this.tenants.update((list) =>
      mapTenant(list, tenantId, (t) => ({
        ...t,
        testDistributions: t.testDistributions.filter(
          (d) => d.id !== distributionId,
        ),
      })),
    );
  }

  inviteLinkIsExpired(link: InviteLink): boolean {
    return Date.parse(link.expiresAt) <= Date.now();
  }

  inviteLinkIsExhausted(link: InviteLink): boolean {
    return link.usedCount >= link.maxUses;
  }

  inviteLinkIsActive(link: InviteLink): boolean {
    return (
      !link.isRevoked &&
      !this.inviteLinkIsExpired(link) &&
      !this.inviteLinkIsExhausted(link)
    );
  }
}
