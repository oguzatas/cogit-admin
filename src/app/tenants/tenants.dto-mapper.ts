import type { AssignmentListItemResponseDto } from '@/app/core/api/models/assignment.dto';
import type { DepartmentResponseDto } from '@/app/core/api/models/department.dto';
import type { InviteCodeListItemResponseDto } from '@/app/core/api/models/invite-code.dto';
import type { TenantEmployeeResponseDto } from '@/app/core/api/models/tenant-employee.dto';
import type { TenantResponseDto } from '@/app/core/api/models/tenant.dto';
import type {
  Department,
  InviteLink,
  Tenant,
  TenantEmployee,
  TenantTestDistribution,
} from './tenants.models';

export function mapDepartmentShell(d: DepartmentResponseDto): Department {
  return {
    id: d.id,
    name: d.name,
    employees: [],
  };
}

export function mapEmployeeDto(e: TenantEmployeeResponseDto): TenantEmployee {
  const source = e.provisionSource ?? 'silent';
  return {
    id: e.id,
    name: e.fullName,
    email: e.email,
    isActive: e.isActive ?? true,
    provisionSource: source === 'invite' ? 'invite' : 'silent',
    invitedViaLinkId: e.invitedViaInviteCodeId ?? null,
    createdAt: e.createdAt ?? '',
  };
}

export function mapInviteDto(
  i: InviteCodeListItemResponseDto,
  tenantId: string,
): InviteLink {
  return {
    id: i.id,
    tenantId,
    departmentId: i.departmentId,
    token: i.code,
    maxUses: i.maxUses ?? 0,
    usedCount: i.usedCount ?? 0,
    expiresAt: i.expiresAt ?? new Date().toISOString(),
    createdAt: '',
    isRevoked: i.isRevoked ?? false,
  };
}

export function buildTenantFromParts(
  dto: TenantResponseDto,
  departments: Department[],
  inviteLinks: InviteLink[],
  testDistributions: TenantTestDistribution[],
): Tenant {
  return {
    id: dto.id,
    name: dto.name,
    description: (dto.description ?? '').trim(),
    departments,
    inviteLinks,
    testDistributions,
  };
}

export function groupAssignmentsToDistributions(
  items: AssignmentListItemResponseDto[],
): TenantTestDistribution[] {
  const byTest = new Map<string, AssignmentListItemResponseDto[]>();
  for (const a of items) {
    const list = byTest.get(a.testId) ?? [];
    list.push(a);
    byTest.set(a.testId, list);
  }
  const rows: TenantTestDistribution[] = [];
  for (const [, group] of byTest) {
    if (group.length === 0) {
      continue;
    }
    const first = group[0]!;
    const title =
      first.testTitle?.trim() ||
      (first.testId ? `Assessment ${first.testId}` : 'Assessment');
    const deptIds = [...new Set(group.map((g) => g.departmentId))];
    const assignmentIds = group.map((g) => g.id);
    const dates = group
      .map((g) => g.createdAt)
      .filter((x): x is string => !!x)
      .sort();
    rows.push({
      id: first.testId,
      testId: first.testId,
      testTitle: title,
      assignedDepartmentIds: deptIds,
      assignmentIds,
      createdAt: dates[0] ?? new Date().toISOString(),
    });
  }
  return rows.sort((a, b) => a.testTitle.localeCompare(b.testTitle));
}
