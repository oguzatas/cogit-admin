import { Injectable, inject, signal } from '@angular/core';
import { decodeAccessTokenPayload } from '@/app/core/auth/access-token';
import { TokenStorageService } from '@/app/core/api/services/token-storage.service';

const ROLE_KEYS = [
  'role',
  'Role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

const TENANT_KEYS = [
  'tenantId',
  'TenantId',
  'tenant_id',
  'tid',
  'http://schemas.microsoft.com/identity/claims/tenantid',
] as const;

function readRoles(payload: Record<string, unknown>): string[] {
  for (const k of ROLE_KEYS) {
    const v = payload[k];
    if (Array.isArray(v)) {
      return v.map((x) => String(x));
    }
    if (typeof v === 'string' && v.trim()) {
      return [v.trim()];
    }
  }
  return [];
}

function readTenantId(payload: Record<string, unknown>): string | null {
  for (const k of TENANT_KEYS) {
    const v = payload[k];
    if (v != null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return null;
}

/** JWT role / tenant hints for dashboard scoping (API is source of truth). */
@Injectable({ providedIn: 'root' })
export class AuthClaimsService {
  private readonly tokens = inject(TokenStorageService);

  readonly roles = signal<string[]>([]);
  readonly isSuperAdmin = signal(false);
  readonly tenantId = signal<string | null>(null);

  syncFromAccessToken(): void {
    const payload = decodeAccessTokenPayload(this.tokens.getAccessToken());
    if (!payload) {
      this.clear();
      return;
    }
    const roles = readRoles(payload);
    this.roles.set(roles);
    const superAdmin = roles.some((r) => r.toLowerCase().replace(/\s+/g, '') === 'superadmin');
    this.isSuperAdmin.set(superAdmin);
    this.tenantId.set(readTenantId(payload));
  }

  clear(): void {
    this.roles.set([]);
    this.isSuperAdmin.set(false);
    this.tenantId.set(null);
  }
}
