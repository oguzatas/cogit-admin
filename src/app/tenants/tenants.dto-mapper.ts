import type { AssignmentListItemResponseDto } from '@/app/core/api/models/assignment.dto';
import type { DepartmentResponseDto } from '@/app/core/api/models/department.dto';
import type { InviteCodeListItemResponseDto } from '@/app/core/api/models/invite-code.dto';
import type { TenantResponseDto } from '@/app/core/api/models/tenant.dto';
import type {
  Department,
  InviteLink,
  Tenant,
  TenantTestDistribution,
} from './tenants.models';

function str(v: unknown): string {
  if (v == null) {
    return '';
  }
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Supports camelCase or PascalCase and numeric ids from JSON. */
export function normalizeTenantResponseDto(raw: TenantResponseDto): TenantResponseDto {
  const r = raw as unknown as Record<string, unknown>;
  return {
    id: str(r['id'] ?? r['Id']),
    name: str(r['name'] ?? r['Name']),
    description: (r['description'] ?? r['Description'] ?? null) as
      | string
      | null
      | undefined,
    isDeleted: (r['isDeleted'] ?? r['IsDeleted']) as boolean | undefined,
    deletedAt: (r['deletedAt'] ?? r['DeletedAt'] ?? null) as string | null | undefined,
  };
}

export function normalizeDepartmentResponseDto(
  raw: DepartmentResponseDto,
): DepartmentResponseDto {
  const r = raw as unknown as Record<string, unknown>;
  const createdRaw = r['created'] ?? r['Created'];
  return {
    id: str(r['id'] ?? r['Id']),
    tenantId: str(r['tenantId'] ?? r['TenantId']),
    name: str(r['name'] ?? r['Name']),
    employeeCount: num(r['employeeCount'] ?? r['EmployeeCount'], 0),
    created:
      createdRaw == null || createdRaw === ''
        ? undefined
        : str(createdRaw),
  };
}

export function mapDepartmentShell(d: DepartmentResponseDto): Department {
  const n = normalizeDepartmentResponseDto(d);
  return {
    id: n.id,
    name: n.name,
    employees: [],
    employeeCount: n.employeeCount,
  };
}

export function mapInviteDto(
  i: InviteCodeListItemResponseDto,
  tenantId: string,
): InviteLink {
  const r = i as unknown as Record<string, unknown>;
  return {
    id: str(r['id'] ?? r['Id']),
    tenantId,
    departmentId: str(r['departmentId'] ?? r['DepartmentId']),
    token: str(r['code'] ?? r['Code']),
    maxUses: Number(r['maxUses'] ?? r['MaxUses'] ?? 0) || 0,
    usedCount: Number(r['usedCount'] ?? r['UsedCount'] ?? 0) || 0,
    expiresAt: str(r['expiresAt'] ?? r['ExpiresAt']) || new Date().toISOString(),
    createdAt: '',
    isRevoked: Boolean(r['isRevoked'] ?? r['IsRevoked'] ?? false),
  };
}

export function buildTenantFromParts(
  dto: TenantResponseDto,
  departments: Department[],
  inviteLinks: InviteLink[],
  testDistributions: TenantTestDistribution[],
): Tenant {
  const n = normalizeTenantResponseDto(dto);
  return {
    id: n.id,
    name: n.name,
    description: (n.description ?? '').trim(),
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
    const tid = str(a.testId);
    const list = byTest.get(tid) ?? [];
    list.push(a);
    byTest.set(tid, list);
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
    const deptIds = [...new Set(group.map((g) => str(g.departmentId)))];
    const assignmentIds = group.map((g) => str(g.id));
    const dates = group
      .map((g) => g.createdAt)
      .filter((x): x is string => !!x)
      .sort();
    const testId = str(first.testId);
    rows.push({
      id: testId,
      testId,
      testTitle: title,
      assignedDepartmentIds: deptIds,
      assignmentIds,
      createdAt: dates[0] ?? new Date().toISOString(),
    });
  }
  return rows.sort((a, b) => a.testTitle.localeCompare(b.testTitle));
}
