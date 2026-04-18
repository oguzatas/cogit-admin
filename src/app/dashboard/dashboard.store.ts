import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';
import { DashboardService } from '@/app/core/api/services/dashboard.service';
import type { AuditLogSeverity } from '@/app/core/api/models/audit-log.dto';
import type { DashboardSnapshotDto } from '@/app/core/api/models/dashboard.dto';

function auditMarkerColor(s: AuditLogSeverity): string {
  switch (s) {
    case 'success':
      return '#22c55e';
    case 'warn':
      return '#f97316';
    case 'danger':
      return '#ef4444';
    default:
      return '#0ea5e9';
  }
}

export interface DashboardTimelineEvent {
  id: string;
  message: string;
  actorInitials: string;
  occurredAt: string;
  severity: AuditLogSeverity;
  markerColor: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(DashboardService);
  private readonly claims = inject(AuthClaimsService);

  readonly loading = signal(false);
  readonly hasLoaded = signal(false);
  readonly snapshot = signal<DashboardSnapshotDto | null>(null);

  readonly isSuperAdmin = computed(() => this.claims.isSuperAdmin());
  readonly tenantId = computed(() => this.claims.tenantId());

  readonly timelineEvents = computed((): DashboardTimelineEvent[] => {
    const trail = this.snapshot()?.auditTrail ?? [];
    return trail.map((e) => ({
      id: e.id,
      message: e.message,
      actorInitials: e.actorInitials,
      occurredAt: e.occurredAt,
      severity: e.severity,
      markerColor: auditMarkerColor(e.severity),
    }));
  });

  readonly lineChartData = computed(() => {
    const lc = this.snapshot()?.lineChart;
    if (!lc) {
      return null;
    }
    return {
      labels: lc.labels,
      datasets: [
        {
          label: 'Completed assessments',
          data: lc.data,
          fill: true,
          tension: 0.35,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          pointBackgroundColor: 'rgb(14, 165, 233)',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  readonly pieChartData = computed(() => {
    const pc = this.snapshot()?.pieChart;
    if (!pc) {
      return null;
    }
    return {
      labels: pc.labels,
      datasets: [
        {
          data: pc.data,
          backgroundColor: pc.backgroundColor,
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  });

  load(): void {
    this.claims.syncFromAccessToken();
    this.loading.set(true);
    this.api
      .loadSnapshot$({
        isSuperAdmin: this.claims.isSuperAdmin(),
        tenantId: this.claims.tenantId(),
      })
      .subscribe({
        next: (s) => {
          this.snapshot.set(s);
          this.loading.set(false);
          this.hasLoaded.set(true);
        },
        error: () => {
          this.snapshot.set(null);
          this.loading.set(false);
          this.hasLoaded.set(true);
        },
      });
  }
}
