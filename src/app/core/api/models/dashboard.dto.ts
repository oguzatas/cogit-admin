import type { AuditLogEntryDto } from '@/app/core/api/models/audit-log.dto';

export type DashboardFourthKpiLabel = 'active_tenants' | 'departments';

export interface DashboardKpisDto {
  activeTests: number;
  pendingAssignments: number;
  completedAssessments: number;
  fourthValue: number;
  fourthLabel: DashboardFourthKpiLabel;
}

export interface DashboardLineChartDto {
  labels: string[];
  data: number[];
}

export interface DashboardPieChartDto {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

export interface DashboardSnapshotDto {
  kpis: DashboardKpisDto;
  lineChart: DashboardLineChartDto;
  pieChart: DashboardPieChartDto;
  auditTrail: AuditLogEntryDto[];
}
